import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { ContentService } from '../content/content.service';
import type { ContentDocument } from '../content/schemas/content.schema';
import { AiService } from '../ai/ai.service';
import { EmbeddingService } from '../ai/embedding.service';
import { chunkText, cleanText, countWords } from '../ai/chunker';
import { VectorService } from '../vector/vector.service';
import { StorageService } from '../storage/storage.service';
import { UnsafeUrlError } from '../common/http/safe-fetch';
import { env } from '../config/env';
import { INGEST_QUEUE, IngestJob } from '../queue/queue.constants';
import { extractPdf, extractUrl, ExtractionError, type Extracted } from './extractors';

/**
 * The ingestion pipeline: extract → clean → enrich (LLM, optional) → chunk →
 * embed (local) → index. Idempotent: every run recomputes from the stored
 * document, so retries and re-processing are always safe.
 *
 * The LLM is an enhancement, not a dependency: if Gemini is unavailable or
 * fails, the item is still indexed and searchable.
 */
@Processor(INGEST_QUEUE, { concurrency: 2 })
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly content: ContentService,
    private readonly ai: AiService,
    private readonly embeddings: EmbeddingService,
    private readonly vectors: VectorService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<IngestJob>): Promise<{ chunks: number }> {
    const { contentId, reembedOnly } = job.data;
    const doc = await this.content.findByIdInternal(contentId);
    if (!doc) {
      this.logger.log(`Content ${contentId} no longer exists; skipping`);
      return { chunks: 0 };
    }

    try {
      if (!reembedOnly) await this.extractAndEnrich(doc);
      const chunks = await this.index(contentId);
      await this.content.setInternal(contentId, { $set: { status: 'ready' }, $unset: { error: 1 } });
      this.logger.log(`Indexed ${contentId} (${chunks} chunks)`);
      return { chunks };
    } catch (error: any) {
      const permanent = error instanceof ExtractionError || error instanceof UnsafeUrlError;
      const lastAttempt = permanent || job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      this.logger.warn(`Ingest ${contentId} failed (attempt ${job.attemptsMade + 1}): ${error.message}`);
      if (lastAttempt) {
        await this.content.setInternal(contentId, { $set: { status: 'failed', error: this.userMessage(error) } });
      }
      if (permanent) throw new UnrecoverableError(error.message);
      throw error;
    }
  }

  private userMessage(error: any): string {
    if (error instanceof ExtractionError || error instanceof UnsafeUrlError) return error.message;
    const msg = String(error?.message ?? '');
    if (/timed out/i.test(msg)) return 'The site took too long to respond.';
    if (/ENOTFOUND|resolve/i.test(msg)) return 'That website could not be reached.';
    if (/HTTP \d+/.test(msg)) return msg;
    if (/Embedding model/i.test(msg)) return 'Indexing is temporarily unavailable. Try reprocessing in a minute.';
    return 'Something went wrong while processing this item. Try reprocessing it.';
  }

  private async extractAndEnrich(doc: ContentDocument) {
    const id = doc._id.toString();
    let extracted: Extracted = { text: doc.extractedText ?? '' };
    const allowPrivate = !!env().ALLOW_PRIVATE_FETCH;

    if (doc.type === 'note') {
      extracted.text = doc.extractedText ?? '';
    } else if (doc.filePath && doc.type === 'pdf') {
      extracted = await extractPdf(await this.storage.read(doc.filePath));
    } else if (doc.filePath && doc.type === 'image') {
      extracted = await this.readImage(doc);
    } else if (doc.originalLink) {
      extracted = await extractUrl(doc.originalLink, allowPrivate);
    }

    const sourceText = cleanText(extracted.text);
    if (!sourceText) throw new ExtractionError('No readable text was found in this item.');

    const userTitled = !!doc.title?.trim();
    let title = doc.title?.trim() || extracted.title?.trim() || this.fallbackTitle(doc, sourceText);

    // Publish extraction results before slower translation, AI enrichment and
    // embedding work. This lets the UI show useful content while indexing runs.
    const earlyUpdates: Record<string, unknown> = { title: title.slice(0, 300) };
    if (extracted.siteName) earlyUpdates.siteName = extracted.siteName;
    if (extracted.author) earlyUpdates.author = extracted.author;
    if (extracted.imageUrl) earlyUpdates.imageUrl = extracted.imageUrl;
    if (doc.type === 'link' && extracted.kind === 'pdf') earlyUpdates.type = 'pdf';
    if (extracted.kind !== 'youtube') {
      earlyUpdates.extractedText = sourceText;
      earlyUpdates.wordCount = countWords(sourceText);
      const preview = extracted.description || sourceText;
      earlyUpdates.summary = preview.length > 220 ? `${preview.slice(0, 220).replace(/\s+\S*$/, '')}…` : preview;
    }
    await this.content.setInternal(id, { $set: earlyUpdates });

    let text = sourceText;
    if (extracted.kind === 'youtube' && this.ai.canTry()) {
      try {
        text = cleanText(await this.ai.translateToEnglish(sourceText));
      } catch (err: any) {
        this.logger.warn(`Translation failed for ${id}; keeping the original transcript: ${err.message}`);
      }
    }

    const updates: Record<string, unknown> = {
      extractedText: text,
      wordCount: countWords(text),
      title: title.slice(0, 300),
    };
    if (extracted.kind === 'youtube') updates.originalText = sourceText;
    if (extracted.siteName) updates.siteName = extracted.siteName;
    if (extracted.author) updates.author = extracted.author;
    if (extracted.imageUrl) updates.imageUrl = extracted.imageUrl;
    if (doc.type === 'link' && extracted.kind === 'pdf') updates.type = 'pdf';

    let summary = '';
    let keyPoints: string[] = [];
    let tags = doc.tags ?? [];

    if (this.ai.canTry()) {
      try {
        const e = await this.ai.enrich(text, { title, type: doc.type, url: doc.originalLink });
        if (!userTitled && e.title) title = e.title;
        summary = e.summary;
        keyPoints = e.keyPoints;
        tags = [...new Set([...tags, ...e.tags])].slice(0, 12);
      } catch (err: any) {
        this.logger.warn(`Enrichment failed for ${id}; indexing without it: ${err.message}`);
      }
    }

    if (!summary && extracted.description) summary = extracted.description.slice(0, 300);
    if (!summary) {
      // Notes: preview what follows the title; other items: the opening text.
      const rest = doc.type === 'note' && text.startsWith(title.replace(/…$/, '')) ? text.slice(title.length).trim() : text;
      const base = doc.type === 'note' ? rest : text;
      summary = base.length > 220 ? `${base.slice(0, 220).replace(/\s+\S*$/, '')}…` : base;
    }

    Object.assign(updates, { title: title.slice(0, 300), summary, keyPoints, tags });
    await this.content.setInternal(id, { $set: updates });
  }

  private async readImage(doc: ContentDocument): Promise<Extracted> {
    const label = doc.title || doc.fileName || 'Image';
    if (!this.ai.canTry()) return { text: label };
    let reading;
    try {
      reading = await this.ai.readImage(await this.storage.read(doc.filePath!), doc.mimeType ?? 'image/png');
    } catch (err: any) {
      this.logger.warn(`Image reading failed for ${doc._id}; storing without text: ${err.message}`);
      return { text: label };
    }
    const text = [reading.description, reading.text ? `Text in image:\n${reading.text}` : ''].filter(Boolean).join('\n\n');
    return { text: text || label, title: reading.title };
  }

  private fallbackTitle(doc: ContentDocument, text: string): string {
    if (doc.type === 'note') {
      const line = text.split('\n')[0].replace(/^#+\s*/, '').trim();
      const first = line.match(/^.{12,}?[.!?](?=\s|$)/)?.[0] ?? line;
      return first.length > 80 ? `${first.slice(0, 77).trimEnd()}…` : first || 'Untitled note';
    }
    if (doc.fileName) return doc.fileName.replace(/\.[a-z0-9]+$/i, '');
    if (doc.originalLink) {
      try {
        const u = new URL(doc.originalLink);
        return `${u.hostname.replace(/^www\./, '')}${u.pathname.length > 1 ? u.pathname : ''}`.slice(0, 120);
      } catch {
        /* ignore */
      }
    }
    return 'Untitled';
  }

  /** Chunk + embed + replace the item's vectors. */
  private async index(contentId: string): Promise<number> {
    const doc = await this.content.findByIdInternal(contentId);
    if (!doc) return 0;
    const userId = doc.userId.toString();
    const text = [doc.annotation ? `My notes: ${doc.annotation}` : '', doc.extractedText ?? ''].filter(Boolean).join('\n\n');
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new ExtractionError('No readable text was found in this item.');

    // Prefix with the title so short chunks keep their context in vector space.
    const vectors = await this.embeddings.embedMany(chunks.map((c) => `${doc.title ?? ''}\n${c}`));
    await this.vectors.deleteByContent(contentId, userId);
    await this.vectors.upsert(
      chunks.map((chunk, i) => ({
        id: randomUUID(),
        vector: vectors[i],
        payload: { contentId, userId, text: chunk, chunkIndex: i, title: doc.title ?? '', type: doc.type },
      })),
    );
    return chunks.length;
  }
}

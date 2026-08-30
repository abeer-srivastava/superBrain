import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ContentService } from '../../content/content.service';
import { AiService } from '../../ai/ai.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { VectorService } from '../../vector/vector.service';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import * as pdf from 'pdf-parse';
import * as fs from 'fs/promises';
import { YoutubeTranscript } from 'youtube-transcript';

/** Timeout for external HTTP fetches (30 seconds) */
const FETCH_TIMEOUT_MS = 30_000;

@Processor('extraction')
export class ExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    private contentService: ContentService,
    private aiService: AiService,
    private embeddingService: EmbeddingService,
    private vectorService: VectorService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} for content ${job.data.contentId}`);
    const { contentId, type, originalLink, extractedText, isLocalFile } = job.data;

    try {
      // Fetch current state from DB to enable idempotent retries
      const existingContent = await this.contentService.findById(contentId);

      // ──────────────────────────────────────────────────────────────────
      // Phase 1: Text Extraction — SKIP if content already has extractedText
      // ──────────────────────────────────────────────────────────────────
      let textToProcess = existingContent?.extractedText || extractedText || '';

      if (!textToProcess) {
        this.logger.log(`Extracting text for content ${contentId} (type: ${type})`);
        if (isLocalFile) {
          textToProcess = await this.extractFromFile(originalLink, type);
        } else if (type === 'link' && originalLink) {
          if (originalLink.toLowerCase().endsWith('.pdf')) {
            textToProcess = await this.extractFromPdf(originalLink);
          } else if (this.isYouTubeUrl(originalLink)) {
            textToProcess = await this.extractFromYouTube(originalLink);
          } else {
            textToProcess = await this.extractFromLink(originalLink);
          }
        } else if (type === 'pdf' && originalLink) {
          textToProcess = await this.extractFromPdf(originalLink);
        }
      } else {
        this.logger.log(`Skipping extraction — content ${contentId} already has extractedText`);
      }

      if (!textToProcess) {
        throw new Error('No text extracted from content');
      }

      // Sanitize: remove control characters, excessive whitespace, null bytes
      textToProcess = textToProcess
        .replace(/\0/g, '')                    // null bytes
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '') // control chars (preserve \n, \r, \t)
        .replace(/[ \t]+/g, ' ')               // collapse horizontal whitespace
        .replace(/\n{3,}/g, '\n\n')            // collapse excessive newlines
        .trim();

      // Truncate absurdly long texts to prevent API timeouts
      const MAX_WORDS = 100_000;
      const words = textToProcess.split(/\s+/);
      if (words.length > MAX_WORDS) {
        this.logger.warn(`Text for content ${contentId} has ${words.length} words — truncating to ${MAX_WORDS}`);
        textToProcess = words.slice(0, MAX_WORDS).join(' ');
      }

      // ──────────────────────────────────────────────────────────────────
      // Phase 2: AI Summarization & Tagging — SKIP if already done
      // ──────────────────────────────────────────────────────────────────
      let summary = existingContent?.summary || '';
      let tags: string[] = existingContent?.tags?.length ? existingContent.tags : [];

      if (!summary || tags.length === 0) {
        this.logger.log(`Generating summary and tags for content ${contentId}`);
        const [newSummary, newTags] = await Promise.all([
          summary ? Promise.resolve(summary) : this.aiService.summarizeContent(textToProcess),
          tags.length > 0 ? Promise.resolve(tags) : this.aiService.generateTags(textToProcess),
        ]);
        summary = newSummary;
        tags = newTags;
      } else {
        this.logger.log(`Skipping summarization — content ${contentId} already has summary/tags`);
      }

      // Phase 2b: Update metadata in Mongo (idempotent — safe to overwrite with same data)
      await this.contentService.updateStatus(contentId, { 
        extractedText: textToProcess,
        summary,
        tags
      });

      // ──────────────────────────────────────────────────────────────────
      // Phase 3: Chunking & Embedding — ALWAYS re-run
      // (This is the phase that most commonly fails, e.g. API errors)
      // ──────────────────────────────────────────────────────────────────

      // Clean up old vectors if any exist for this contentId
      try {
        await this.vectorService.deleteByContentId(contentId);
      } catch (err) {
        this.logger.warn(`Could not delete old vectors for contentId ${contentId}: ${err.message}`);
      }

      // Chunk the text
      const chunks = this.aiService.chunkText(textToProcess);
      this.logger.log(`Content ${contentId}: ${chunks.length} chunks to embed`);
      
      // Fetch content metadata for vector payloads
      const content = await this.contentService.findById(contentId);
      if (!content) {
        throw new Error(`Content not found after update: ${contentId}`);
      }

      // Embed all chunks locally — no API calls, no rate limits
      const embeddings = await this.embeddingService.embedMany(chunks);

      const points: { id: string; vector: number[]; payload: any }[] = [];
      for (let i = 0; i < chunks.length; i++) {
        points.push({
          id: randomUUID(),
          vector: embeddings[i],
          payload: {
            contentId,
            userId: content.userId.toString(),
            text: chunks[i],
            title: content.title || '',
            link: content.originalLink || '',
            type: content.type,
          },
        });
      }

      // Upsert all vectors
      await this.vectorService.upsertVectors(points);

      // Mark as ready
      await this.contentService.updateStatus(contentId, { status: 'ready' });

      this.logger.log(`Job ${job.id} completed successfully — ${points.length} vectors upserted`);
    } catch (error) {
      const attemptsMade = job.attemptsMade ?? 0;
      const maxAttempts = job.opts.attempts ?? 1;
      const isLastAttempt = (attemptsMade + 1) >= maxAttempts;

      this.logger.error(`Job ${job.id} failed (attempt ${attemptsMade + 1}/${maxAttempts})`, error);

      if (isLastAttempt) {
        await this.contentService.updateStatus(contentId, { status: 'failed' });
      }
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Content Extraction Methods (with timeouts)
  // ──────────────────────────────────────────────────────────────────────────

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s for URL: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async extractFromLink(url: string): Promise<string> {
    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status} ${response.statusText}): ${url}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text;
  }

  private async extractFromPdf(url: string): Promise<string> {
    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF (${response.status} ${response.statusText}): ${url}`);
    }
    const buffer = await response.arrayBuffer();
    const parse = (pdf as any).default || pdf;
    const data = await parse(Buffer.from(buffer));
    return data.text.replace(/\s+/g, ' ').trim();
  }

  private async extractFromFile(path: string, type: string): Promise<string> {
    const buffer = await fs.readFile(path);
    if (type === 'pdf') {
        const parse = (pdf as any).default || pdf;
        const data = await parse(buffer);
        return data.text.replace(/\s+/g, ' ').trim();
    } else if (type === 'image') {
        // OCR could be implemented here, for now just a placeholder or description
        return "Local image file uploaded. OCR processing pending implementation.";
    }
    return "";
  }

  private isYouTubeUrl(url: string): boolean {
    const normalized = url.toLowerCase();
    return normalized.includes('youtube.com') || normalized.includes('youtu.be');
  }

  private async extractFromYouTube(url: string): Promise<string> {
    try {
      this.logger.log(`Fetching transcript for YouTube video: ${url}`);
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript found');
      }
      return transcript.map((t) => t.text).join(' ');
    } catch (error) {
      this.logger.warn(`Failed to fetch YouTube transcript: ${error.message}. Falling back to standard link parsing.`);
      return this.extractFromLink(url);
    }
  }
}

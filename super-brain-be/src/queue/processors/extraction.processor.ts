import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ContentService } from '../../content/content.service';
import { AiService } from '../../ai/ai.service';
import { VectorService } from '../../vector/vector.service';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import * as pdf from 'pdf-parse';
import * as fs from 'fs/promises';

@Processor('extraction')
export class ExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    private contentService: ContentService,
    private aiService: AiService,
    private vectorService: VectorService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} for content ${job.data.contentId}`);
    const { contentId, type, originalLink, extractedText, isLocalFile } = job.data;

    try {
      let textToProcess = extractedText || '';

      // 1. Extraction Phase
      if (!textToProcess) {
          if (isLocalFile) {
              textToProcess = await this.extractFromFile(originalLink, type);
          } else if (type === 'link' && originalLink) {
              if (originalLink.toLowerCase().endsWith('.pdf')) {
                  textToProcess = await this.extractFromPdf(originalLink);
              } else {
                  textToProcess = await this.extractFromLink(originalLink);
              }
          } else if (type === 'pdf' && originalLink) {
              textToProcess = await this.extractFromPdf(originalLink);
          }
      }

      if (!textToProcess) {
        throw new Error('No text extracted');
      }

      // 2. Update metadata in Mongo
      await this.contentService.updateStatus(contentId, { extractedText: textToProcess });

      // 3. Chunking
      const chunks = this.aiService.chunkText(textToProcess);
      
      // 4. Embedding & Vector Upsert
      const points = [];
      const content = await this.contentService.findById(contentId);
      if (!content) {
        throw new Error(`Content not found: ${contentId}`);
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.aiService.generateEmbedding(chunk);
        
        points.push({
          id: randomUUID(),
          vector: embedding,
          payload: {
            contentId,
            userId: content.userId.toString(),
            text: chunk,
            title: content.title || '',
            link: content.originalLink || '',
            type: content.type,
          },
        });
      }

      await this.vectorService.upsertVectors(points);

      // 5. Mark as ready
      await this.contentService.updateStatus(contentId, { status: 'ready' });

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed`, error);
      await this.contentService.updateStatus(contentId, { status: 'failed' });
      throw error;
    }
  }

  private async extractFromLink(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text;
  }

  private async extractFromPdf(url: string): Promise<string> {
    const response = await fetch(url);
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
}

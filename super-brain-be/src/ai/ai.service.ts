import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set! Embedding generation will fail.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini embedding service ready.');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured — GEMINI_API_KEY is missing');
    }

    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
      i += chunkSize - overlap;
    }
    return chunks;
  }
}

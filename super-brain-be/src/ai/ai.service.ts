import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService implements OnModuleInit {
  private pipeline: any;
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const { pipeline } = await import('@xenova/transformers');
      // Use Xenova's model for feature extraction
      this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.logger.log('Xenova pipeline loaded successfully.');
    } catch (error) {
      this.logger.error('Failed to load Xenova pipeline', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }
    const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
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

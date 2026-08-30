import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private extractor: any;
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2';
  readonly dimensions = 384;
  private modelReady = false;

  async onModuleInit() {
    let retries = 5;
    let delayMs = 5000;

    while (retries > 0) {
      try {
        this.logger.log(`Loading local embedding model: ${this.modelName} (Attempts left: ${retries})...`);
        const { pipeline, env } = await import('@huggingface/transformers');
        
        // Use HuggingFace mirror if the main domain is blocked in this region
        env.remoteHost = 'https://hf-mirror.com';
        
        this.extractor = await pipeline('feature-extraction', this.modelName, {
          dtype: 'fp32',
        });
        this.modelReady = true;
        this.logger.log(
          `Local embedding model loaded: ${this.modelName} (${this.dimensions}d) — no API calls needed`,
        );
        return; // Success, exit loop
      } catch (error) {
        retries--;
        this.logger.warn(`Failed to load embedding model: ${error.message}. Retrying in ${delayMs / 1000}s...`);
        if (retries === 0) {
          this.logger.error('Failed to load local embedding model after multiple attempts', error);
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Embed a single text string. Used for search queries.
   */
  async embedOne(text: string): Promise<number[]> {
    if (!this.modelReady) {
      throw new Error('Embedding model not loaded yet');
    }
    const truncated = text.substring(0, 8000);
    const output = await this.extractor(truncated, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  /**
   * Embed multiple texts efficiently. Used for document chunk embedding.
   * Processes in batches of 32 to manage memory — but there are NO rate limits.
   */
  async embedMany(texts: string[]): Promise<number[][]> {
    if (!this.modelReady) {
      throw new Error('Embedding model not loaded yet');
    }

    const BATCH_SIZE = 32;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

      this.logger.log(
        `Embedding batch ${batchIndex}/${totalBatches} (${batch.length} texts)`,
      );

      const truncatedBatch = batch.map((t) => t.substring(0, 8000));

      // Process each text individually to avoid memory issues with very long texts
      for (const text of truncatedBatch) {
        const output = await this.extractor(text, {
          pooling: 'mean',
          normalize: true,
        });
        allEmbeddings.push(Array.from(output.data as Float32Array));
      }
    }

    return allEmbeddings;
  }
}

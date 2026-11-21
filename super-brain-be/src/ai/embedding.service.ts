import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private extractor: any;
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2';
  readonly dimensions = 384;
  private modelReady = false;
  private initPromise: Promise<void> | null = null;

  onModuleInit() {
    // Load model asynchronously in the background so the NestJS HTTP server
    // starts listening on port 3000 immediately without blocking bootstrap.
    this.initPromise = this.loadModel();
  }

  private async loadModel(): Promise<void> {
    let retries = 3;
    let delayMs = 3000;

    while (retries > 0) {
      try {
        this.logger.log(`Loading local embedding model: ${this.modelName} (Attempts left: ${retries})...`);
        const { pipeline, env } = await import('@huggingface/transformers');

        // Allow overriding remote host via env, default to official huggingface.co
        if (process.env.HF_ENDPOINT) {
          env.remoteHost = process.env.HF_ENDPOINT;
        }

        this.extractor = await pipeline('feature-extraction', this.modelName, {
          dtype: 'fp32',
        });
        this.modelReady = true;
        this.logger.log(
          `Local embedding model loaded: ${this.modelName} (${this.dimensions}d) — ready for vector search`,
        );
        return;
      } catch (error: any) {
        retries--;
        this.logger.warn(`Failed to load embedding model: ${error.message}. Retrying in ${delayMs / 1000}s...`);
        if (retries === 0) {
          this.logger.error('Failed to load local embedding model after multiple attempts', error);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    }
  }

  private async ensureReady(timeoutMs = 60000): Promise<void> {
    if (this.modelReady && this.extractor) return;
    if (this.initPromise) {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding model loading timed out')), timeoutMs),
      );
      await Promise.race([this.initPromise, timeout]);
    }
    if (!this.modelReady) {
      throw new Error('Embedding model not ready yet');
    }
  }

  /**
   * Embed a single text string. Used for search queries.
   */
  async embedOne(text: string): Promise<number[]> {
    await this.ensureReady();
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
    await this.ensureReady();

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

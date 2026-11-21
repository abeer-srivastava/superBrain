import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

/**
 * Local sentence embeddings (all-MiniLM-L6-v2, 384d) via transformers.js.
 * Runs in-process: no API cost, no rate limits, and user text never leaves
 * the server for indexing. The model loads in the background so the HTTP
 * server starts immediately.
 */
@Injectable()
export class EmbeddingService implements OnModuleInit {
  private extractor: any;
  private readonly logger = new Logger(EmbeddingService.name);
  readonly modelName = 'Xenova/all-MiniLM-L6-v2';
  readonly dimensions = 384;
  private initPromise: Promise<void> | null = null;
  private ready = false;

  onModuleInit() {
    this.initPromise = this.loadModel();
  }

  isReady() {
    return this.ready;
  }

  private async loadModel(): Promise<void> {
    let delayMs = 3000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { pipeline, env } = await import('@huggingface/transformers');
        if (process.env.HF_ENDPOINT) env.remoteHost = process.env.HF_ENDPOINT;
        this.extractor = await pipeline('feature-extraction', this.modelName, { dtype: 'fp32' });
        this.ready = true;
        this.logger.log(`Embedding model ready: ${this.modelName} (${this.dimensions}d)`);
        return;
      } catch (error: any) {
        this.logger.warn(`Embedding model load failed (attempt ${attempt}/3): ${error.message}`);
        if (attempt === 3) return;
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
      }
    }
  }

  private async ensureReady(timeoutMs = 90_000): Promise<void> {
    if (this.ready) return;
    if (this.initPromise) {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Embedding model is still loading')), timeoutMs);
      });
      await Promise.race([this.initPromise, timeout]).finally(() => clearTimeout(timer));
    }
    if (!this.ready) throw new Error('Embedding model is not available');
  }

  async embedOne(text: string): Promise<number[]> {
    const [v] = await this.embedMany([text]);
    return v;
  }

  async embedMany(texts: string[], batchSize = 16): Promise<number[][]> {
    await this.ensureReady();
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 4000));
      const tensor = await this.extractor(batch, { pooling: 'mean', normalize: true });
      out.push(...(tensor.tolist() as number[][]));
    }
    return out;
  }
}

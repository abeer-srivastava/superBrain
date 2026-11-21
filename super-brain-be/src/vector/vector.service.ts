import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env';

export interface ChunkPayload {
  contentId: string;
  userId: string;
  text: string;
  chunkIndex: number;
  title: string;
  type: string;
}

export interface ChunkHit {
  id: string | number;
  score: number;
  payload: ChunkPayload;
}

/**
 * Every read and delete is scoped by userId as well as contentId, so a
 * forged contentId can never touch another user's vectors.
 */
@Injectable()
export class VectorService implements OnModuleInit {
  private readonly client: QdrantClient;
  private readonly collection = env().QDRANT_COLLECTION;
  readonly vectorSize = 384; // Xenova/all-MiniLM-L6-v2
  private readonly logger = new Logger(VectorService.name);
  private ready = false;

  constructor() {
    const url = env().QDRANT_URL;
    const options: ConstructorParameters<typeof QdrantClient>[0] = {
      url,
      apiKey: env().QDRANT_API_KEY || undefined,
      checkCompatibility: false,
    };
    // Qdrant client defaults to :6333 even for https URLs without an explicit port.
    if (url.startsWith('https://')) {
      const match = url.match(/:(\d+)\/?$/);
      options.port = match ? parseInt(match[1], 10) : 443;
    }
    this.client = new QdrantClient(options);
  }

  async onModuleInit() {
    try {
      await this.ensureCollection();
      this.ready = true;
    } catch (error: any) {
      this.logger.error(`Failed to initialise Qdrant collection: ${error.message}`);
    }
  }

  isReady() {
    return this.ready;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }

  private async ensureCollection() {
    const { collections } = await this.client.getCollections();
    if (!collections.find((c) => c.name === this.collection)) {
      await this.client.createCollection(this.collection, { vectors: { size: this.vectorSize, distance: 'Cosine' } });
      this.logger.log(`Created Qdrant collection ${this.collection} (${this.vectorSize}d)`);
    } else {
      const info = await this.client.getCollection(this.collection);
      const size = (info.config.params.vectors as { size?: number })?.size;
      if (size && size !== this.vectorSize) {
        // Never silently destroy data: an operator must re-index explicitly.
        throw new Error(
          `Collection ${this.collection} has ${size}d vectors but the embedding model produces ${this.vectorSize}d. ` +
            `Set QDRANT_COLLECTION to a new name and run "npm run reindex".`,
        );
      }
    }
    for (const field_name of ['userId', 'contentId', 'type']) {
      await this.client
        .createPayloadIndex(this.collection, { field_name, field_schema: 'keyword', wait: true })
        .catch(() => undefined);
    }
  }

  async upsert(points: { id: string; vector: number[]; payload: ChunkPayload }[]) {
    if (points.length === 0) return;
    for (let i = 0; i < points.length; i += 256) {
      await this.client.upsert(this.collection, { wait: true, points: points.slice(i, i + 256) as any });
    }
  }

  async search(vector: number[], userId: string, limit = 20, opts: { excludeContentId?: string; contentId?: string; type?: string } = {}) {
    const must: any[] = [{ key: 'userId', match: { value: userId } }];
    if (opts.type) must.push({ key: 'type', match: { value: opts.type } });
    if (opts.contentId) must.push({ key: 'contentId', match: { value: opts.contentId } });
    const must_not = opts.excludeContentId ? [{ key: 'contentId', match: { value: opts.excludeContentId } }] : [];
    const hits = await this.client.search(this.collection, {
      vector,
      limit,
      with_payload: true,
      filter: { must, must_not },
    });
    return hits as unknown as ChunkHit[];
  }

  /** Mean of the first few chunk vectors — a cheap "document vector" for similarity. */
  async documentVector(contentId: string, userId: string, sample = 4): Promise<number[] | null> {
    const { points } = await this.client.scroll(this.collection, {
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { key: 'contentId', match: { value: contentId } },
        ],
      },
      limit: sample,
      with_vector: true,
      with_payload: false,
    });
    const vectors = points.map((p) => p.vector as number[]).filter((v) => Array.isArray(v));
    if (vectors.length === 0) return null;
    const mean = new Array(vectors[0].length).fill(0);
    for (const v of vectors) for (let i = 0; i < v.length; i++) mean[i] += v[i] / vectors.length;
    return mean;
  }

  async deleteByContent(contentId: string, userId: string) {
    await this.client.delete(this.collection, {
      wait: true,
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { key: 'contentId', match: { value: contentId } },
        ],
      },
    });
  }

  async deleteByUser(userId: string) {
    await this.client.delete(this.collection, {
      wait: true,
      filter: { must: [{ key: 'userId', match: { value: userId } }] },
    });
  }
}

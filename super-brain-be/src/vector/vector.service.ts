import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorService implements OnModuleInit {
  private client: QdrantClient;
  private readonly collectionName = 'secondbrain';
  private readonly logger = new Logger(VectorService.name);

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('QDRANT_URL', 'http://127.0.0.1:6333');
    const options: any = {
      url,
      apiKey: this.configService.get<string>('QDRANT_API_KEY'),
      checkCompatibility: false,
    };

    // If it's HTTPS, force explicit port option to prevent client library from defaulting to 6333
    if (url.startsWith('https://')) {
      const match = url.match(/:(\d+)$/);
      options.port = match ? parseInt(match[1], 10) : 443;
    }

    this.client = new QdrantClient(options);
  }

  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.find((c) => c.name === this.collectionName);

      if (!exists) {
        await this.createCollection();
      } else {
        this.logger.log(`Using existing Qdrant collection: ${this.collectionName}`);
        // Ensure all required payload indexes exist (idempotent — Qdrant ignores duplicates)
        await this.ensurePayloadIndexes();
      }
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant collection', error);
    }
  }

  async createCollection() {
    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: 4096, // NVIDIA nv-embed-v1 dimension
        distance: 'Cosine',
      },
    });

    await this.ensurePayloadIndexes();
    this.logger.log(`Created Qdrant collection: ${this.collectionName} with dimension 4096 and payload indexes`);
  }

  /**
   * Idempotently creates all required payload indexes.
   * Qdrant's createPayloadIndex is a no-op if the index already exists,
   * so this is safe to call on every startup.
   */
  private async ensurePayloadIndexes() {
    const indexes: { field_name: string; field_schema: 'keyword' | 'integer' | 'float' | 'bool' | 'geo' | 'text' }[] = [
      { field_name: 'userId', field_schema: 'keyword' },
      { field_name: 'contentId', field_schema: 'keyword' },
    ];

    for (const idx of indexes) {
      try {
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: idx.field_name,
          field_schema: idx.field_schema,
          wait: true,
        });
        this.logger.log(`Ensured payload index: ${idx.field_name} (${idx.field_schema})`);
      } catch (error) {
        // Log but don't throw — index may already exist or be in progress
        this.logger.warn(`Could not create index for ${idx.field_name}: ${error.message ?? error}`);
      }
    }
  }

  async resetCollection() {
    try {
      await this.client.deleteCollection(this.collectionName);
      await this.createCollection();
      this.logger.log('Collection reset successfully');
    } catch (error) {
      this.logger.error('Failed to reset collection', error);
      throw error;
    }
  }

  async upsertVectors(points: { id: string; vector: number[]; payload: any }[]) {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points,
    });
  }

  async searchSimilar(vector: number[], userId: string, limit = 5) {
    return this.client.search(this.collectionName, {
      vector,
      limit,
      filter: {
        must: [
          {
            key: 'userId',
            match: {
              value: userId,
            },
          },
        ],
      },
    });
  }

  async deleteByContentId(contentId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'contentId',
              match: {
                value: contentId,
              },
            },
          ],
        },
      });
      this.logger.log(`Deleted vectors for contentId: ${contentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete vectors for contentId ${contentId}`, error);
      throw error;
    }
  }
}

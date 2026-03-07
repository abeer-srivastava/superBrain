import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorService implements OnModuleInit {
  private client: QdrantClient;
  private readonly collectionName = 'secondbrain';
  private readonly logger = new Logger(VectorService.name);

  constructor(private configService: ConfigService) {
    this.client = new QdrantClient({
      url: this.configService.get<string>('QDRANT_URL', 'http://127.0.0.1:6333'),
    });
  }

  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.find((c) => c.name === this.collectionName);

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 384, // MiniLM-L6-v2 dimension
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant collection', error);
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

  async deleteByContentId(contentId: string) {
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
  }
}

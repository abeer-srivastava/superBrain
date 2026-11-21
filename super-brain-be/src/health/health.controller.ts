import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type { Response } from 'express';
import { VectorService } from '../vector/vector.service';
import { QueueService } from '../queue/queue.service';
import { EmbeddingService } from '../ai/embedding.service';
import { AiService } from '../ai/ai.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly vectors: VectorService,
    private readonly queue: QueueService,
    private readonly embeddings: EmbeddingService,
    private readonly ai: AiService,
  ) {}

  /** Liveness: the process is up. */
  @Get()
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness: dependencies reachable. 503 if a hard dependency is down. */
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const [qdrant, redis] = await Promise.all([this.vectors.ping(), this.queue.ping()]);
    const checks = {
      mongo: this.mongo.readyState === 1,
      qdrant,
      redis,
      embeddings: this.embeddings.isReady(),
      llm: this.ai.status,
    };
    const ok = checks.mongo && checks.qdrant && checks.redis;
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return { status: ok ? 'ok' : 'degraded', checks };
  }

  /** Public capability flags the web app uses to adapt its UI. */
  @Get('features')
  features() {
    return { ai: this.ai.status, ask: this.ai.available, enrichment: this.ai.available, imageReading: this.ai.available };
  }
}

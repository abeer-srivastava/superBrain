import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';

/** Model access only — no controllers, no data-module dependencies. */
@Global()
@Module({
  providers: [AiService, EmbeddingService],
  exports: [AiService, EmbeddingService],
})
export class AiModule {}

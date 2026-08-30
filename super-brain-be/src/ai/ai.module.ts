import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';
import { AiController } from './ai.controller';
import { VectorModule } from '../vector/vector.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [VectorModule, forwardRef(() => ContentModule)],
  controllers: [AiController],
  providers: [AiService, EmbeddingService],
  exports: [AiService, EmbeddingService],
})
export class AiModule {}

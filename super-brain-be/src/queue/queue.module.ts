import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { ExtractionProcessor } from './processors/extraction.processor';
import { ContentModule } from '../content/content.module';
import { VectorModule } from '../vector/vector.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'extraction',
    }),
    forwardRef(() => ContentModule),
    VectorModule,
    AiModule,
  ],
  providers: [QueueService, ExtractionProcessor],
  exports: [QueueService],
})
export class QueueModule {}

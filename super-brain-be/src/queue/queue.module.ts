import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { INGEST_QUEUE } from './queue.constants';

/** Producer side only — the worker lives in IngestionModule. */
@Module({
  imports: [BullModule.registerQueue({ name: INGEST_QUEUE })],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}

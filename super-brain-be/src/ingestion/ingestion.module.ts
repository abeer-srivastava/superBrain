import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContentModule } from '../content/content.module';
import { INGEST_QUEUE } from '../queue/queue.constants';
import { IngestionProcessor } from './ingestion.processor';

/** The queue consumer. Can be split into a separate worker process later without code changes. */
@Module({
  imports: [BullModule.registerQueue({ name: INGEST_QUEUE }), ContentModule],
  providers: [IngestionProcessor],
})
export class IngestionModule {}

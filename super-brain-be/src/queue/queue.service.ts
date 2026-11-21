import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INGEST_QUEUE, IngestJob } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(INGEST_QUEUE) private readonly queue: Queue<IngestJob>) {}

  async enqueueIngest(contentId: string, opts: { reembedOnly?: boolean } = {}) {
    await this.queue.add(
      opts.reembedOnly ? 'reembed' : 'ingest',
      { contentId, reembedOnly: opts.reembedOnly },
      {
        // Unique id per enqueue; the worker is idempotent so retries are safe.
        jobId: `${opts.reembedOnly ? 'reembed' : 'ingest'}-${contentId}-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    );
  }

  async ping(): Promise<boolean> {
    try {
      const client = await this.queue.client;
      return (await client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async counts() {
    return this.queue.getJobCounts('waiting', 'active', 'failed', 'delayed');
  }
}

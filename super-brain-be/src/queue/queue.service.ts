import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('extraction') private extractionQueue: Queue) {}

  async addExtractionJob(contentId: string, type: string, payload: any) {
    await this.extractionQueue.add('extract', { contentId, type, ...payload });
  }
}

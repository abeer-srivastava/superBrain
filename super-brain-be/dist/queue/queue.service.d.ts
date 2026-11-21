import { Queue } from 'bullmq';
import { IngestJob } from './queue.constants';
export declare class QueueService {
    private readonly queue;
    constructor(queue: Queue<IngestJob>);
    enqueueIngest(contentId: string, opts?: {
        reembedOnly?: boolean;
    }): Promise<void>;
    ping(): Promise<boolean>;
    counts(): Promise<{
        [index: string]: number;
    }>;
}

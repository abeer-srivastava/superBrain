import { Queue } from 'bullmq';
export declare class QueueService {
    private extractionQueue;
    constructor(extractionQueue: Queue);
    addExtractionJob(contentId: string, type: string, payload: any): Promise<void>;
}

import { ContentService } from './content.service';
import { QueueService } from '../queue/queue.service';
import { VectorService } from '../vector/vector.service';
import type { Express } from 'express';
export declare class ContentController {
    private readonly contentService;
    private readonly queueService;
    private readonly vectorService;
    private readonly logger;
    constructor(contentService: ContentService, queueService: QueueService, vectorService: VectorService);
    create(req: any, body: any): Promise<any>;
    uploadFile(req: any, file: Express.Multer.File, body: any): Promise<any>;
    findAll(req: any): Promise<any[]>;
    delete(req: any, id: string): Promise<any>;
}

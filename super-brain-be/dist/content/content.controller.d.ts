import { ContentService } from './content.service';
import { QueueService } from '../queue/queue.service';
export declare class ContentController {
    private readonly contentService;
    private readonly queueService;
    constructor(contentService: ContentService, queueService: QueueService);
    create(req: any, body: any): Promise<import("./schemas/content.schema").ContentDocument>;
    uploadFile(req: any, file: Express.Multer.File, body: any): Promise<import("./schemas/content.schema").ContentDocument>;
    findAll(req: any): Promise<import("./schemas/content.schema").ContentDocument[]>;
    delete(req: any, id: string): Promise<any>;
}

import { ContentService } from './content.service';
import { QueueService } from '../queue/queue.service';
import { VectorService } from '../vector/vector.service';
export declare class ContentController {
    private readonly contentService;
    private readonly queueService;
    private readonly vectorService;
    private readonly logger;
    constructor(contentService: ContentService, queueService: QueueService, vectorService: VectorService);
    create(req: any, body: any): Promise<import("./schemas/content.schema").ContentDocument>;
    uploadFile(req: any, file: Express.Multer.File, body: any): Promise<import("./schemas/content.schema").ContentDocument>;
    findAll(req: any): Promise<import("./schemas/content.schema").ContentDocument[]>;
    delete(req: any, id: string): Promise<any>;
}

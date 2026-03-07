import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContentService } from '../../content/content.service';
import { AiService } from '../../ai/ai.service';
import { VectorService } from '../../vector/vector.service';
export declare class ExtractionProcessor extends WorkerHost {
    private contentService;
    private aiService;
    private vectorService;
    private readonly logger;
    constructor(contentService: ContentService, aiService: AiService, vectorService: VectorService);
    process(job: Job<any, any, string>): Promise<any>;
    private extractFromLink;
    private extractFromPdf;
    private extractFromFile;
}

import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContentService } from '../../content/content.service';
import { AiService } from '../../ai/ai.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { VectorService } from '../../vector/vector.service';
export declare class ExtractionProcessor extends WorkerHost {
    private contentService;
    private aiService;
    private embeddingService;
    private vectorService;
    private readonly logger;
    constructor(contentService: ContentService, aiService: AiService, embeddingService: EmbeddingService, vectorService: VectorService);
    process(job: Job<any, any, string>): Promise<any>;
    private fetchWithTimeout;
    private extractFromLink;
    private extractFromPdf;
    private extractFromFile;
    private isYouTubeUrl;
    private extractFromYouTube;
}

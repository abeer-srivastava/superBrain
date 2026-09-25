import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';
import { VectorService } from '../vector/vector.service';
import { ContentService } from '../content/content.service';
export declare class AiController {
    private aiService;
    private embeddingService;
    private vectorService;
    private contentService;
    private readonly logger;
    constructor(aiService: AiService, embeddingService: EmbeddingService, vectorService: VectorService, contentService: ContentService);
    search(req: any, query: string): Promise<any>;
    ask(req: any, body: {
        query: string;
        history?: {
            role: 'user' | 'assistant';
            content: string;
        }[];
    }): Promise<{
        answer: string;
        sources: any[];
    }>;
    reindex(req: any): Promise<{
        total: number;
        reindexed: number;
        skipped: number;
        failed: number;
        errors: {
            contentId: string;
            error: string;
        }[] | undefined;
    }>;
}

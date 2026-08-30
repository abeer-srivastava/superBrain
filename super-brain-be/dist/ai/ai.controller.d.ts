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
    search(req: any, query: string): Promise<{
        id: import("node_modules/@qdrant/js-client-rest/dist/types/openapi/generated_schema.js", { with: { "resolution-mode": "import" } }).components["schemas"]["ExtendedPointId"];
        version: number;
        score: number;
        payload?: import("node_modules/@qdrant/js-client-rest/dist/types/openapi/generated_schema.js", { with: { "resolution-mode": "import" } }).components["schemas"]["Payload"] | (Record<string, unknown> | null);
        vector?: import("node_modules/@qdrant/js-client-rest/dist/types/openapi/generated_schema.js", { with: { "resolution-mode": "import" } }).components["schemas"]["VectorStructOutput"] | (Record<string, unknown> | null);
        shard_key?: import("node_modules/@qdrant/js-client-rest/dist/types/openapi/generated_schema.js", { with: { "resolution-mode": "import" } }).components["schemas"]["ShardKey"] | (Record<string, unknown> | null);
        order_value?: import("node_modules/@qdrant/js-client-rest/dist/types/openapi/generated_schema.js", { with: { "resolution-mode": "import" } }).components["schemas"]["OrderValue"] | (Record<string, unknown> | null);
    }[]>;
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

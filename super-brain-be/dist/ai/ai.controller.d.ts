import { AiService } from './ai.service';
import { VectorService } from '../vector/vector.service';
export declare class AiController {
    private aiService;
    private vectorService;
    constructor(aiService: AiService, vectorService: VectorService);
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
        sources: (Record<string, unknown> | {
            [key: string]: unknown;
        } | null | undefined)[];
    }>;
}

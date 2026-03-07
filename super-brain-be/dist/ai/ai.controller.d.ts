import { AiService } from './ai.service';
import { VectorService } from '../vector/vector.service';
import { ConfigService } from '@nestjs/config';
export declare class AiController {
    private aiService;
    private vectorService;
    private configService;
    private genAI;
    constructor(aiService: AiService, vectorService: VectorService, configService: ConfigService);
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
    }): Promise<{
        answer: string;
        context: string;
        sources?: undefined;
    } | {
        answer: string;
        sources: (Record<string, unknown> | {
            [key: string]: unknown;
        } | null | undefined)[];
        context?: undefined;
    }>;
}

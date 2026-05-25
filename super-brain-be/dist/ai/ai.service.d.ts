import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private genAI;
    private readonly logger;
    private readonly nvidiaApiKey;
    private readonly nvidiaModel;
    private readonly nvidiaUrl;
    constructor(configService: ConfigService);
    generateEmbedding(text: string, isQuery?: boolean): Promise<number[]>;
    private runWithRetry;
    summarizeContent(text: string): Promise<string>;
    generateTags(text: string): Promise<string[]>;
    askQuestion(context: string, question: string, history?: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<string>;
    chunkText(text: string, chunkSize?: number, overlap?: number): string[];
}

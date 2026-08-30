import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private genAI;
    private logger;
    private readonly llmModel;
    constructor(configService: ConfigService);
    private runWithRetry;
    summarizeContent(text: string): Promise<string>;
    generateTags(text: string): Promise<string[]>;
    askQuestion(context: string, question: string, history?: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<string>;
    chunkText(text: string, maxWords?: number, overlapWords?: number): string[];
}

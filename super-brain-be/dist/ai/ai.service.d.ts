import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private genAI;
    private readonly logger;
    constructor(configService: ConfigService);
    generateEmbedding(text: string): Promise<number[]>;
    chunkText(text: string, chunkSize?: number, overlap?: number): string[];
}

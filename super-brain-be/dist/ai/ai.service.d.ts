import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AiService implements OnModuleInit {
    private configService;
    private pipeline;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    generateEmbedding(text: string): Promise<number[]>;
    chunkText(text: string, chunkSize?: number, overlap?: number): string[];
}

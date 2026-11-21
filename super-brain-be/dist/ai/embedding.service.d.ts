import { OnModuleInit } from '@nestjs/common';
export declare class EmbeddingService implements OnModuleInit {
    private extractor;
    private readonly logger;
    readonly modelName = "Xenova/all-MiniLM-L6-v2";
    readonly dimensions = 384;
    private initPromise;
    private ready;
    onModuleInit(): void;
    isReady(): boolean;
    private loadModel;
    private ensureReady;
    embedOne(text: string): Promise<number[]>;
    embedMany(texts: string[], batchSize?: number): Promise<number[][]>;
}

import { OnModuleInit } from '@nestjs/common';
export declare class EmbeddingService implements OnModuleInit {
    private extractor;
    private readonly logger;
    private readonly modelName;
    readonly dimensions = 384;
    private modelReady;
    private initPromise;
    onModuleInit(): void;
    private loadModel;
    private ensureReady;
    embedOne(text: string): Promise<number[]>;
    embedMany(texts: string[]): Promise<number[][]>;
}

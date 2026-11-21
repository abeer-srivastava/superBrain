import { OnModuleInit } from '@nestjs/common';
export interface Enrichment {
    title?: string;
    summary: string;
    keyPoints: string[];
    tags: string[];
}
export interface ImageReading {
    title: string;
    description: string;
    text: string;
}
export declare class LlmUnavailableError extends Error {
    constructor();
}
export declare class AiService implements OnModuleInit {
    private readonly logger;
    private readonly genAI;
    readonly model: string;
    constructor();
    onModuleInit(): void;
    private authFailure;
    get available(): boolean;
    get status(): 'ok' | 'missing' | 'rejected';
    private isAuthError;
    private call;
    private lastProbe;
    canTry(): boolean;
    private client;
    private isRateLimit;
    private isTransient;
    private withRetry;
    enrich(text: string, hints: {
        title?: string;
        type: string;
        url?: string;
    }): Promise<Enrichment>;
    translateToEnglish(text: string): Promise<string>;
    readImage(data: Buffer, mimeType: string): Promise<ImageReading>;
    streamAnswer(sourcesBlock: string, question: string, history: {
        role: 'user' | 'assistant';
        content: string;
    }[]): AsyncGenerator<string, void, unknown>;
    titleFor(question: string): Promise<string>;
}

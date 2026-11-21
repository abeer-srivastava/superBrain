import { OnModuleInit } from '@nestjs/common';
export interface ChunkPayload {
    contentId: string;
    userId: string;
    text: string;
    chunkIndex: number;
    title: string;
    type: string;
}
export interface ChunkHit {
    id: string | number;
    score: number;
    payload: ChunkPayload;
}
export declare class VectorService implements OnModuleInit {
    private readonly client;
    private readonly collection;
    readonly vectorSize = 384;
    private readonly logger;
    private ready;
    constructor();
    onModuleInit(): Promise<void>;
    isReady(): boolean;
    ping(): Promise<boolean>;
    private ensureCollection;
    upsert(points: {
        id: string;
        vector: number[];
        payload: ChunkPayload;
    }[]): Promise<void>;
    search(vector: number[], userId: string, limit?: number, opts?: {
        excludeContentId?: string;
        contentId?: string;
        type?: string;
    }): Promise<ChunkHit[]>;
    documentVector(contentId: string, userId: string, sample?: number): Promise<number[] | null>;
    deleteByContent(contentId: string, userId: string): Promise<void>;
    deleteByUser(userId: string): Promise<void>;
}

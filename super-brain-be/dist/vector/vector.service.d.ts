import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class VectorService implements OnModuleInit {
    private configService;
    private client;
    private readonly collectionName;
    private readonly vectorSize;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    createCollection(): Promise<void>;
    private ensurePayloadIndexes;
    resetCollection(): Promise<void>;
    upsertVectors(points: {
        id: string;
        vector: number[];
        payload: any;
    }[]): Promise<void>;
    searchSimilar(vector: number[], userId: string, limit?: number): Promise<any>;
    deleteByContentId(contentId: string): Promise<void>;
}

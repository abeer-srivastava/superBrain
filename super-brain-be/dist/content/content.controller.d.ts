import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ContentService } from './content.service';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';
import { type AuthUser } from '../common/http/validation';
export declare class ContentController {
    private readonly content;
    private readonly queue;
    private readonly storage;
    constructor(content: ContentService, queue: QueueService, storage: StorageService);
    create(user: AuthUser, body: unknown): Promise<import("mongoose").Document<unknown, {}, import("./schemas/content.schema").Content, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/content.schema").Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    upload(user: AuthUser, file: Express.Multer.File | undefined, body: unknown): Promise<{
        userId: import("mongoose").Types.ObjectId;
        type: import("./schemas/content.schema").ContentType;
        originalLink?: string;
        title?: string;
        extractedText?: string;
        originalText?: string;
        summary?: string;
        keyPoints: string[];
        tags: string[];
        annotation?: string;
        siteName?: string;
        author?: string;
        imageUrl?: string;
        wordCount?: number;
        fileName?: string;
        mimeType?: string;
        fileSize?: number;
        status: import("./schemas/content.schema").ContentStatus;
        error?: string;
        favorite: boolean;
        isPrivate: boolean;
        lastViewedAt?: Date;
        createdAt?: Date;
        updatedAt?: Date;
        _id: import("mongoose").Types.ObjectId;
        __v: number;
    }>;
    list(user: AuthUser, query: unknown): Promise<{
        items: (import("./schemas/content.schema").Content & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        nextCursor: string | null;
    }>;
    stats(user: AuthUser): Promise<{
        total: any;
        favorites: any;
        processing: any;
        failed: any;
        words: any;
        thisWeek: any;
        byType: any;
        tags: {
            tag: string;
            count: number;
        }[];
    }>;
    resurface(user: AuthUser): Promise<(import("./schemas/content.schema").Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    reindex(user: AuthUser): Promise<{
        queued: number;
    }>;
    findOne(user: AuthUser, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/content.schema").Content, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/content.schema").Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    update(user: AuthUser, id: string, body: unknown): Promise<import("mongoose").Document<unknown, {}, import("./schemas/content.schema").Content, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/content.schema").Content & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    reprocess(user: AuthUser, id: string): Promise<{
        status: string;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        ok: boolean;
    }>;
    file(user: AuthUser, id: string, res: Response): Promise<StreamableFile>;
}

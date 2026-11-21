import { Model, Types } from 'mongoose';
import { Content, ContentDocument } from './schemas/content.schema';
import type { ListContentQuery, UpdateContentDto } from './dto/content.dto';
import { VectorService } from '../vector/vector.service';
import { StorageService } from '../storage/storage.service';
export declare class ContentService {
    private readonly model;
    private readonly vectors;
    private readonly storage;
    private readonly logger;
    constructor(model: Model<Content>, vectors: VectorService, storage: StorageService);
    create(data: Omit<Partial<Content>, 'userId'> & {
        userId: string;
    }): Promise<ContentDocument>;
    list(userId: string, q: ListContentQuery): Promise<{
        items: (Content & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        })[];
        nextCursor: string | null;
    }>;
    findOwned(id: string, userId: string, opts?: {
        withText?: boolean;
        withFile?: boolean;
    }): Promise<import("mongoose").Document<unknown, {}, Content, {}, import("mongoose").DefaultSchemaOptions> & Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    findByIdInternal(id: string): Promise<(import("mongoose").Document<unknown, {}, Content, {}, import("mongoose").DefaultSchemaOptions> & Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findManyOwned(ids: string[], userId: string): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    update(id: string, userId: string, dto: UpdateContentDto): Promise<import("mongoose").Document<unknown, {}, Content, {}, import("mongoose").DefaultSchemaOptions> & Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    setInternal(id: string, updates: Record<string, unknown>): Promise<import("mongoose").UpdateWriteOpResult>;
    markViewed(id: string, userId: string): Promise<import("mongoose").UpdateWriteOpResult>;
    delete(id: string, userId: string): Promise<void>;
    stats(userId: string): Promise<{
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
    resurface(userId: string, count?: number): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    idsWithText(userId?: string): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    keywordSearch(userId: string, query: string, limit: number, type?: string): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    titleSearch(userId: string, query: string, limit: number, type?: string): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    exportAll(userId: string): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    deleteAllForUser(userId: string): Promise<void>;
    findPublic(userId: string, limit?: number): Promise<(Content & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
}

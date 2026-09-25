import { Document, Types } from 'mongoose';
export type ContentDocument = Content & Document;
export declare class Content {
    userId: Types.ObjectId;
    type: string;
    originalLink?: string;
    title?: string;
    extractedText?: string;
    summary?: string;
    tags: string[];
    status: string;
}
export declare const ContentSchema: any;

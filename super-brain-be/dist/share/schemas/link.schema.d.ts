import { Document, Types } from 'mongoose';
export type LinkDocument = Link & Document;
export declare class Link {
    userId: Types.ObjectId;
    hash: string;
}
export declare const LinkSchema: any;

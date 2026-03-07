import { Model } from 'mongoose';
import { Content, ContentDocument } from './schemas/content.schema';
export declare class ContentService {
    private contentModel;
    constructor(contentModel: Model<ContentDocument>);
    create(createDto: any): Promise<ContentDocument>;
    findByUser(userId: string): Promise<ContentDocument[]>;
    findById(id: string): Promise<ContentDocument | null>;
    updateStatus(id: string, updates: Partial<Content>): Promise<ContentDocument | null>;
    delete(id: string, userId: string): Promise<any>;
}

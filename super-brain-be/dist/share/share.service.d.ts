import { Model } from 'mongoose';
import { LinkDocument } from './schemas/link.schema';
export declare class ShareService {
    private linkModel;
    constructor(linkModel: Model<LinkDocument>);
    createShareLink(userId: string): Promise<string>;
    disableShareLink(userId: string): Promise<void>;
    getUserIdByHash(hash: string): Promise<string | null>;
}

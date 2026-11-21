import { Model } from 'mongoose';
import { Link } from './schemas/link.schema';
export declare class ShareService {
    private readonly linkModel;
    constructor(linkModel: Model<Link>);
    private newHash;
    status(userId: string): Promise<{
        enabled: boolean;
        hash: string | null;
    }>;
    enable(userId: string): Promise<{
        enabled: boolean;
        hash: string;
    }>;
    disable(userId: string): Promise<{
        enabled: boolean;
        hash: null;
    }>;
    rotate(userId: string): Promise<{
        enabled: boolean;
        hash: string;
    }>;
    userIdByHash(hash: string): Promise<string | null>;
}

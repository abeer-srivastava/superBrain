import { type AuthUser } from '../common/http/validation';
import { ShareService } from './share.service';
import { ContentService } from '../content/content.service';
import { UserService } from '../user/user.service';
export declare class ShareController {
    private readonly share;
    private readonly content;
    private readonly users;
    constructor(share: ShareService, content: ContentService, users: UserService);
    status(user: AuthUser): Promise<{
        enabled: boolean;
        hash: string | null;
    }>;
    toggle(user: AuthUser, body: unknown): Promise<{
        enabled: boolean;
        hash: string;
    }> | Promise<{
        enabled: boolean;
        hash: null;
    }>;
    rotate(user: AuthUser): Promise<{
        enabled: boolean;
        hash: string;
    }>;
    publicBrain(hash: string): Promise<{
        owner: {
            username: string;
            displayName: string | null;
        };
        items: {
            userId: import("mongoose").Types.ObjectId;
            type: import("../content/schemas/content.schema").ContentType;
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
            filePath?: string;
            fileName?: string;
            mimeType?: string;
            fileSize?: number;
            status: import("../content/schemas/content.schema").ContentStatus;
            error?: string;
            favorite: boolean;
            isPrivate: boolean;
            lastViewedAt?: Date;
            createdAt?: Date;
            updatedAt?: Date;
            __v: number;
            id: string;
        }[];
    }>;
}

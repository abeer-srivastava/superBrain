import { ShareService } from './share.service';
import { ContentService } from '../content/content.service';
import { UserService } from '../user/user.service';
export declare class ShareController {
    private readonly shareService;
    private readonly contentService;
    private readonly userService;
    constructor(shareService: ShareService, contentService: ContentService, userService: UserService);
    toggleShare(req: any, body: {
        share: boolean;
    }): Promise<{
        hash: string;
        message?: undefined;
    } | {
        message: string;
        hash?: undefined;
    }>;
    getSharedBrain(hash: string): Promise<{
        username: string | undefined;
        content: import("../content/schemas/content.schema").ContentDocument[];
    }>;
}

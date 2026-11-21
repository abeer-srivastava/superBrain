import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ContentService } from '../content/content.service';
import { ConversationService } from '../search/conversation.service';
import { ShareService } from '../share/share.service';
import { VectorService } from '../vector/vector.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly users: UserService,
    private readonly content: ContentService,
    private readonly conversations: ConversationService,
    private readonly share: ShareService,
    private readonly vectors: VectorService,
    private readonly storage: StorageService,
  ) {}

  async export(userId: string) {
    const [user, items, threads, share] = await Promise.all([
      this.users.findById(userId),
      this.content.exportAll(userId),
      this.conversations.exportAll(userId),
      this.share.status(userId),
    ]);
    return {
      format: 'superbrain-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      account: this.users.toPublic(user!),
      sharing: { enabled: share.enabled },
      items,
      conversations: threads,
      note: 'Uploaded files are not embedded in this export; their extracted text is included in each item.',
    };
  }

  /**
   * Irreversible. Vectors and files go first so a partial failure never
   * leaves orphaned personal data behind a deleted account record.
   */
  async deleteEverything(userId: string) {
    await this.share.disable(userId);
    await this.vectors.deleteByUser(userId);
    await this.storage.removeUser(userId);
    await this.content.deleteAllForUser(userId);
    await this.conversations.deleteAllForUser(userId);
    await this.users.deleteById(userId);
    this.logger.log(`Deleted account ${userId} and all associated data`);
  }
}

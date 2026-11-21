import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Content } from '../content/schemas/content.schema';
import { QueueService } from '../queue/queue.service';
import { StorageService, sniffMime } from '../storage/storage.service';
import { env } from '../config/env';

/**
 * Idempotent, run-once data migrations. Each migration records its name in
 * the `migrations` collection after it succeeds.
 */
@Injectable()
export class MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Content.name) private readonly content: Model<Content>,
    private readonly queue: QueueService,
    private readonly storage: StorageService,
  ) {}

  async onApplicationBootstrap() {
    if (env().NODE_ENV === 'test') return;
    // Don't block startup.
    setTimeout(() => this.run().catch((e) => this.logger.error(`Migrations failed: ${e.message}`)), 2000);
  }

  private async run() {
    const migrations: [string, () => Promise<void>][] = [
      ['2026-11-legacy-uploads', () => this.legacyUploads()],
      ['2026-11-retry-failed', () => this.retryFailed()],
      ['2026-11-reembed-v2-chunks', () => this.reembedAll()],
    ];
    const col = this.connection.collection<{ _id: string; at: Date }>('migrations');
    for (const [name, fn] of migrations) {
      if (await col.findOne({ _id: name })) continue;
      this.logger.log(`Running migration ${name}`);
      await fn();
      await col.insertOne({ _id: name, at: new Date() });
    }
  }

  /** Old uploads stored a server path in `originalLink`. Move them into per-user storage. */
  private async legacyUploads() {
    const legacy = await this.content
      .find({ type: { $in: ['pdf', 'image'] }, originalLink: { $exists: true, $not: /^https?:\/\//i } })
      .select('+filePath')
      .exec();
    for (const doc of legacy) {
      const base = path.basename(doc.originalLink!);
      const old = path.resolve(process.cwd(), env().UPLOAD_DIR, base);
      try {
        const buf = await fs.readFile(old);
        const mime = sniffMime(buf);
        if (!mime) throw new Error('unrecognised file');
        const key = await this.storage.put(doc.userId.toString(), buf, mime);
        await this.content.updateOne(
          { _id: doc._id },
          { $set: { filePath: key, mimeType: mime, fileSize: buf.length, fileName: doc.fileName ?? base }, $unset: { originalLink: 1 } },
        );
        await fs.unlink(old).catch(() => undefined);
      } catch (e: any) {
        this.logger.warn(`Legacy upload ${doc._id} could not be migrated (${e.message}); clearing server path`);
        await this.content.updateOne({ _id: doc._id }, { $unset: { originalLink: 1 } });
      }
    }
    this.logger.log(`Migrated ${legacy.length} legacy uploads`);
  }

  /** Items that failed under the old pipeline (e.g. the pdf-parse v2 bug) get one more try. */
  private async retryFailed() {
    const failed = await this.content.find({ status: 'failed' }).select('_id type').lean().exec();
    for (const f of failed) {
      await this.content.updateOne({ _id: f._id }, { $set: { status: 'processing' }, $unset: { error: 1, ...(f.type !== 'note' ? { extractedText: 1 } : {}) } });
      await this.queue.enqueueIngest(f._id.toString());
    }
    this.logger.log(`Re-queued ${failed.length} previously failed items`);
  }

  /** Re-embed with the new chunk size (old chunks overflowed the model window). */
  private async reembedAll() {
    const items = await this.content.find({ status: 'ready', extractedText: { $exists: true, $ne: '' } }).select('_id').lean().exec();
    for (const i of items) await this.queue.enqueueIngest(i._id.toString(), { reembedOnly: true });
    this.logger.log(`Queued ${items.length} items for re-embedding`);
  }
}

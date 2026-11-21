import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Content, ContentDocument, LIST_PROJECTION } from './schemas/content.schema';
import type { ListContentQuery, UpdateContentDto } from './dto/content.dto';
import { VectorService } from '../vector/vector.service';
import { StorageService } from '../storage/storage.service';
import { assertObjectId } from '../common/http/validation';

const DAY = 24 * 60 * 60 * 1000;

/** Deterministic PRNG so "today's resurfacing" is stable across reloads. */
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(Content.name) private readonly model: Model<Content>,
    private readonly vectors: VectorService,
    private readonly storage: StorageService,
  ) {}

  create(data: Omit<Partial<Content>, 'userId'> & { userId: string }): Promise<ContentDocument> {
    return this.model.create({ ...data, userId: new Types.ObjectId(data.userId) });
  }

  async list(userId: string, q: ListContentQuery) {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };
    if (q.type) filter.type = q.type;
    if (q.tag) filter.tags = q.tag;
    if (q.favorite !== undefined) filter.favorite = q.favorite;
    if (q.status) filter.status = q.status;
    if (q.cursor) filter._id = { $lt: new Types.ObjectId(q.cursor) };

    const items = await this.model
      .find(filter)
      .sort({ _id: -1 })
      .limit(q.limit + 1)
      .select(LIST_PROJECTION)
      .lean()
      .exec();
    const hasMore = items.length > q.limit;
    const page = hasMore ? items.slice(0, q.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1]._id.toString() : null };
  }

  /** Fetch an item the user owns, or 404. Never reveals whether other users' ids exist. */
  async findOwned(id: string, userId: string, opts: { withText?: boolean; withFile?: boolean } = {}) {
    assertObjectId(id);
    const projection = [opts.withText ? '' : '-extractedText', opts.withFile ? '+filePath' : ''].filter(Boolean).join(' ');
    const query = this.model.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    const doc = await (projection ? query.select(projection) : query).exec();
    if (!doc) throw new NotFoundException('Item not found');
    return doc;
  }

  /** Internal (worker) lookup — no ownership scope. */
  findByIdInternal(id: string) {
    return this.model.findById(id).select('+filePath').exec();
  }

  findManyOwned(ids: string[], userId: string) {
    return this.model
      .find({ _id: { $in: ids.map((i) => new Types.ObjectId(i)) }, userId: new Types.ObjectId(userId) })
      .select(LIST_PROJECTION)
      .lean()
      .exec();
  }

  async update(id: string, userId: string, dto: UpdateContentDto) {
    const doc = await this.findOwned(id, userId);
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    for (const [k, v] of Object.entries(dto)) {
      if (k === 'extractedText' && doc.type !== 'note') continue;
      if (v === null) unset[k] = 1;
      else set[k] = v;
    }
    const updated = await this.model
      .findOneAndUpdate(
        { _id: doc._id, userId: doc.userId },
        { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { returnDocument: 'after' },
      )
      .select('-filePath')
      .exec();
    return updated!;
  }

  setInternal(id: string, updates: Record<string, unknown>) {
    return this.model.updateOne({ _id: id }, updates).exec();
  }

  markViewed(id: string, userId: string) {
    return this.model.updateOne({ _id: id, userId: new Types.ObjectId(userId) }, { lastViewedAt: new Date() }).exec();
  }

  async delete(id: string, userId: string) {
    const doc = await this.findOwned(id, userId, { withFile: true });
    await this.model.deleteOne({ _id: doc._id, userId: doc.userId }).exec();
    // Best-effort cleanup — ownership was already verified above.
    await this.vectors.deleteByContent(id, userId).catch((e) => this.logger.warn(`Vector cleanup failed for ${id}: ${e.message}`));
    if (doc.filePath) await this.storage.remove(doc.filePath);
  }

  async stats(userId: string) {
    const uid = new Types.ObjectId(userId);
    const [byType, tags, totals] = await Promise.all([
      this.model.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      this.model.aggregate([
        { $match: { userId: uid } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 60 },
      ]),
      this.model.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            favorites: { $sum: { $cond: ['$favorite', 1, 0] } },
            processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            words: { $sum: { $ifNull: ['$wordCount', 0] } },
            thisWeek: { $sum: { $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 7 * DAY)] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const t = totals[0] ?? { total: 0, favorites: 0, processing: 0, failed: 0, words: 0, thisWeek: 0 };
    return {
      total: t.total,
      favorites: t.favorites,
      processing: t.processing,
      failed: t.failed,
      words: t.words,
      thisWeek: t.thisWeek,
      byType: Object.fromEntries(byType.map((b) => [b._id, b.count])),
      tags: tags.map((x) => ({ tag: x._id as string, count: x.count as number })),
    };
  }

  /**
   * "Resurface": a few older items you have not looked at recently, chosen
   * deterministically per user per day so the selection is stable all day.
   */
  async resurface(userId: string, count = 3) {
    const uid = new Types.ObjectId(userId);
    const now = Date.now();
    const candidates = await this.model
      .find({
        userId: uid,
        status: 'ready',
        createdAt: { $lte: new Date(now - 2 * DAY) },
        $or: [{ lastViewedAt: { $exists: false } }, { lastViewedAt: { $lte: new Date(now - 3 * DAY) } }],
      })
      .sort({ lastViewedAt: 1, createdAt: 1 })
      .limit(60)
      .select(LIST_PROJECTION)
      .lean()
      .exec();
    const rand = seededRandom(`${userId}:${new Date().toISOString().slice(0, 10)}`);
    // Weight older, never-viewed items higher.
    const scored = candidates.map((c) => {
      const ageDays = (now - new Date(c.createdAt!).getTime()) / DAY;
      const weight = Math.log2(2 + ageDays) * (c.lastViewedAt ? 1 : 1.6) * (c.favorite ? 1.3 : 1);
      return { c, key: Math.pow(rand(), 1 / weight) };
    });
    return scored.sort((a, b) => b.key - a.key).slice(0, count).map((s) => s.c);
  }

  /** Items whose text should be re-embedded (used by reindex). */
  idsWithText(userId?: string) {
    const filter: Record<string, any> = { extractedText: { $exists: true, $ne: '' } };
    if (userId) filter.userId = new Types.ObjectId(userId);
    return this.model.find(filter).select('_id').lean().exec();
  }

  /** Full keyword search over the user's library (Mongo text index). */
  keywordSearch(userId: string, query: string, limit: number, type?: string) {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId), $text: { $search: query } };
    if (type) filter.type = type;
    return this.model
      .find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('_id title extractedText summary')
      .lean()
      .exec();
  }

  /** Title prefix/substring match — catches partial words the text index misses. */
  titleSearch(userId: string, query: string, limit: number, type?: string) {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escaped.length < 2) return Promise.resolve([]);
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId), title: { $regex: escaped, $options: 'i' } };
    if (type) filter.type = type;
    return this.model.find(filter).sort({ _id: -1 }).limit(limit).select('_id title summary').lean().exec();
  }

  // ── Account-level operations ──────────────────────────────────────────

  exportAll(userId: string) {
    return this.model.find({ userId: new Types.ObjectId(userId) }).select('-filePath -userId -__v').sort({ createdAt: 1 }).lean().exec();
  }

  async deleteAllForUser(userId: string) {
    await this.model.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  }

  /** Public page: sanitized metadata only — never full text, notes, files or annotations. */
  findPublic(userId: string, limit = 500) {
    return this.model
      .find({ userId: new Types.ObjectId(userId), status: 'ready', isPrivate: { $ne: true }, type: { $in: ['link', 'pdf'] }, originalLink: { $regex: '^https?://' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title type originalLink summary tags siteName imageUrl createdAt')
      .lean()
      .exec();
  }
}

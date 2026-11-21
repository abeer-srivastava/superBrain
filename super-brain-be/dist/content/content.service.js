"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const content_schema_1 = require("./schemas/content.schema");
const vector_service_1 = require("../vector/vector.service");
const storage_service_1 = require("../storage/storage.service");
const validation_1 = require("../common/http/validation");
const DAY = 24 * 60 * 60 * 1000;
function seededRandom(seed) {
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
let ContentService = ContentService_1 = class ContentService {
    model;
    vectors;
    storage;
    logger = new common_1.Logger(ContentService_1.name);
    constructor(model, vectors, storage) {
        this.model = model;
        this.vectors = vectors;
        this.storage = storage;
    }
    create(data) {
        return this.model.create({ ...data, userId: new mongoose_2.Types.ObjectId(data.userId) });
    }
    async list(userId, q) {
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        if (q.type)
            filter.type = q.type;
        if (q.tag)
            filter.tags = q.tag;
        if (q.favorite !== undefined)
            filter.favorite = q.favorite;
        if (q.status)
            filter.status = q.status;
        if (q.cursor)
            filter._id = { $lt: new mongoose_2.Types.ObjectId(q.cursor) };
        const items = await this.model
            .find(filter)
            .sort({ _id: -1 })
            .limit(q.limit + 1)
            .select(content_schema_1.LIST_PROJECTION)
            .lean()
            .exec();
        const hasMore = items.length > q.limit;
        const page = hasMore ? items.slice(0, q.limit) : items;
        return { items: page, nextCursor: hasMore ? page[page.length - 1]._id.toString() : null };
    }
    async findOwned(id, userId, opts = {}) {
        (0, validation_1.assertObjectId)(id);
        const projection = [opts.withText ? '' : '-extractedText', opts.withFile ? '+filePath' : ''].filter(Boolean).join(' ');
        const query = this.model.findOne({ _id: id, userId: new mongoose_2.Types.ObjectId(userId) });
        const doc = await (projection ? query.select(projection) : query).exec();
        if (!doc)
            throw new common_1.NotFoundException('Item not found');
        return doc;
    }
    findByIdInternal(id) {
        return this.model.findById(id).select('+filePath').exec();
    }
    findManyOwned(ids, userId) {
        return this.model
            .find({ _id: { $in: ids.map((i) => new mongoose_2.Types.ObjectId(i)) }, userId: new mongoose_2.Types.ObjectId(userId) })
            .select(content_schema_1.LIST_PROJECTION)
            .lean()
            .exec();
    }
    async update(id, userId, dto) {
        const doc = await this.findOwned(id, userId);
        const set = {};
        const unset = {};
        for (const [k, v] of Object.entries(dto)) {
            if (k === 'extractedText' && doc.type !== 'note')
                continue;
            if (v === null)
                unset[k] = 1;
            else
                set[k] = v;
        }
        const updated = await this.model
            .findOneAndUpdate({ _id: doc._id, userId: doc.userId }, { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: 'after' })
            .select('-filePath')
            .exec();
        return updated;
    }
    setInternal(id, updates) {
        return this.model.updateOne({ _id: id }, updates).exec();
    }
    markViewed(id, userId) {
        return this.model.updateOne({ _id: id, userId: new mongoose_2.Types.ObjectId(userId) }, { lastViewedAt: new Date() }).exec();
    }
    async delete(id, userId) {
        const doc = await this.findOwned(id, userId, { withFile: true });
        await this.model.deleteOne({ _id: doc._id, userId: doc.userId }).exec();
        await this.vectors.deleteByContent(id, userId).catch((e) => this.logger.warn(`Vector cleanup failed for ${id}: ${e.message}`));
        if (doc.filePath)
            await this.storage.remove(doc.filePath);
    }
    async stats(userId) {
        const uid = new mongoose_2.Types.ObjectId(userId);
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
            tags: tags.map((x) => ({ tag: x._id, count: x.count })),
        };
    }
    async resurface(userId, count = 3) {
        const uid = new mongoose_2.Types.ObjectId(userId);
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
            .select(content_schema_1.LIST_PROJECTION)
            .lean()
            .exec();
        const rand = seededRandom(`${userId}:${new Date().toISOString().slice(0, 10)}`);
        const scored = candidates.map((c) => {
            const ageDays = (now - new Date(c.createdAt).getTime()) / DAY;
            const weight = Math.log2(2 + ageDays) * (c.lastViewedAt ? 1 : 1.6) * (c.favorite ? 1.3 : 1);
            return { c, key: Math.pow(rand(), 1 / weight) };
        });
        return scored.sort((a, b) => b.key - a.key).slice(0, count).map((s) => s.c);
    }
    idsWithText(userId) {
        const filter = { extractedText: { $exists: true, $ne: '' } };
        if (userId)
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        return this.model.find(filter).select('_id').lean().exec();
    }
    keywordSearch(userId, query, limit, type) {
        const filter = { userId: new mongoose_2.Types.ObjectId(userId), $text: { $search: query } };
        if (type)
            filter.type = type;
        return this.model
            .find(filter, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .select('_id title extractedText summary')
            .lean()
            .exec();
    }
    titleSearch(userId, query, limit, type) {
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (escaped.length < 2)
            return Promise.resolve([]);
        const filter = { userId: new mongoose_2.Types.ObjectId(userId), title: { $regex: escaped, $options: 'i' } };
        if (type)
            filter.type = type;
        return this.model.find(filter).sort({ _id: -1 }).limit(limit).select('_id title summary').lean().exec();
    }
    exportAll(userId) {
        return this.model.find({ userId: new mongoose_2.Types.ObjectId(userId) }).select('-filePath -userId -__v').sort({ createdAt: 1 }).lean().exec();
    }
    async deleteAllForUser(userId) {
        await this.model.deleteMany({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
    }
    findPublic(userId, limit = 500) {
        return this.model
            .find({ userId: new mongoose_2.Types.ObjectId(userId), status: 'ready', isPrivate: { $ne: true }, type: { $in: ['link', 'pdf'] }, originalLink: { $regex: '^https?://' } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title type originalLink summary tags siteName imageUrl createdAt')
            .lean()
            .exec();
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = ContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(content_schema_1.Content.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        vector_service_1.VectorService,
        storage_service_1.StorageService])
], ContentService);
//# sourceMappingURL=content.service.js.map
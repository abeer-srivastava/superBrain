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
var VectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const common_1 = require("@nestjs/common");
const js_client_rest_1 = require("@qdrant/js-client-rest");
const env_1 = require("../config/env");
let VectorService = VectorService_1 = class VectorService {
    client;
    collection = (0, env_1.env)().QDRANT_COLLECTION;
    vectorSize = 384;
    logger = new common_1.Logger(VectorService_1.name);
    ready = false;
    constructor() {
        const url = (0, env_1.env)().QDRANT_URL;
        const options = {
            url,
            apiKey: (0, env_1.env)().QDRANT_API_KEY || undefined,
            checkCompatibility: false,
        };
        if (url.startsWith('https://')) {
            const match = url.match(/:(\d+)\/?$/);
            options.port = match ? parseInt(match[1], 10) : 443;
        }
        this.client = new js_client_rest_1.QdrantClient(options);
    }
    async onModuleInit() {
        try {
            await this.ensureCollection();
            this.ready = true;
        }
        catch (error) {
            this.logger.error(`Failed to initialise Qdrant collection: ${error.message}`);
        }
    }
    isReady() {
        return this.ready;
    }
    async ping() {
        try {
            await this.client.getCollections();
            return true;
        }
        catch {
            return false;
        }
    }
    async ensureCollection() {
        const { collections } = await this.client.getCollections();
        if (!collections.find((c) => c.name === this.collection)) {
            await this.client.createCollection(this.collection, { vectors: { size: this.vectorSize, distance: 'Cosine' } });
            this.logger.log(`Created Qdrant collection ${this.collection} (${this.vectorSize}d)`);
        }
        else {
            const info = await this.client.getCollection(this.collection);
            const size = info.config.params.vectors?.size;
            if (size && size !== this.vectorSize) {
                throw new Error(`Collection ${this.collection} has ${size}d vectors but the embedding model produces ${this.vectorSize}d. ` +
                    `Set QDRANT_COLLECTION to a new name and run "npm run reindex".`);
            }
        }
        for (const field_name of ['userId', 'contentId', 'type']) {
            await this.client
                .createPayloadIndex(this.collection, { field_name, field_schema: 'keyword', wait: true })
                .catch(() => undefined);
        }
    }
    async upsert(points) {
        if (points.length === 0)
            return;
        for (let i = 0; i < points.length; i += 256) {
            await this.client.upsert(this.collection, { wait: true, points: points.slice(i, i + 256) });
        }
    }
    async search(vector, userId, limit = 20, opts = {}) {
        const must = [{ key: 'userId', match: { value: userId } }];
        if (opts.type)
            must.push({ key: 'type', match: { value: opts.type } });
        if (opts.contentId)
            must.push({ key: 'contentId', match: { value: opts.contentId } });
        const must_not = opts.excludeContentId ? [{ key: 'contentId', match: { value: opts.excludeContentId } }] : [];
        const hits = await this.client.search(this.collection, {
            vector,
            limit,
            with_payload: true,
            filter: { must, must_not },
        });
        return hits;
    }
    async documentVector(contentId, userId, sample = 4) {
        const { points } = await this.client.scroll(this.collection, {
            filter: {
                must: [
                    { key: 'userId', match: { value: userId } },
                    { key: 'contentId', match: { value: contentId } },
                ],
            },
            limit: sample,
            with_vector: true,
            with_payload: false,
        });
        const vectors = points.map((p) => p.vector).filter((v) => Array.isArray(v));
        if (vectors.length === 0)
            return null;
        const mean = new Array(vectors[0].length).fill(0);
        for (const v of vectors)
            for (let i = 0; i < v.length; i++)
                mean[i] += v[i] / vectors.length;
        return mean;
    }
    async deleteByContent(contentId, userId) {
        await this.client.delete(this.collection, {
            wait: true,
            filter: {
                must: [
                    { key: 'userId', match: { value: userId } },
                    { key: 'contentId', match: { value: contentId } },
                ],
            },
        });
    }
    async deleteByUser(userId) {
        await this.client.delete(this.collection, {
            wait: true,
            filter: { must: [{ key: 'userId', match: { value: userId } }] },
        });
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = VectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VectorService);
//# sourceMappingURL=vector.service.js.map
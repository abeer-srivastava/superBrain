"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmbeddingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const common_1 = require("@nestjs/common");
let EmbeddingService = EmbeddingService_1 = class EmbeddingService {
    extractor;
    logger = new common_1.Logger(EmbeddingService_1.name);
    modelName = 'Xenova/all-MiniLM-L6-v2';
    dimensions = 384;
    initPromise = null;
    ready = false;
    onModuleInit() {
        this.initPromise = this.loadModel();
    }
    isReady() {
        return this.ready;
    }
    async loadModel() {
        let delayMs = 3000;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const { pipeline, env } = await import('@huggingface/transformers');
                if (process.env.HF_ENDPOINT)
                    env.remoteHost = process.env.HF_ENDPOINT;
                this.extractor = await pipeline('feature-extraction', this.modelName, { dtype: 'fp32' });
                this.ready = true;
                this.logger.log(`Embedding model ready: ${this.modelName} (${this.dimensions}d)`);
                return;
            }
            catch (error) {
                this.logger.warn(`Embedding model load failed (attempt ${attempt}/3): ${error.message}`);
                if (attempt === 3)
                    return;
                await new Promise((r) => setTimeout(r, delayMs));
                delayMs *= 2;
            }
        }
    }
    async ensureReady(timeoutMs = 90_000) {
        if (this.ready)
            return;
        if (this.initPromise) {
            let timer;
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('Embedding model is still loading')), timeoutMs);
            });
            await Promise.race([this.initPromise, timeout]).finally(() => clearTimeout(timer));
        }
        if (!this.ready)
            throw new Error('Embedding model is not available');
    }
    async embedOne(text) {
        const [v] = await this.embedMany([text]);
        return v;
    }
    async embedMany(texts, batchSize = 16) {
        await this.ensureReady();
        const out = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 4000));
            const tensor = await this.extractor(batch, { pooling: 'mean', normalize: true });
            out.push(...tensor.tolist());
        }
        return out;
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = EmbeddingService_1 = __decorate([
    (0, common_1.Injectable)()
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map
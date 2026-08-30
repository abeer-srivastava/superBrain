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
    modelReady = false;
    async onModuleInit() {
        let retries = 5;
        let delayMs = 5000;
        while (retries > 0) {
            try {
                this.logger.log(`Loading local embedding model: ${this.modelName} (Attempts left: ${retries})...`);
                const { pipeline, env } = await import('@huggingface/transformers');
                env.remoteHost = 'https://hf-mirror.com';
                this.extractor = await pipeline('feature-extraction', this.modelName, {
                    dtype: 'fp32',
                });
                this.modelReady = true;
                this.logger.log(`Local embedding model loaded: ${this.modelName} (${this.dimensions}d) — no API calls needed`);
                return;
            }
            catch (error) {
                retries--;
                this.logger.warn(`Failed to load embedding model: ${error.message}. Retrying in ${delayMs / 1000}s...`);
                if (retries === 0) {
                    this.logger.error('Failed to load local embedding model after multiple attempts', error);
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                delayMs *= 2;
            }
        }
    }
    async embedOne(text) {
        if (!this.modelReady) {
            throw new Error('Embedding model not loaded yet');
        }
        const truncated = text.substring(0, 8000);
        const output = await this.extractor(truncated, {
            pooling: 'mean',
            normalize: true,
        });
        return Array.from(output.data);
    }
    async embedMany(texts) {
        if (!this.modelReady) {
            throw new Error('Embedding model not loaded yet');
        }
        const BATCH_SIZE = 32;
        const allEmbeddings = [];
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE);
            const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(texts.length / BATCH_SIZE);
            this.logger.log(`Embedding batch ${batchIndex}/${totalBatches} (${batch.length} texts)`);
            const truncatedBatch = batch.map((t) => t.substring(0, 8000));
            for (const text of truncatedBatch) {
                const output = await this.extractor(text, {
                    pooling: 'mean',
                    normalize: true,
                });
                allEmbeddings.push(Array.from(output.data));
            }
        }
        return allEmbeddings;
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = EmbeddingService_1 = __decorate([
    (0, common_1.Injectable)()
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map
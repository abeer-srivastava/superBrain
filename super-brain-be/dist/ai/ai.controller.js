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
var AiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const embedding_service_1 = require("./embedding.service");
const vector_service_1 = require("../vector/vector.service");
const content_service_1 = require("../content/content.service");
const crypto_1 = require("crypto");
const RELEVANCE_THRESHOLD = 0.1;
let AiController = AiController_1 = class AiController {
    aiService;
    embeddingService;
    vectorService;
    contentService;
    logger = new common_1.Logger(AiController_1.name);
    constructor(aiService, embeddingService, vectorService, contentService) {
        this.aiService = aiService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
        this.contentService = contentService;
    }
    async search(req, query) {
        try {
            if (!query)
                throw new common_1.BadRequestException('Query parameter q is required');
            const embedding = await this.embeddingService.embedOne(query);
            const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 10);
            const relevantResults = results.filter(r => r.score > RELEVANCE_THRESHOLD);
            return relevantResults;
        }
        catch (error) {
            this.logger.error('AI Search Error:', error);
            throw error;
        }
    }
    async ask(req, body) {
        try {
            if (!body.query)
                throw new common_1.BadRequestException('query is required in body');
            const embedding = await this.embeddingService.embedOne(body.query);
            const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);
            const relevantResults = results.filter(r => r.score > RELEVANCE_THRESHOLD);
            if (relevantResults.length === 0) {
                return {
                    answer: "I couldn't find any relevant content in your brain to answer this question.",
                    sources: []
                };
            }
            const contextChunks = relevantResults
                .map((r, i) => `[Source ${i + 1}: ${r.payload?.title || 'Untitled'}]\n${r.payload?.text}`)
                .filter(Boolean)
                .join('\n\n');
            const answer = await this.aiService.askQuestion(contextChunks, body.query, body.history);
            const seenContentIds = new Set();
            const uniqueSources = [];
            for (const r of relevantResults) {
                const cid = r.payload?.contentId;
                if (cid && !seenContentIds.has(cid)) {
                    seenContentIds.add(cid);
                    uniqueSources.push(r.payload);
                }
            }
            return {
                answer,
                sources: uniqueSources,
            };
        }
        catch (error) {
            this.logger.error('AI Ask Error:', error);
            throw error;
        }
    }
    async reindex(req) {
        this.logger.log(`Reindex requested by user ${req.user.userId}`);
        const allContent = await this.contentService.findByUser(req.user.userId);
        const toReindex = allContent.filter(c => c.extractedText && c.extractedText.length > 0);
        const skipped = allContent.length - toReindex.length;
        this.logger.log(`Reindexing ${toReindex.length} content items (skipping ${skipped} without text)`);
        let reindexed = 0;
        let failed = 0;
        const errors = [];
        for (const content of toReindex) {
            try {
                const contentId = content._id.toString();
                try {
                    await this.vectorService.deleteByContentId(contentId);
                }
                catch (err) {
                }
                const chunks = this.aiService.chunkText(content.extractedText);
                const embeddings = await this.embeddingService.embedMany(chunks);
                const points = [];
                for (let i = 0; i < chunks.length; i++) {
                    points.push({
                        id: (0, crypto_1.randomUUID)(),
                        vector: embeddings[i],
                        payload: {
                            contentId,
                            userId: content.userId.toString(),
                            text: chunks[i],
                            title: content.title || '',
                            link: content.originalLink || '',
                            type: content.type,
                        },
                    });
                }
                if (points.length > 0) {
                    await this.vectorService.upsertVectors(points);
                }
                await this.contentService.updateStatus(contentId, { status: 'ready' });
                reindexed++;
                this.logger.log(`Reindexed content ${contentId}: ${points.length} vectors`);
            }
            catch (err) {
                failed++;
                const contentId = content._id.toString();
                errors.push({ contentId, error: err.message });
                this.logger.error(`Failed to reindex content ${contentId}: ${err.message}`);
            }
        }
        const summary = {
            total: allContent.length,
            reindexed,
            skipped,
            failed,
            errors: errors.length > 0 ? errors : undefined,
        };
        this.logger.log(`Reindex complete: ${JSON.stringify(summary)}`);
        return summary;
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('ask'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "ask", null);
__decorate([
    (0, common_1.Post)('reindex'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "reindex", null);
exports.AiController = AiController = AiController_1 = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService,
        content_service_1.ContentService])
], AiController);
//# sourceMappingURL=ai.controller.js.map
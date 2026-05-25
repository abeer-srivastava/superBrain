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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const vector_service_1 = require("../vector/vector.service");
let AiController = class AiController {
    aiService;
    vectorService;
    constructor(aiService, vectorService) {
        this.aiService = aiService;
        this.vectorService = vectorService;
    }
    async search(req, query) {
        try {
            if (!query)
                throw new common_1.BadRequestException('Query parameter q is required');
            const embedding = await this.aiService.generateEmbedding(query);
            const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 10);
            return results;
        }
        catch (error) {
            console.error('AI Search Error:', error);
            throw error;
        }
    }
    async ask(req, body) {
        try {
            if (!body.query)
                throw new common_1.BadRequestException('query is required in body');
            const embedding = await this.aiService.generateEmbedding(body.query);
            const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);
            const contextChunks = results
                .map(r => r.payload?.text)
                .filter(Boolean)
                .join('\n\n');
            if (!contextChunks) {
                return {
                    answer: "I couldn't find any relevant content in your brain to answer this question.",
                    sources: []
                };
            }
            const answer = await this.aiService.askQuestion(contextChunks, body.query, body.history);
            return {
                answer,
                sources: results.map(r => r.payload),
            };
        }
        catch (error) {
            console.error('AI Ask Error:', error);
            throw error;
        }
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
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        vector_service_1.VectorService])
], AiController);
//# sourceMappingURL=ai.controller.js.map
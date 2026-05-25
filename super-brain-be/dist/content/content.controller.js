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
var ContentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const content_service_1 = require("./content.service");
const content_dto_1 = require("./dto/content.dto");
const queue_service_1 = require("../queue/queue.service");
const vector_service_1 = require("../vector/vector.service");
let ContentController = ContentController_1 = class ContentController {
    contentService;
    queueService;
    vectorService;
    logger = new common_1.Logger(ContentController_1.name);
    constructor(contentService, queueService, vectorService) {
        this.contentService = contentService;
        this.queueService = queueService;
        this.vectorService = vectorService;
    }
    async create(req, body) {
        const parsed = content_dto_1.CreateContentSchema.safeParse(body);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.format());
        }
        const newContent = await this.contentService.create({
            userId: req.user.userId,
            ...parsed.data,
            status: 'processing',
        });
        await this.queueService.addExtractionJob(newContent._id.toString(), newContent.type, parsed.data);
        return newContent;
    }
    async uploadFile(req, file, body) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const { title, type, extractedText } = body;
        if (!title || !type) {
            throw new common_1.BadRequestException('Title and type are required');
        }
        const newContent = await this.contentService.create({
            userId: req.user.userId,
            title,
            type,
            extractedText,
            originalLink: file.path,
            status: 'processing',
        });
        await this.queueService.addExtractionJob(newContent._id.toString(), newContent.type, {
            title,
            type,
            extractedText,
            originalLink: file.path,
            isLocalFile: true
        });
        return newContent;
    }
    async findAll(req) {
        return this.contentService.findByUser(req.user.userId);
    }
    async delete(req, id) {
        try {
            await this.vectorService.deleteByContentId(id);
        }
        catch (error) {
            this.logger.warn(`Failed to delete vectors for content ${id}, proceeding with content deletion: ${error.message ?? error}`);
        }
        return this.contentService.delete(id, req.user.userId);
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 }
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "delete", null);
exports.ContentController = ContentController = ContentController_1 = __decorate([
    (0, common_1.Controller)('content'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [content_service_1.ContentService,
        queue_service_1.QueueService,
        vector_service_1.VectorService])
], ContentController);
//# sourceMappingURL=content.controller.js.map
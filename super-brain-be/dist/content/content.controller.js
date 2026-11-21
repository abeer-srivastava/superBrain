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
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const content_service_1 = require("./content.service");
const content_dto_1 = require("./dto/content.dto");
const queue_service_1 = require("../queue/queue.service");
const storage_service_1 = require("../storage/storage.service");
const validation_1 = require("../common/http/validation");
const safe_fetch_1 = require("../common/http/safe-fetch");
const env_1 = require("../config/env");
let ContentController = class ContentController {
    content;
    queue;
    storage;
    constructor(content, queue, storage) {
        this.content = content;
        this.queue = queue;
        this.storage = storage;
    }
    async create(user, body) {
        const dto = (0, validation_1.parse)(content_dto_1.CreateContentSchema, body);
        if (dto.type !== 'note') {
            await (0, safe_fetch_1.assertPublicUrl)(dto.originalLink, !!(0, env_1.env)().ALLOW_PRIVATE_FETCH).catch((e) => {
                throw new common_1.BadRequestException(e.message);
            });
        }
        const doc = await this.content.create({ ...dto, userId: user.userId, status: 'processing' });
        await this.queue.enqueueIngest(doc._id.toString());
        return doc;
    }
    async upload(user, file, body) {
        if (!file)
            throw new common_1.BadRequestException('Choose a file to upload');
        const meta = (0, validation_1.parse)(content_dto_1.UploadMetaSchema, body);
        const mime = (0, storage_service_1.sniffMime)(file.buffer);
        if (!mime)
            throw new common_1.BadRequestException('Unsupported file. Upload a PDF, PNG, JPEG, WebP or GIF.');
        const key = await this.storage.put(user.userId, file.buffer, mime);
        const fileName = file.originalname.replace(/[^\w.\- ()]/g, '_').slice(0, 200);
        const doc = await this.content.create({
            userId: user.userId,
            type: mime === 'application/pdf' ? 'pdf' : 'image',
            title: meta.title,
            tags: meta.tags,
            annotation: meta.annotation,
            filePath: key,
            fileName,
            mimeType: mime,
            fileSize: file.size,
            status: 'processing',
        });
        await this.queue.enqueueIngest(doc._id.toString());
        const { filePath: _omit, ...safe } = doc.toObject();
        return safe;
    }
    list(user, query) {
        return this.content.list(user.userId, (0, validation_1.parse)(content_dto_1.ListContentQuerySchema, query));
    }
    stats(user) {
        return this.content.stats(user.userId);
    }
    resurface(user) {
        return this.content.resurface(user.userId);
    }
    async reindex(user) {
        const items = await this.content.idsWithText(user.userId);
        for (const item of items)
            await this.queue.enqueueIngest(item._id.toString(), { reembedOnly: true });
        return { queued: items.length };
    }
    async findOne(user, id) {
        const doc = await this.content.findOwned(id, user.userId, { withText: true });
        void this.content.markViewed(id, user.userId);
        return doc;
    }
    async update(user, id, body) {
        const dto = (0, validation_1.parse)(content_dto_1.UpdateContentSchema, body);
        const updated = await this.content.update(id, user.userId, dto);
        if (dto.extractedText !== undefined && updated.type === 'note') {
            await this.content.setInternal(id, { $set: { status: 'processing' } });
            await this.queue.enqueueIngest(id);
            updated.status = 'processing';
        }
        else if (dto.title !== undefined || dto.annotation !== undefined) {
            if (updated.status === 'ready')
                await this.queue.enqueueIngest(id, { reembedOnly: true });
        }
        return updated;
    }
    async reprocess(user, id) {
        const doc = await this.content.findOwned(id, user.userId);
        const unset = { error: 1, summary: 1 };
        if (doc.type !== 'note')
            unset.extractedText = 1;
        await this.content.setInternal(id, { $set: { status: 'processing', keyPoints: [] }, $unset: unset });
        await this.queue.enqueueIngest(id);
        return { status: 'processing' };
    }
    async remove(user, id) {
        await this.content.delete(id, user.userId);
        return { ok: true };
    }
    async file(user, id, res) {
        const doc = await this.content.findOwned(id, user.userId, { withFile: true });
        if (!doc.filePath || !doc.mimeType)
            throw new common_1.BadRequestException('This item has no file');
        res.set({
            'Content-Type': doc.mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName ?? 'file')}"`,
            'Cache-Control': 'private, max-age=3600',
            'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; sandbox",
        });
        return new common_1.StreamableFile(this.storage.stream(doc.filePath));
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60_000 } }),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: (0, env_1.env)().MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, validation_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('resurface'),
    __param(0, (0, validation_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "resurface", null);
__decorate([
    (0, common_1.Post)('reindex'),
    (0, common_1.HttpCode)(202),
    (0, throttler_1.Throttle)({ default: { limit: 2, ttl: 60 * 60_000 } }),
    __param(0, (0, validation_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "reindex", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/reprocess'),
    (0, common_1.HttpCode)(202),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60_000 } }),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "reprocess", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/file'),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "file", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('content'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [content_service_1.ContentService,
        queue_service_1.QueueService,
        storage_service_1.StorageService])
], ContentController);
//# sourceMappingURL=content.controller.js.map
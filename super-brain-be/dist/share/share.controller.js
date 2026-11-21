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
exports.ShareController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const zod_1 = require("zod");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const validation_1 = require("../common/http/validation");
const share_service_1 = require("./share.service");
const content_service_1 = require("../content/content.service");
const user_service_1 = require("../user/user.service");
const ToggleSchema = zod_1.z
    .object({ enabled: zod_1.z.boolean().optional(), share: zod_1.z.boolean().optional() })
    .refine((v) => v.enabled !== undefined || v.share !== undefined, 'enabled must be a boolean')
    .transform((v) => (v.enabled ?? v.share));
let ShareController = class ShareController {
    share;
    content;
    users;
    constructor(share, content, users) {
        this.share = share;
        this.content = content;
        this.users = users;
    }
    status(user) {
        return this.share.status(user.userId);
    }
    toggle(user, body) {
        return (0, validation_1.parse)(ToggleSchema, body) ? this.share.enable(user.userId) : this.share.disable(user.userId);
    }
    rotate(user) {
        return this.share.rotate(user.userId);
    }
    async publicBrain(hash) {
        const userId = await this.share.userIdByHash(hash);
        const user = userId ? await this.users.findById(userId) : null;
        if (!userId || !user)
            throw new common_1.NotFoundException('This page does not exist or is no longer shared');
        const items = await this.content.findPublic(userId);
        return {
            owner: { username: user.username, displayName: user.displayName ?? null },
            items: items.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
        };
    }
};
exports.ShareController = ShareController;
__decorate([
    (0, common_1.Get)('share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, validation_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShareController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('share'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, validation_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ShareController.prototype, "toggle", null);
__decorate([
    (0, common_1.Post)('share/rotate'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, validation_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShareController.prototype, "rotate", null);
__decorate([
    (0, common_1.Get)('public/:hash'),
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60_000 } }),
    __param(0, (0, common_1.Param)('hash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "publicBrain", null);
exports.ShareController = ShareController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [share_service_1.ShareService,
        content_service_1.ContentService,
        user_service_1.UserService])
], ShareController);
//# sourceMappingURL=share.controller.js.map
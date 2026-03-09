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
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const share_service_1 = require("./share.service");
const content_service_1 = require("../content/content.service");
const user_service_1 = require("../user/user.service");
let ShareController = class ShareController {
    shareService;
    contentService;
    userService;
    constructor(shareService, contentService, userService) {
        this.shareService = shareService;
        this.contentService = contentService;
        this.userService = userService;
    }
    async toggleShare(req, body) {
        if (typeof body.share !== 'boolean') {
            throw new common_1.BadRequestException('share must be a boolean');
        }
        if (body.share) {
            const hash = await this.shareService.createShareLink(req.user.userId);
            return { hash };
        }
        else {
            await this.shareService.disableShareLink(req.user.userId);
            return { message: 'Share link disabled' };
        }
    }
    async getSharedBrain(hash) {
        const userId = await this.shareService.getUserIdByHash(hash);
        if (!userId) {
            throw new common_1.NotFoundException('Shared brain not found');
        }
        const user = await this.userService.findById(userId);
        const content = await this.contentService.findByUser(userId);
        return {
            username: user?.username,
            content,
        };
    }
};
exports.ShareController = ShareController;
__decorate([
    (0, common_1.Post)('share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "toggleShare", null);
__decorate([
    (0, common_1.Get)(':shareLink'),
    __param(0, (0, common_1.Param)('shareLink')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "getSharedBrain", null);
exports.ShareController = ShareController = __decorate([
    (0, common_1.Controller)('brain'),
    __metadata("design:paramtypes", [share_service_1.ShareService,
        content_service_1.ContentService,
        user_service_1.UserService])
], ShareController);
//# sourceMappingURL=share.controller.js.map
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
exports.ShareService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const node_crypto_1 = require("node:crypto");
const link_schema_1 = require("./schemas/link.schema");
let ShareService = class ShareService {
    linkModel;
    constructor(linkModel) {
        this.linkModel = linkModel;
    }
    newHash() {
        return (0, node_crypto_1.randomBytes)(16).toString('base64url');
    }
    async status(userId) {
        const link = await this.linkModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).lean().exec();
        return { enabled: !!link, hash: link?.hash ?? null };
    }
    async enable(userId) {
        const existing = await this.linkModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (existing)
            return { enabled: true, hash: existing.hash };
        const link = await this.linkModel.create({ userId: new mongoose_2.Types.ObjectId(userId), hash: this.newHash() });
        return { enabled: true, hash: link.hash };
    }
    async disable(userId) {
        await this.linkModel.deleteMany({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        return { enabled: false, hash: null };
    }
    async rotate(userId) {
        await this.disable(userId);
        return this.enable(userId);
    }
    async userIdByHash(hash) {
        if (!/^[\w-]{10,64}$/.test(hash))
            return null;
        const link = await this.linkModel.findOne({ hash }).lean().exec();
        return link ? link.userId.toString() : null;
    }
};
exports.ShareService = ShareService;
exports.ShareService = ShareService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(link_schema_1.Link.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ShareService);
//# sourceMappingURL=share.service.js.map
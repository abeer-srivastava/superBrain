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
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const content_schema_1 = require("./schemas/content.schema");
let ContentService = class ContentService {
    contentModel;
    constructor(contentModel) {
        this.contentModel = contentModel;
    }
    async create(createDto) {
        const created = new this.contentModel(createDto);
        return created.save();
    }
    async findByUser(userId) {
        return this.contentModel.find({ userId }).exec();
    }
    async findById(id) {
        return this.contentModel.findById(id).exec();
    }
    async updateStatus(id, updates) {
        return this.contentModel.findByIdAndUpdate(id, updates, { new: true }).exec();
    }
    async delete(id, userId) {
        return this.contentModel.deleteOne({ _id: id, userId }).exec();
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(content_schema_1.Content.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ContentService);
//# sourceMappingURL=content.service.js.map
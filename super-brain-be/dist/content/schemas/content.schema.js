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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIST_PROJECTION = exports.ContentSchema = exports.Content = exports.CONTENT_STATUSES = exports.CONTENT_TYPES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.CONTENT_TYPES = ['link', 'note', 'pdf', 'image'];
exports.CONTENT_STATUSES = ['processing', 'ready', 'failed'];
let Content = class Content {
    userId;
    type;
    originalLink;
    title;
    extractedText;
    originalText;
    summary;
    keyPoints;
    tags;
    annotation;
    siteName;
    author;
    imageUrl;
    wordCount;
    filePath;
    fileName;
    mimeType;
    fileSize;
    status;
    error;
    favorite;
    isPrivate;
    lastViewedAt;
    createdAt;
    updatedAt;
};
exports.Content = Content;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Content.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, enum: exports.CONTENT_TYPES }),
    __metadata("design:type", String)
], Content.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "originalLink", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, maxlength: 300 }),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "extractedText", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Content.prototype, "originalText", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "summary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Content.prototype, "keyPoints", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [], index: true }),
    __metadata("design:type", Array)
], Content.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ maxlength: 20000 }),
    __metadata("design:type", String)
], Content.prototype, "annotation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "siteName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "author", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Content.prototype, "wordCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Content.prototype, "filePath", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "fileName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "mimeType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Content.prototype, "fileSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, enum: exports.CONTENT_STATUSES, default: 'processing' }),
    __metadata("design:type", String)
], Content.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Content.prototype, "error", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Content.prototype, "favorite", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Content.prototype, "isPrivate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Content.prototype, "lastViewedAt", void 0);
exports.Content = Content = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Content);
exports.ContentSchema = mongoose_1.SchemaFactory.createForClass(Content);
exports.ContentSchema.index({ userId: 1, createdAt: -1 });
exports.ContentSchema.index({ title: 'text', tags: 'text', summary: 'text', annotation: 'text', extractedText: 'text' }, {
    name: 'content_fulltext',
    weights: { title: 10, tags: 6, summary: 4, annotation: 3, extractedText: 1 },
    default_language: 'english',
});
exports.LIST_PROJECTION = '-extractedText -filePath';
//# sourceMappingURL=content.schema.js.map
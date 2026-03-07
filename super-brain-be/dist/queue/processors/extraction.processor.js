"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExtractionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const content_service_1 = require("../../content/content.service");
const ai_service_1 = require("../../ai/ai.service");
const vector_service_1 = require("../../vector/vector.service");
const cheerio = __importStar(require("cheerio"));
const crypto_1 = require("crypto");
const pdf = __importStar(require("pdf-parse"));
const fs = __importStar(require("fs/promises"));
let ExtractionProcessor = ExtractionProcessor_1 = class ExtractionProcessor extends bullmq_1.WorkerHost {
    contentService;
    aiService;
    vectorService;
    logger = new common_1.Logger(ExtractionProcessor_1.name);
    constructor(contentService, aiService, vectorService) {
        super();
        this.contentService = contentService;
        this.aiService = aiService;
        this.vectorService = vectorService;
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id} for content ${job.data.contentId}`);
        const { contentId, type, originalLink, extractedText, isLocalFile } = job.data;
        try {
            let textToProcess = extractedText || '';
            if (!textToProcess) {
                if (isLocalFile) {
                    textToProcess = await this.extractFromFile(originalLink, type);
                }
                else if (type === 'link' && originalLink) {
                    if (originalLink.toLowerCase().endsWith('.pdf')) {
                        textToProcess = await this.extractFromPdf(originalLink);
                    }
                    else {
                        textToProcess = await this.extractFromLink(originalLink);
                    }
                }
                else if (type === 'pdf' && originalLink) {
                    textToProcess = await this.extractFromPdf(originalLink);
                }
            }
            if (!textToProcess) {
                throw new Error('No text extracted');
            }
            await this.contentService.updateStatus(contentId, { extractedText: textToProcess });
            const chunks = this.aiService.chunkText(textToProcess);
            const points = [];
            const content = await this.contentService.findById(contentId);
            if (!content) {
                throw new Error(`Content not found: ${contentId}`);
            }
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = await this.aiService.generateEmbedding(chunk);
                points.push({
                    id: (0, crypto_1.randomUUID)(),
                    vector: embedding,
                    payload: {
                        contentId,
                        userId: content.userId.toString(),
                        text: chunk,
                        title: content.title || '',
                        link: content.originalLink || '',
                        type: content.type,
                    },
                });
            }
            await this.vectorService.upsertVectors(points);
            await this.contentService.updateStatus(contentId, { status: 'ready' });
            this.logger.log(`Job ${job.id} completed successfully`);
        }
        catch (error) {
            this.logger.error(`Job ${job.id} failed`, error);
            await this.contentService.updateStatus(contentId, { status: 'failed' });
            throw error;
        }
    }
    async extractFromLink(url) {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text;
    }
    async extractFromPdf(url) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const parse = pdf.default || pdf;
        const data = await parse(Buffer.from(buffer));
        return data.text.replace(/\s+/g, ' ').trim();
    }
    async extractFromFile(path, type) {
        const buffer = await fs.readFile(path);
        if (type === 'pdf') {
            const parse = pdf.default || pdf;
            const data = await parse(buffer);
            return data.text.replace(/\s+/g, ' ').trim();
        }
        else if (type === 'image') {
            return "Local image file uploaded. OCR processing pending implementation.";
        }
        return "";
    }
};
exports.ExtractionProcessor = ExtractionProcessor;
exports.ExtractionProcessor = ExtractionProcessor = ExtractionProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('extraction'),
    __metadata("design:paramtypes", [content_service_1.ContentService,
        ai_service_1.AiService,
        vector_service_1.VectorService])
], ExtractionProcessor);
//# sourceMappingURL=extraction.processor.js.map
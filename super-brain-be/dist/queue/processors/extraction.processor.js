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
const embedding_service_1 = require("../../ai/embedding.service");
const vector_service_1 = require("../../vector/vector.service");
const cheerio = __importStar(require("cheerio"));
const crypto_1 = require("crypto");
const pdf = __importStar(require("pdf-parse"));
const fs = __importStar(require("fs/promises"));
const youtube_transcript_1 = require("youtube-transcript");
const FETCH_TIMEOUT_MS = 30_000;
let ExtractionProcessor = ExtractionProcessor_1 = class ExtractionProcessor extends bullmq_1.WorkerHost {
    contentService;
    aiService;
    embeddingService;
    vectorService;
    logger = new common_1.Logger(ExtractionProcessor_1.name);
    constructor(contentService, aiService, embeddingService, vectorService) {
        super();
        this.contentService = contentService;
        this.aiService = aiService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id} for content ${job.data.contentId}`);
        const { contentId, type, originalLink, extractedText, isLocalFile } = job.data;
        try {
            const existingContent = await this.contentService.findById(contentId);
            let textToProcess = existingContent?.extractedText || extractedText || '';
            if (!textToProcess) {
                this.logger.log(`Extracting text for content ${contentId} (type: ${type})`);
                if (isLocalFile) {
                    textToProcess = await this.extractFromFile(originalLink, type);
                }
                else if (type === 'link' && originalLink) {
                    if (originalLink.toLowerCase().endsWith('.pdf')) {
                        textToProcess = await this.extractFromPdf(originalLink);
                    }
                    else if (this.isYouTubeUrl(originalLink)) {
                        textToProcess = await this.extractFromYouTube(originalLink);
                    }
                    else {
                        textToProcess = await this.extractFromLink(originalLink);
                    }
                }
                else if (type === 'pdf' && originalLink) {
                    textToProcess = await this.extractFromPdf(originalLink);
                }
            }
            else {
                this.logger.log(`Skipping extraction — content ${contentId} already has extractedText`);
            }
            if (!textToProcess) {
                throw new Error('No text extracted from content');
            }
            textToProcess = textToProcess
                .replace(/\0/g, '')
                .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            const MAX_WORDS = 100_000;
            const words = textToProcess.split(/\s+/);
            if (words.length > MAX_WORDS) {
                this.logger.warn(`Text for content ${contentId} has ${words.length} words — truncating to ${MAX_WORDS}`);
                textToProcess = words.slice(0, MAX_WORDS).join(' ');
            }
            let summary = existingContent?.summary || '';
            let tags = existingContent?.tags?.length ? existingContent.tags : [];
            if (!summary || tags.length === 0) {
                this.logger.log(`Generating summary and tags for content ${contentId}`);
                const [newSummary, newTags] = await Promise.all([
                    summary ? Promise.resolve(summary) : this.aiService.summarizeContent(textToProcess),
                    tags.length > 0 ? Promise.resolve(tags) : this.aiService.generateTags(textToProcess),
                ]);
                summary = newSummary;
                tags = newTags;
            }
            else {
                this.logger.log(`Skipping summarization — content ${contentId} already has summary/tags`);
            }
            await this.contentService.updateStatus(contentId, {
                extractedText: textToProcess,
                summary,
                tags
            });
            try {
                await this.vectorService.deleteByContentId(contentId);
            }
            catch (err) {
                this.logger.warn(`Could not delete old vectors for contentId ${contentId}: ${err.message}`);
            }
            const chunks = this.aiService.chunkText(textToProcess);
            this.logger.log(`Content ${contentId}: ${chunks.length} chunks to embed`);
            const content = await this.contentService.findById(contentId);
            if (!content) {
                throw new Error(`Content not found after update: ${contentId}`);
            }
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
            await this.vectorService.upsertVectors(points);
            await this.contentService.updateStatus(contentId, { status: 'ready' });
            this.logger.log(`Job ${job.id} completed successfully — ${points.length} vectors upserted`);
        }
        catch (error) {
            const attemptsMade = job.attemptsMade ?? 0;
            const maxAttempts = job.opts.attempts ?? 1;
            const isLastAttempt = (attemptsMade + 1) >= maxAttempts;
            this.logger.error(`Job ${job.id} failed (attempt ${attemptsMade + 1}/${maxAttempts})`, error);
            if (isLastAttempt) {
                await this.contentService.updateStatus(contentId, { status: 'failed' });
            }
            throw error;
        }
    }
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            return response;
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s for URL: ${url}`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async extractFromLink(url) {
        const response = await this.fetchWithTimeout(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL (${response.status} ${response.statusText}): ${url}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header, aside').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text;
    }
    async extractFromPdf(url) {
        const response = await this.fetchWithTimeout(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF (${response.status} ${response.statusText}): ${url}`);
        }
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
    isYouTubeUrl(url) {
        const normalized = url.toLowerCase();
        return normalized.includes('youtube.com') || normalized.includes('youtu.be');
    }
    async extractFromYouTube(url) {
        try {
            this.logger.log(`Fetching transcript for YouTube video: ${url}`);
            const transcript = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(url);
            if (!transcript || transcript.length === 0) {
                throw new Error('No transcript found');
            }
            return transcript.map((t) => t.text).join(' ');
        }
        catch (error) {
            this.logger.warn(`Failed to fetch YouTube transcript: ${error.message}. Falling back to standard link parsing.`);
            return this.extractFromLink(url);
        }
    }
};
exports.ExtractionProcessor = ExtractionProcessor;
exports.ExtractionProcessor = ExtractionProcessor = ExtractionProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('extraction'),
    __metadata("design:paramtypes", [content_service_1.ContentService,
        ai_service_1.AiService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService])
], ExtractionProcessor);
//# sourceMappingURL=extraction.processor.js.map
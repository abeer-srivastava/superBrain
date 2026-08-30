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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
let AiService = AiService_1 = class AiService {
    configService;
    genAI;
    logger = new common_1.Logger(AiService_1.name);
    llmModel = 'gemini-2.5-flash-lite';
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is not set! LLM features will fail.');
        }
        else {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.logger.log(`LLM service ready — model: ${this.llmModel}`);
        }
    }
    async runWithRetry(fn, maxRetries = 5, initialDelay = 5000) {
        let attempt = 0;
        while (true) {
            try {
                return await fn();
            }
            catch (error) {
                attempt++;
                const isRateLimit = error.status === 429 ||
                    (error.message && error.message.includes('429')) ||
                    (error.message && error.message.toLowerCase().includes('quota exceeded')) ||
                    (error.message && error.message.toLowerCase().includes('too many requests')) ||
                    (error.message && error.message.toLowerCase().includes('resource_exhausted'));
                if (isRateLimit && attempt < maxRetries) {
                    let delay = initialDelay * Math.pow(2, attempt - 1);
                    if (error.errorDetails && Array.isArray(error.errorDetails)) {
                        const retryInfo = error.errorDetails.find((d) => d.retryDelay || d['@type']?.includes('RetryInfo'));
                        if (retryInfo && retryInfo.retryDelay) {
                            const seconds = parseFloat(retryInfo.retryDelay);
                            if (!isNaN(seconds)) {
                                delay = Math.ceil(seconds + 1.5) * 1000;
                            }
                        }
                    }
                    this.logger.warn(`Gemini API rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw error;
                }
            }
        }
    }
    async summarizeContent(text) {
        if (!this.genAI) {
            throw new Error('Gemini API not configured');
        }
        try {
            return await this.runWithRetry(async () => {
                const model = this.genAI.getGenerativeModel({ model: this.llmModel });
                const prompt = `
You are a summarizing utility for a personal knowledge base.
Summarize the following content concisely (1-2 sentences, maximum 200 characters).

Rules:
1. Do NOT include any conversational filler, intro, or meta-commentary (e.g., do NOT start with "This summary is...", "Here is a summary...", "It appears...", "The text you pasted...", "This document contains...").
2. Start directly with the summarized content.
3. If the content is an error message, boilerplate code, login page, or blank/malformed page, summarize what it is directly in a few words (e.g., "Google Tag Manager tracking script" or "LeetCode error page").

Content:
${text.substring(0, 20000)}
`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            });
        }
        catch (error) {
            this.logger.error('Failed to generate summary after retries', error);
            return '';
        }
    }
    async generateTags(text) {
        if (!this.genAI) {
            throw new Error('Gemini API not configured');
        }
        try {
            return await this.runWithRetry(async () => {
                const model = this.genAI.getGenerativeModel({ model: this.llmModel });
                const prompt = `Based on the following content, generate 3-5 relevant single-word tags (lowercase) for a personal knowledge base. Return only the tags separated by commas: \n\n${text.substring(0, 10000)}`;
                const result = await model.generateContent(prompt);
                const tagsText = result.response.text();
                return tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
            });
        }
        catch (error) {
            this.logger.error('Failed to generate tags after retries', error);
            return [];
        }
    }
    async askQuestion(context, question, history) {
        if (!this.genAI) {
            throw new Error('Gemini API not configured');
        }
        try {
            return await this.runWithRetry(async () => {
                const model = this.genAI.getGenerativeModel({ model: this.llmModel });
                let historyText = '';
                if (history && history.length > 0) {
                    historyText = '\nConversation History:\n' + history
                        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                        .join('\n') + '\n';
                }
                const prompt = `
You are an intelligent personal knowledge assistant (2nd Brain).
The user is asking a question about their saved content (they might call it their brain, vault, bookmarks, notes, or links).
Answer the question based ONLY on the numbered sources below. These sources represent the most relevant content retrieved from their brain.
Cite source numbers in your answer like [1], [2] when referencing specific information.
If the sources do not contain enough information to answer the question, say "I don't have information about that in your saved content."
Be concise, direct, and helpful.

CRITICAL: You must respond in the same language as the user's question.

Sources from user's brain:
${context}
${historyText}
Question:
${question}
`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            });
        }
        catch (error) {
            this.logger.error('Failed to ask question after retries', error);
            throw error;
        }
    }
    chunkText(text, maxWords = 500, overlapWords = 100) {
        const sentences = text.match(/[^.!?\n]+(?:[.!?]+["'\u201d\u2019)}\]]*|$)|\n+/g) || [text];
        const cleanedSentences = sentences
            .map(s => s.trim())
            .filter(s => s.length > 0);
        if (cleanedSentences.length === 0) {
            return [text.trim()].filter(t => t.length > 0);
        }
        const chunks = [];
        let currentChunk = [];
        let currentWordCount = 0;
        for (const sentence of cleanedSentences) {
            const sentenceWordCount = sentence.split(/\s+/).length;
            if (currentWordCount + sentenceWordCount > maxWords && currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
                const overlapChunk = [];
                let overlapCount = 0;
                for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapWords; j--) {
                    overlapChunk.unshift(currentChunk[j]);
                    overlapCount += currentChunk[j].split(/\s+/).length;
                }
                currentChunk = overlapChunk;
                currentWordCount = overlapCount;
            }
            currentChunk.push(sentence);
            currentWordCount += sentenceWordCount;
        }
        if (currentChunk.length > 0) {
            const lastChunk = currentChunk.join(' ').trim();
            if (lastChunk.length > 0) {
                chunks.push(lastChunk);
            }
        }
        return chunks;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map
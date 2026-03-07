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
let AiService = AiService_1 = class AiService {
    configService;
    pipeline;
    logger = new common_1.Logger(AiService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        try {
            const { pipeline } = await import('@xenova/transformers');
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            this.logger.log('Xenova pipeline loaded successfully.');
        }
        catch (error) {
            this.logger.error('Failed to load Xenova pipeline', error);
        }
    }
    async generateEmbedding(text) {
        if (!this.pipeline) {
            throw new Error('Pipeline not initialized');
        }
        const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
    chunkText(text, chunkSize = 500, overlap = 100) {
        const words = text.split(/\s+/);
        const chunks = [];
        let i = 0;
        while (i < words.length) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            chunks.push(chunk);
            i += chunkSize - overlap;
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
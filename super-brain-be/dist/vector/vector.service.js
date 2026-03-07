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
var VectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const js_client_rest_1 = require("@qdrant/js-client-rest");
let VectorService = VectorService_1 = class VectorService {
    configService;
    client;
    collectionName = 'secondbrain';
    logger = new common_1.Logger(VectorService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.client = new js_client_rest_1.QdrantClient({
            url: this.configService.get('QDRANT_URL', 'http://127.0.0.1:6333'),
        });
    }
    async onModuleInit() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.find((c) => c.name === this.collectionName);
            if (!exists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 384,
                        distance: 'Cosine',
                    },
                });
                this.logger.log(`Created Qdrant collection: ${this.collectionName}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize Qdrant collection', error);
        }
    }
    async upsertVectors(points) {
        await this.client.upsert(this.collectionName, {
            wait: true,
            points,
        });
    }
    async searchSimilar(vector, userId, limit = 5) {
        return this.client.search(this.collectionName, {
            vector,
            limit,
            filter: {
                must: [
                    {
                        key: 'userId',
                        match: {
                            value: userId,
                        },
                    },
                ],
            },
        });
    }
    async deleteByContentId(contentId) {
        await this.client.delete(this.collectionName, {
            wait: true,
            filter: {
                must: [
                    {
                        key: 'contentId',
                        match: {
                            value: contentId,
                        },
                    },
                ],
            },
        });
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = VectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VectorService);
//# sourceMappingURL=vector.service.js.map
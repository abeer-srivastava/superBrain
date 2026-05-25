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
        const url = this.configService.get('QDRANT_URL', 'http://127.0.0.1:6333');
        const options = {
            url,
            apiKey: this.configService.get('QDRANT_API_KEY'),
            checkCompatibility: false,
        };
        if (url.startsWith('https://')) {
            const match = url.match(/:(\d+)$/);
            options.port = match ? parseInt(match[1], 10) : 443;
        }
        this.client = new js_client_rest_1.QdrantClient(options);
    }
    async onModuleInit() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.find((c) => c.name === this.collectionName);
            if (!exists) {
                await this.createCollection();
            }
            else {
                this.logger.log(`Using existing Qdrant collection: ${this.collectionName}`);
                await this.ensurePayloadIndexes();
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize Qdrant collection', error);
        }
    }
    async createCollection() {
        await this.client.createCollection(this.collectionName, {
            vectors: {
                size: 4096,
                distance: 'Cosine',
            },
        });
        await this.ensurePayloadIndexes();
        this.logger.log(`Created Qdrant collection: ${this.collectionName} with dimension 4096 and payload indexes`);
    }
    async ensurePayloadIndexes() {
        const indexes = [
            { field_name: 'userId', field_schema: 'keyword' },
            { field_name: 'contentId', field_schema: 'keyword' },
        ];
        for (const idx of indexes) {
            try {
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: idx.field_name,
                    field_schema: idx.field_schema,
                    wait: true,
                });
                this.logger.log(`Ensured payload index: ${idx.field_name} (${idx.field_schema})`);
            }
            catch (error) {
                this.logger.warn(`Could not create index for ${idx.field_name}: ${error.message ?? error}`);
            }
        }
    }
    async resetCollection() {
        try {
            await this.client.deleteCollection(this.collectionName);
            await this.createCollection();
            this.logger.log('Collection reset successfully');
        }
        catch (error) {
            this.logger.error('Failed to reset collection', error);
            throw error;
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
        try {
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
            this.logger.log(`Deleted vectors for contentId: ${contentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete vectors for contentId ${contentId}`, error);
            throw error;
        }
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = VectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VectorService);
//# sourceMappingURL=vector.service.js.map
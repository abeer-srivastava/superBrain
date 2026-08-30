"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const embedding_service_1 = require("./embedding.service");
const ai_controller_1 = require("./ai.controller");
const vector_module_1 = require("../vector/vector.module");
const content_module_1 = require("../content/content.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [vector_module_1.VectorModule, (0, common_1.forwardRef)(() => content_module_1.ContentModule)],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService, embedding_service_1.EmbeddingService],
        exports: [ai_service_1.AiService, embedding_service_1.EmbeddingService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map
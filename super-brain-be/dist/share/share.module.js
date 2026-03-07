"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const share_service_1 = require("./share.service");
const share_controller_1 = require("./share.controller");
const link_schema_1 = require("./schemas/link.schema");
const content_module_1 = require("../content/content.module");
const user_module_1 = require("../user/user.module");
let ShareModule = class ShareModule {
};
exports.ShareModule = ShareModule;
exports.ShareModule = ShareModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: link_schema_1.Link.name, schema: link_schema_1.LinkSchema }]),
            (0, common_1.forwardRef)(() => content_module_1.ContentModule),
            user_module_1.UserModule,
        ],
        controllers: [share_controller_1.ShareController],
        providers: [share_service_1.ShareService],
        exports: [share_service_1.ShareService],
    })
], ShareModule);
//# sourceMappingURL=share.module.js.map
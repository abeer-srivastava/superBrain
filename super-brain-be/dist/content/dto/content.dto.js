"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContentSchema = void 0;
const zod_1 = require("zod");
exports.CreateContentSchema = zod_1.z.object({
    type: zod_1.z.enum(['link', 'note', 'pdf', 'image']),
    originalLink: zod_1.z.string().optional(),
    extractedText: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=content.dto.js.map
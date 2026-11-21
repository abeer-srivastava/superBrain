"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListContentQuerySchema = exports.UpdateContentSchema = exports.UploadMetaSchema = exports.CreateContentSchema = void 0;
const zod_1 = require("zod");
const content_schema_1 = require("../schemas/content.schema");
const tag = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(32)
    .transform((t) => t.replace(/^#/, '').replace(/\s+/g, '-'));
const tags = zod_1.z.array(tag).max(20).optional();
const httpUrl = zod_1.z
    .string()
    .trim()
    .max(2048)
    .transform((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
    .pipe(zod_1.z.string().url('Enter a valid link'));
exports.CreateContentSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('link'),
        originalLink: httpUrl,
        title: zod_1.z.string().trim().max(300).optional(),
        tags,
        annotation: zod_1.z.string().max(20000).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('pdf'),
        originalLink: httpUrl,
        title: zod_1.z.string().trim().max(300).optional(),
        tags,
        annotation: zod_1.z.string().max(20000).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('note'),
        extractedText: zod_1.z.string().trim().min(1, 'A note needs some text').max(200_000),
        title: zod_1.z.string().trim().max(300).optional(),
        tags,
    }),
]);
exports.UploadMetaSchema = zod_1.z.object({
    title: zod_1.z.string().trim().max(300).optional(),
    tags: zod_1.z
        .string()
        .optional()
        .transform((s) => (s ? s.split(',').map((t) => t.trim()).filter(Boolean) : undefined))
        .pipe(tags),
    annotation: zod_1.z.string().max(20000).optional(),
});
exports.UpdateContentSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).max(300),
    tags: zod_1.z.array(tag).max(20),
    annotation: zod_1.z.string().max(20000).nullable(),
    favorite: zod_1.z.boolean(),
    isPrivate: zod_1.z.boolean(),
    extractedText: zod_1.z.string().trim().min(1).max(200_000),
})
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
exports.ListContentQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(content_schema_1.CONTENT_TYPES).optional(),
    tag: tag.optional(),
    favorite: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    status: zod_1.z.enum(['processing', 'ready', 'failed']).optional(),
    cursor: zod_1.z.string().regex(/^[a-f0-9]{24}$/i).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(30),
});
//# sourceMappingURL=content.dto.js.map
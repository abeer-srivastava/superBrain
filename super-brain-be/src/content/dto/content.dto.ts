import { z } from 'zod';
import { CONTENT_TYPES } from '../schemas/content.schema';

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(32)
  .transform((t) => t.replace(/^#/, '').replace(/\s+/g, '-'));

const tags = z.array(tag).max(20).optional();

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .transform((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
  .pipe(z.string().url('Enter a valid link'));

/**
 * Creating content by JSON. Files go through the multipart upload endpoint.
 * `type: 'pdf'` with a URL is accepted and treated as a link to a PDF.
 */
export const CreateContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('link'),
    originalLink: httpUrl,
    title: z.string().trim().max(300).optional(),
    tags,
    annotation: z.string().max(20000).optional(),
  }),
  z.object({
    type: z.literal('pdf'),
    originalLink: httpUrl,
    title: z.string().trim().max(300).optional(),
    tags,
    annotation: z.string().max(20000).optional(),
  }),
  z.object({
    type: z.literal('note'),
    extractedText: z.string().trim().min(1, 'A note needs some text').max(200_000),
    title: z.string().trim().max(300).optional(),
    tags,
  }),
]);

export const UploadMetaSchema = z.object({
  title: z.string().trim().max(300).optional(),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((t) => t.trim()).filter(Boolean) : undefined))
    .pipe(tags),
  annotation: z.string().max(20000).optional(),
});

export const UpdateContentSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    tags: z.array(tag).max(20),
    annotation: z.string().max(20000).nullable(),
    favorite: z.boolean(),
    isPrivate: z.boolean(),
    /** Only editable for notes. */
    extractedText: z.string().trim().min(1).max(200_000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const ListContentQuerySchema = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  tag: tag.optional(),
  favorite: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  status: z.enum(['processing', 'ready', 'failed']).optional(),
  cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateContentDto = z.infer<typeof CreateContentSchema>;
export type UpdateContentDto = z.infer<typeof UpdateContentSchema>;
export type ListContentQuery = z.infer<typeof ListContentQuerySchema>;

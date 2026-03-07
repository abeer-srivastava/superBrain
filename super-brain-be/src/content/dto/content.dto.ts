import { z } from 'zod';

export const CreateContentSchema = z.object({
  type: z.enum(['link', 'note', 'pdf', 'image']),
  originalLink: z.string().optional(),
  extractedText: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateContentDto = z.infer<typeof CreateContentSchema>;

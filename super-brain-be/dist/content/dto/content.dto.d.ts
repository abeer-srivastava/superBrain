import { z } from 'zod';
export declare const CreateContentSchema: z.ZodObject<{
    type: z.ZodEnum<{
        link: "link";
        note: "note";
        pdf: "pdf";
        image: "image";
    }>;
    originalLink: z.ZodOptional<z.ZodString>;
    extractedText: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateContentDto = z.infer<typeof CreateContentSchema>;

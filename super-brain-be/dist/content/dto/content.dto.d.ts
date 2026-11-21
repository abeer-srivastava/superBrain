import { z } from 'zod';
export declare const CreateContentSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"link">;
    originalLink: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    annotation: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"pdf">;
    originalLink: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    annotation: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"note">;
    extractedText: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
}, z.core.$strip>], "type">;
export declare const UploadMetaSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string[] | undefined, string | undefined>>, z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>>;
    annotation: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateContentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    annotation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    favorite: z.ZodOptional<z.ZodBoolean>;
    isPrivate: z.ZodOptional<z.ZodBoolean>;
    extractedText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListContentQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        link: "link";
        note: "note";
        pdf: "pdf";
        image: "image";
    }>>;
    tag: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    favorite: z.ZodPipe<z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean | undefined, "true" | "false" | undefined>>;
    status: z.ZodOptional<z.ZodEnum<{
        processing: "processing";
        ready: "ready";
        failed: "failed";
    }>>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateContentDto = z.infer<typeof CreateContentSchema>;
export type UpdateContentDto = z.infer<typeof UpdateContentSchema>;
export type ListContentQuery = z.infer<typeof ListContentQuerySchema>;

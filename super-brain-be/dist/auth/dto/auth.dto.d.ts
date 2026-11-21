import { z } from 'zod';
export declare const SignupSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const SigninSchema: z.ZodPipe<z.ZodObject<{
    identifier: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, z.core.$strip>, z.ZodTransform<{
    identifier: string;
    password: string;
}, {
    password: string;
    identifier?: string | undefined;
    username?: string | undefined;
}>>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const UpdateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const DeleteAccountSchema: z.ZodObject<{
    password: z.ZodString;
}, z.core.$strip>;
export type SignupDto = z.infer<typeof SignupSchema>;
export type SigninDto = z.infer<typeof SigninSchema>;

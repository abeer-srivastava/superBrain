"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAccountSchema = exports.UpdateProfileSchema = exports.ChangePasswordSchema = exports.SigninSchema = exports.SignupSchema = void 0;
const zod_1 = require("zod");
const password = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password must be at most 72 bytes');
exports.SignupSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email('Enter a valid email address'),
    username: zod_1.z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(24, 'Username must be at most 24 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can contain letters, numbers, _ and - only'),
    password,
});
exports.SigninSchema = zod_1.z
    .object({
    identifier: zod_1.z.string().trim().min(1).optional(),
    username: zod_1.z.string().trim().min(1).optional(),
    password: zod_1.z.string().min(1, 'Password is required').max(200),
})
    .refine((v) => v.identifier || v.username, { message: 'Enter your username or email', path: ['identifier'] })
    .transform((v) => ({ identifier: (v.identifier ?? v.username), password: v.password }));
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: password,
});
exports.UpdateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().max(60).nullable().optional(),
});
exports.DeleteAccountSchema = zod_1.z.object({
    password: zod_1.z.string().min(1, 'Confirm with your password'),
});
//# sourceMappingURL=auth.dto.js.map
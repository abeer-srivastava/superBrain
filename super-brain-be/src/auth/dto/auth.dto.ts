import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  // bcrypt only uses the first 72 bytes; reject longer to avoid false security.
  .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password must be at most 72 bytes');

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can contain letters, numbers, _ and - only'),
  password,
});

/** `identifier` is a username or email. `username` kept for backwards compatibility. */
export const SigninSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    username: z.string().trim().min(1).optional(),
    password: z.string().min(1, 'Password is required').max(200),
  })
  .refine((v) => v.identifier || v.username, { message: 'Enter your username or email', path: ['identifier'] })
  .transform((v) => ({ identifier: (v.identifier ?? v.username)!, password: v.password }));

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().max(60).nullable().optional(),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Confirm with your password'),
});

export type SignupDto = z.infer<typeof SignupSchema>;
export type SigninDto = z.infer<typeof SigninSchema>;

import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export const SigninSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type SignupDto = z.infer<typeof SignupSchema>;
export type SigninDto = z.infer<typeof SigninSchema>;

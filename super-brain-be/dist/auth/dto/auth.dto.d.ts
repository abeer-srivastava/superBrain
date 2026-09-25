import { z } from 'zod';
export declare const SignupSchema: any;
export declare const SigninSchema: any;
export type SignupDto = z.infer<typeof SignupSchema>;
export type SigninDto = z.infer<typeof SigninSchema>;

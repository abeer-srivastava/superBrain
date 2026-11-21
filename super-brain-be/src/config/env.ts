import { existsSync } from 'node:fs';
import { z } from 'zod';

// Load .env for local development. Real environment variables always win
// (process.loadEnvFile never overrides variables that are already set).
if (process.env.NODE_ENV !== 'test' && existsSync('.env')) {
  process.loadEnvFile('.env');
}

/**
 * Single source of truth for runtime configuration.
 *
 * The process refuses to boot with an invalid configuration in production
 * (e.g. a missing or weak JWT secret) instead of silently falling back to an
 * insecure default.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    MONGO_URL: z.string().min(1).default('mongodb://127.0.0.1:27017/superbrain'),

    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    QUEUE_PREFIX: z.string().default('superbrain'),

    QDRANT_URL: z.string().default('http://127.0.0.1:6333'),
    QDRANT_API_KEY: z.string().optional(),
    QDRANT_COLLECTION: z.string().default('secondbrain'),

    JWT_SECRET: z.string().optional(),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().max(90).default(14),

    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),

    ALLOWED_ORIGINS: z.string().optional(),
    /** Express "trust proxy" setting. Number of hops, or "false". */
    TRUST_PROXY: z.string().default('1'),

    UPLOAD_DIR: z.string().default('uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(100).default(15),

    /** Allow the link fetcher to reach private network addresses (dev only). */
    ALLOW_PRIVATE_FETCH: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
  })
  .superRefine((env, ctx) => {
    const secret = env.JWT_SECRET ?? '';
    if (env.NODE_ENV === 'production') {
      if (secret.length < 32 || secret.startsWith('change-this')) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be set to a random string of at least 32 characters in production',
        });
      }
      if (!env.ALLOWED_ORIGINS) {
        ctx.addIssue({
          code: 'custom',
          path: ['ALLOWED_ORIGINS'],
          message: 'ALLOWED_ORIGINS must list the web app origin(s) in production',
        });
      }
      if (env.ALLOW_PRIVATE_FETCH) {
        ctx.addIssue({
          code: 'custom',
          path: ['ALLOW_PRIVATE_FETCH'],
          message: 'ALLOW_PRIVATE_FETCH must not be enabled in production',
        });
      }
    }
  });

export type Env = z.infer<typeof EnvSchema> & { JWT_SECRET: string };

/** Used only outside production when JWT_SECRET is unset, so local dev just works. */
const DEV_JWT_SECRET = 'superbrain-dev-only-secret-do-not-use-in-production';

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${details}`);
  }
  const env = parsed.data;
  return { ...env, JWT_SECRET: env.JWT_SECRET || DEV_JWT_SECRET };
}

export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

export function allowedOrigins(): string[] {
  return (env().ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

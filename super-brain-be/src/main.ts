import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { setDefaultResultOrder } from 'node:dns';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { allowedOrigins, env } from './config/env';
import { installQdrantDnsCache } from './common/bootstrap/dns-cache';
import { AppModule } from './app.module';

export async function createApp() {
  const config = env(); // throws on invalid configuration
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: config.NODE_ENV === 'production' ? ['log', 'warn', 'error'] : undefined,
  });

  const trust = config.TRUST_PROXY;
  app.set('trust proxy', trust === 'false' ? false : /^\d+$/.test(trust) ? Number(trust) : trust);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '1mb' });
  app.setGlobalPrefix('api/v1');

  const origins = allowedOrigins();
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.enableShutdownHooks();
  return app;
}

async function bootstrap() {
  setDefaultResultOrder('ipv4first');
  installQdrantDnsCache(process.env.QDRANT_URL);
  const app = await createApp();
  const port = env().PORT;
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('SuperBrain');
  logger.log(`API listening on http://localhost:${port}/api/v1 (health: /api/v1/health/ready)`);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

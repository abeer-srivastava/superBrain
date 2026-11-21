import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setDefaultResultOrder } from 'node:dns';
import * as fs from 'fs';
import * as path from 'path';

// ──────────────────────────────────────────────────────────────────────────────
// DNS Monkey-patch for Qdrant Cloud
// Resolves the Qdrant hostname once at startup and caches it to avoid
// repeated DNS lookups on every HTTP request.
// ──────────────────────────────────────────────────────────────────────────────
try {
  const dns = require('node:dns');
  const urlStr = process.env.QDRANT_URL;

  if (urlStr && urlStr.startsWith('https://')) {
    const qdrantHost = new URL(urlStr).hostname;
    let cachedIp = '';

    dns.resolve4(qdrantHost, (err: any, addresses: string[]) => {
      if (!err && addresses.length > 0) {
        cachedIp = addresses[0];
        console.log(`[DNS Cache] ${qdrantHost} -> ${cachedIp}`);
      }
    });

    const originalLookup = dns.lookup;
    dns.lookup = (hostname: string, options: any, callback: any) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (hostname === qdrantHost && cachedIp) {
        const res = { address: cachedIp, family: 4 };
        return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
      }
      return originalLookup(hostname, options, (err: any, address: any, family: any) => {
        if (err && hostname === qdrantHost && cachedIp) {
          const res = { address: cachedIp, family: 4 };
          return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
        }
        if (!err && hostname === qdrantHost && !options.all) {
          cachedIp = address;
        }
        callback(err, address, family);
      });
    };
    console.log(`[DNS Cache] Configured for ${qdrantHost}`);
  }
} catch (e) {
  console.error('[DNS Cache] Failed to configure', e);
}

setDefaultResultOrder('ipv4first');

// ──────────────────────────────────────────────────────────────────────────────
// Ensure uploads directory exists (for file uploads)
// ──────────────────────────────────────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`[Startup] Created uploads directory: ${uploadsDir}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // CORS — allow all in dev, restrict via env in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : null;

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!allowedOrigins || allowedOrigins.length === 0 || !origin) {
        // Allow all origins if ALLOWED_ORIGINS not set (dev mode) or no origin header (curl, Postman)
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`[SuperBrain] Backend running at http://localhost:${port}/api/v1`);
  console.log(`[SuperBrain] Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();

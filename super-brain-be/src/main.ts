import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setDefaultResultOrder } from 'node:dns';

/**
 * DYNAMIC DNS MONKEY-PATCH
 * Since system-level DNS sometimes fails (EAI_AGAIN) in this environment, 
 * we dynamically parse QDRANT_URL from .env, resolve its IP at startup,
 * and provide a fallback cache in Node's dns.lookup.
 */
try {
  try {
    require('dotenv').config();
  } catch (e) {}

  const dns = require('node:dns');
  const urlStr = process.env.QDRANT_URL;

  if (urlStr && urlStr.startsWith('https://')) {
    const qdrantHost = new URL(urlStr).hostname;
    let cachedIp = '';

    // Asynchronously resolve and cache the IP address at startup
    dns.resolve4(qdrantHost, (err: any, addresses: string[]) => {
      if (!err && addresses.length > 0) {
        cachedIp = addresses[0];
        console.log(`DNS Cache initialized for ${qdrantHost} -> ${cachedIp}`);
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
    console.log(`Dynamic DNS Monkey-patch configured for ${qdrantHost}`);
  }
} catch (e) {
  console.error('Failed to configure dynamic DNS monkey-patch', e);
}

setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix to match frontend expectation
  app.setGlobalPrefix('api/v1');
  
  // Enable CORS with more explicit settings
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow all origins for now to fix connection issues
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}/api/v1`);
}
bootstrap();

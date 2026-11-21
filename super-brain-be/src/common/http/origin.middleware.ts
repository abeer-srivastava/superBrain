import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins } from '../../config/env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defence-in-depth CSRF protection for cookie sessions.
 *
 * Session cookies are SameSite=Lax, which already blocks cross-site POSTs.
 * This additionally rejects state-changing requests whose Origin header is
 * present but not one of ALLOWED_ORIGINS (covers sibling subdomains).
 * Requests without an Origin header (curl, server-to-server) are allowed —
 * they cannot carry a victim's cookies from a browser.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const origins = allowedOrigins();
    const origin = req.headers.origin?.replace(/\/$/, '');
    if (origins.length === 0 || SAFE_METHODS.has(req.method) || !origin) return next();
    if (!origins.includes(origin)) {
      throw new ForbiddenException('Request origin not allowed');
    }
    next();
  }
}

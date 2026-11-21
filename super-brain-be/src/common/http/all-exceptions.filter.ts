import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';

/**
 * Normalises every error into `{ statusCode, message, errors? }` and makes
 * sure internals (stack traces, driver errors) never leak to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (res.headersSent) {
      // Streaming responses (SSE) handle their own errors.
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong on our side. Please try again.';
    let errors: unknown;

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'You are doing that too often. Please wait a moment and try again.';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, any>;
        message = Array.isArray(b.message) ? b.message.join(', ') : (b.message ?? message);
        errors = b.errors;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.issues[0]?.message ?? 'Invalid request';
      errors = exception.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Not found';
    } else if ((exception as any)?.code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'That already exists';
    } else if ((exception as any)?.type === 'entity.too.large') {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Request is too large';
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, (exception as Error)?.stack ?? String(exception));
    }

    res.status(status).json({ statusCode: status, message, ...(errors ? { errors } : {}) });
  }
}

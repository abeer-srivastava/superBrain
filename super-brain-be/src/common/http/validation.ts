import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Parse a payload with a zod schema, throwing a 400 with field errors on failure. */
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    const first = errors[0];
    throw new BadRequestException({
      message: first ? (first.path ? `${first.path}: ${first.message}` : first.message) : 'Invalid request',
      errors,
    });
  }
  return result.data;
}

/** Throws 404 for malformed ids so we never leak CastErrors or hit the DB. */
export function assertObjectId(id: string): string {
  if (!isValidObjectId(id) || !/^[a-f0-9]{24}$/i.test(id)) throw new NotFoundException('Not found');
  return id;
}

export interface AuthUser {
  userId: string;
  username: string;
}

/** `@CurrentUser() user: AuthUser` — the authenticated principal. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});

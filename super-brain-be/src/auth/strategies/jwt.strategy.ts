import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from '../../user/user.service';
import { env } from '../../config/env';
import { SESSION_COOKIE, type JwtPayload } from '../auth.service';
import type { AuthUser } from '../../common/http/validation';

const fromCookie = (req: Request): string | null => req?.cookies?.[SESSION_COOKIE] ?? null;

/**
 * Accepts the httpOnly session cookie (web app) or a Bearer token (API
 * clients). Tokens are rejected once the user's tokenVersion moves on.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: env().JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userService.findById(payload.sub);
    if (!user || (user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    return { userId: user._id.toString(), username: user.username };
  }
}

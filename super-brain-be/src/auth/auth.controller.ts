import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SigninSchema, SignupSchema } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { CurrentUser, parse, type AuthUser } from '../common/http/validation';

/** Strict limits on credential endpoints to slow down brute forcing. */
const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('signup')
  @Throttle(AUTH_LIMIT)
  async signup(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.signup(parse(SignupSchema, body));
    this.authService.setSessionCookie(res, user);
    return { user: this.userService.toPublic(user) };
  }

  @Post('signin')
  @HttpCode(200)
  @Throttle(AUTH_LIMIT)
  async signin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateCredentials(parse(SigninSchema, body));
    this.authService.setSessionCookie(res, user);
    return { user: this.userService.toPublic(user) };
  }

  @Post('signout')
  @HttpCode(200)
  signout(@Res({ passthrough: true }) res: Response) {
    this.authService.clearSessionCookie(res);
    return { ok: true };
  }

  /** Revokes every session on every device, including this one. */
  @Post('signout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async signoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.userService.bumpTokenVersion(user.userId);
    this.authService.clearSessionCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const doc = await this.userService.findById(user.userId);
    return { user: this.userService.toPublic(doc!) };
  }
}

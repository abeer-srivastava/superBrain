import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordSchema, DeleteAccountSchema, UpdateProfileSchema } from '../auth/dto/auth.dto';
import { CurrentUser, parse, type AuthUser } from '../common/http/validation';
import { UserService } from '../user/user.service';
import { AccountService } from './account.service';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly users: UserService,
    private readonly auth: AuthService,
    private readonly account: AccountService,
  ) {}

  @Patch()
  async updateProfile(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const dto = parse(UpdateProfileSchema, body);
    const updated = await this.users.update(user.userId, { displayName: dto.displayName ?? undefined });
    return { user: this.users.toPublic(updated!) };
  }

  /** Changing the password signs out every other device. */
  @Post('password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(@CurrentUser() user: AuthUser, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = parse(ChangePasswordSchema, body);
    await this.auth.verifyPassword(user.userId, dto.currentPassword);
    const passwordHash = await this.auth.hashPassword(dto.newPassword);
    const updated = await this.users.update(user.userId, { passwordHash, $inc: { tokenVersion: 1 } });
    this.auth.setSessionCookie(res, updated!);
    return { ok: true };
  }

  /** Everything we store about you, as portable JSON. */
  @Get('export')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async export(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    const data = await this.account.export(user.userId);
    const date = new Date().toISOString().slice(0, 10);
    res.set('Content-Disposition', `attachment; filename="superbrain-export-${user.username}-${date}.json"`);
    return data;
  }

  @Delete()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async deleteAccount(@CurrentUser() user: AuthUser, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { password } = parse(DeleteAccountSchema, body);
    await this.auth.verifyPassword(user.userId, password);
    await this.account.deleteEverything(user.userId);
    this.auth.clearSessionCookie(res);
    return { ok: true };
  }
}

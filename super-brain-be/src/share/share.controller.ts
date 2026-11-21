import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, parse, type AuthUser } from '../common/http/validation';
import { ShareService } from './share.service';
import { ContentService } from '../content/content.service';
import { UserService } from '../user/user.service';

const ToggleSchema = z
  .object({ enabled: z.boolean().optional(), share: z.boolean().optional() })
  .refine((v) => v.enabled !== undefined || v.share !== undefined, 'enabled must be a boolean')
  .transform((v) => (v.enabled ?? v.share)!);

@Controller()
export class ShareController {
  constructor(
    private readonly share: ShareService,
    private readonly content: ContentService,
    private readonly users: UserService,
  ) {}

  @Get('share')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: AuthUser) {
    return this.share.status(user.userId);
  }

  @Post('share')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  toggle(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return parse(ToggleSchema, body) ? this.share.enable(user.userId) : this.share.disable(user.userId);
  }

  @Post('share/rotate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  rotate(@CurrentUser() user: AuthUser) {
    return this.share.rotate(user.userId);
  }

  /**
   * Public, unauthenticated. Returns sanitized metadata of the owner's saved
   * web links only — notes, uploads, full text and annotations never leave.
   */
  @Get('public/:hash')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async publicBrain(@Param('hash') hash: string) {
    const userId = await this.share.userIdByHash(hash);
    const user = userId ? await this.users.findById(userId) : null;
    if (!userId || !user) throw new NotFoundException('This page does not exist or is no longer shared');
    const items = await this.content.findPublic(userId);
    return {
      owner: { username: user.username, displayName: user.displayName ?? null },
      items: items.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
    };
  }
}

import { Controller, Post, Get, Body, Param, Request, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShareService } from './share.service';
import { ContentService } from '../content/content.service';
import { UserService } from '../user/user.service';

@Controller('api/v1/brain')
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly contentService: ContentService,
    private readonly userService: UserService,
  ) {}

  @Post('share')
  @UseGuards(JwtAuthGuard)
  async toggleShare(@Request() req: any, @Body() body: { share: boolean }) {
    if (typeof body.share !== 'boolean') {
      throw new BadRequestException('share must be a boolean');
    }

    if (body.share) {
      const hash = await this.shareService.createShareLink(req.user.userId);
      return { hash };
    } else {
      await this.shareService.disableShareLink(req.user.userId);
      return { message: 'Share link disabled' };
    }
  }

  @Get(':shareLink')
  async getSharedBrain(@Param('shareLink') hash: string) {
    const userId = await this.shareService.getUserIdByHash(hash);
    if (!userId) {
      throw new NotFoundException('Shared brain not found');
    }

    const user = await this.userService.findById(userId);
    const content = await this.contentService.findByUser(userId);

    return {
      username: user?.username,
      content,
    };
  }
}

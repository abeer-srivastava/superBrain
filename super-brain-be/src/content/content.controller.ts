import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContentService } from './content.service';
import { CreateContentSchema, ListContentQuerySchema, UpdateContentSchema, UploadMetaSchema } from './dto/content.dto';
import { QueueService } from '../queue/queue.service';
import { StorageService, sniffMime } from '../storage/storage.service';
import { CurrentUser, parse, type AuthUser } from '../common/http/validation';
import { assertPublicUrl } from '../common/http/safe-fetch';
import { env } from '../config/env';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly queue: QueueService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const dto = parse(CreateContentSchema, body);
    if (dto.type !== 'note') {
      // Fail fast with a clear message instead of a background failure.
      await assertPublicUrl(dto.originalLink, !!env().ALLOW_PRIVATE_FETCH).catch((e) => {
        throw new BadRequestException(e.message);
      });
    }
    const doc = await this.content.create({ ...dto, userId: user.userId, status: 'processing' });
    await this.queue.enqueueIngest(doc._id.toString());
    return doc;
  }

  @Post('upload')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: env().MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
    }),
  )
  async upload(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File | undefined, @Body() body: unknown) {
    if (!file) throw new BadRequestException('Choose a file to upload');
    const meta = parse(UploadMetaSchema, body);
    const mime = sniffMime(file.buffer);
    if (!mime) throw new BadRequestException('Unsupported file. Upload a PDF, PNG, JPEG, WebP or GIF.');

    const key = await this.storage.put(user.userId, file.buffer, mime);
    const fileName = file.originalname.replace(/[^\w.\- ()]/g, '_').slice(0, 200);
    const doc = await this.content.create({
      userId: user.userId,
      type: mime === 'application/pdf' ? 'pdf' : 'image',
      title: meta.title,
      tags: meta.tags,
      annotation: meta.annotation,
      filePath: key,
      fileName,
      mimeType: mime,
      fileSize: file.size,
      status: 'processing',
    });
    await this.queue.enqueueIngest(doc._id.toString());
    const { filePath: _omit, ...safe } = doc.toObject();
    return safe;
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: unknown) {
    return this.content.list(user.userId, parse(ListContentQuerySchema, query));
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.content.stats(user.userId);
  }

  @Get('resurface')
  resurface(@CurrentUser() user: AuthUser) {
    return this.content.resurface(user.userId);
  }

  /** Re-embed the whole library (e.g. after a model upgrade). Runs in the background. */
  @Post('reindex')
  @HttpCode(202)
  @Throttle({ default: { limit: 2, ttl: 60 * 60_000 } })
  async reindex(@CurrentUser() user: AuthUser) {
    const items = await this.content.idsWithText(user.userId);
    for (const item of items) await this.queue.enqueueIngest(item._id.toString(), { reembedOnly: true });
    return { queued: items.length };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const doc = await this.content.findOwned(id, user.userId, { withText: true });
    void this.content.markViewed(id, user.userId);
    return doc;
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const dto = parse(UpdateContentSchema, body);
    const updated = await this.content.update(id, user.userId, dto);
    // Text that feeds the index changed → refresh vectors in the background.
    if (dto.extractedText !== undefined && updated.type === 'note') {
      await this.content.setInternal(id, { $set: { status: 'processing' } });
      await this.queue.enqueueIngest(id);
      updated.status = 'processing';
    } else if (dto.title !== undefined || dto.annotation !== undefined) {
      if (updated.status === 'ready') await this.queue.enqueueIngest(id, { reembedOnly: true });
    }
    return updated;
  }

  @Post(':id/reprocess')
  @HttpCode(202)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async reprocess(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const doc = await this.content.findOwned(id, user.userId);
    const unset: Record<string, 1> = { error: 1, summary: 1 };
    // Re-fetch sources; notes keep their text (it *is* the source).
    if (doc.type !== 'note') unset.extractedText = 1;
    await this.content.setInternal(id, { $set: { status: 'processing', keyPoints: [] }, $unset: unset });
    await this.queue.enqueueIngest(id);
    return { status: 'processing' };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.content.delete(id, user.userId);
    return { ok: true };
  }

  /** Serve an uploaded file to its owner only. */
  @Get(':id/file')
  async file(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const doc = await this.content.findOwned(id, user.userId, { withFile: true });
    if (!doc.filePath || !doc.mimeType) throw new BadRequestException('This item has no file');
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName ?? 'file')}"`,
      'Cache-Control': 'private, max-age=3600',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; sandbox",
    });
    return new StreamableFile(this.storage.stream(doc.filePath));
  }
}

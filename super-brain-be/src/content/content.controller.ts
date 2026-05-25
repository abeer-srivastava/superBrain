import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards, BadRequestException, Logger, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContentService } from './content.service';
import { CreateContentSchema } from './dto/content.dto';
import { QueueService } from '../queue/queue.service';
import { VectorService } from '../vector/vector.service';
import type { Express } from 'express';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly queueService: QueueService,
    private readonly vectorService: VectorService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const parsed = CreateContentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }

    const newContent = await this.contentService.create({
      userId: req.user.userId,
      ...parsed.data,
      status: 'processing',
    });

    await this.queueService.addExtractionJob(newContent._id.toString(), newContent.type, parsed.data);

    return newContent;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
  }))
  async uploadFile(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { title, type, extractedText } = body;
    if (!title || !type) {
      throw new BadRequestException('Title and type are required');
    }

    const newContent = await this.contentService.create({
      userId: req.user.userId,
      title,
      type,
      extractedText,
      originalLink: file.path, // Store local path as originalLink
      status: 'processing',
    });

    await this.queueService.addExtractionJob(newContent._id.toString(), newContent.type, {
        title,
        type,
        extractedText,
        originalLink: file.path,
        isLocalFile: true
    });

    return newContent;
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.contentService.findByUser(req.user.userId);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    // Best-effort vector cleanup — don't let Qdrant failures block content deletion
    try {
      await this.vectorService.deleteByContentId(id);
    } catch (error) {
      this.logger.warn(`Failed to delete vectors for content ${id}, proceeding with content deletion: ${error.message ?? error}`);
    }
    return this.contentService.delete(id, req.user.userId);
  }
}

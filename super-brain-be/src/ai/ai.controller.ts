import { Controller, Get, Post, Body, Query, Request, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';
import { VectorService } from '../vector/vector.service';
import { ContentService } from '../content/content.service';
import { randomUUID } from 'crypto';

/** Minimum similarity score to consider a result relevant */
const RELEVANCE_THRESHOLD = 0.1;

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private aiService: AiService,
    private embeddingService: EmbeddingService,
    private vectorService: VectorService,
    private contentService: ContentService,
  ) {}
 
  @Get('search')
  async search(@Request() req: any, @Query('q') query: string) {
    try {
      if (!query) throw new BadRequestException('Query parameter q is required');

      const embedding = await this.embeddingService.embedOne(query);
      const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 10);
      
      // Filter by relevance score
      const relevantResults = results.filter(r => r.score > RELEVANCE_THRESHOLD);

      return relevantResults;
    } catch (error) {
      this.logger.error('AI Search Error:', error);
      throw error;
    }
  }

  @Post('ask')
  async ask(@Request() req: any, @Body() body: { query: string; history?: { role: 'user' | 'assistant'; content: string }[] }) {
    try {
      if (!body.query) throw new BadRequestException('query is required in body');

      const embedding = await this.embeddingService.embedOne(body.query);
      const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);

      // Filter by relevance score
      const relevantResults = results.filter(r => r.score > RELEVANCE_THRESHOLD);

      if (relevantResults.length === 0) {
        return { 
          answer: "I couldn't find any relevant content in your brain to answer this question.",
          sources: [] 
        };
      }

      // Build numbered context for the LLM with source labels
      const contextChunks = relevantResults
        .map((r, i) => `[Source ${i + 1}: ${r.payload?.title || 'Untitled'}]\n${r.payload?.text}`)
        .filter(Boolean)
        .join('\n\n');

      const answer = await this.aiService.askQuestion(contextChunks, body.query, body.history);

      // Deduplicate sources by contentId
      const seenContentIds = new Set<string>();
      const uniqueSources: any[] = [];
      for (const r of relevantResults) {
        const cid = r.payload?.contentId as string | undefined;
        if (cid && !seenContentIds.has(cid)) {
          seenContentIds.add(cid);
          uniqueSources.push(r.payload);
        }
      }

      return {
        answer,
        sources: uniqueSources,
      };
    } catch (error) {
      this.logger.error('AI Ask Error:', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Re-indexing Endpoint — re-embeds all existing content with local model
  // ──────────────────────────────────────────────────────────────────────────

  @Post('reindex')
  async reindex(@Request() req: any) {
    this.logger.log(`Reindex requested by user ${req.user.userId}`);

    const allContent = await this.contentService.findByUser(req.user.userId);
    const toReindex = allContent.filter(c => c.extractedText && c.extractedText.length > 0);
    const skipped = allContent.length - toReindex.length;

    this.logger.log(`Reindexing ${toReindex.length} content items (skipping ${skipped} without text)`);

    let reindexed = 0;
    let failed = 0;
    const errors: { contentId: string; error: string }[] = [];

    for (const content of toReindex) {
      try {
        const contentId = (content as any)._id.toString();

        // Delete old vectors for this content
        try {
          await this.vectorService.deleteByContentId(contentId);
        } catch (err) {
          // Non-fatal — old vectors may not exist
        }

        // Chunk the existing extracted text
        const chunks = this.aiService.chunkText(content.extractedText!);

        // Generate new embeddings locally (no API calls!)
        const embeddings = await this.embeddingService.embedMany(chunks);

        const points: { id: string; vector: number[]; payload: any }[] = [];
        for (let i = 0; i < chunks.length; i++) {
          points.push({
            id: randomUUID(),
            vector: embeddings[i],
            payload: {
              contentId,
              userId: content.userId.toString(),
              text: chunks[i],
              title: content.title || '',
              link: content.originalLink || '',
              type: content.type,
            },
          });
        }

        // Upsert vectors
        if (points.length > 0) {
          await this.vectorService.upsertVectors(points);
        }

        // Ensure status is 'ready'
        await this.contentService.updateStatus(contentId, { status: 'ready' });

        reindexed++;
        this.logger.log(`Reindexed content ${contentId}: ${points.length} vectors`);
      } catch (err) {
        failed++;
        const contentId = (content as any)._id.toString();
        errors.push({ contentId, error: err.message });
        this.logger.error(`Failed to reindex content ${contentId}: ${err.message}`);
      }
    }

    const summary = {
      total: allContent.length,
      reindexed,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };

    this.logger.log(`Reindex complete: ${JSON.stringify(summary)}`);
    return summary;
  }
}

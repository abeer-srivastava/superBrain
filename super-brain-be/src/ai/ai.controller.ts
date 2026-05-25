import { Controller, Get, Post, Body, Query, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { VectorService } from '../vector/vector.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiService: AiService,
    private vectorService: VectorService,
  ) {}
 
  @Get('search')
  async search(@Request() req: any, @Query('q') query: string) {
    try {
      if (!query) throw new BadRequestException('Query parameter q is required');

      const embedding = await this.aiService.generateEmbedding(query);
      const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 10);
      
      return results;
    } catch (error) {
      console.error('AI Search Error:', error);
      throw error;
    }
  }

  @Post('ask')
  async ask(@Request() req: any, @Body() body: { query: string; history?: { role: 'user' | 'assistant'; content: string }[] }) {
    try {
      if (!body.query) throw new BadRequestException('query is required in body');

      const embedding = await this.aiService.generateEmbedding(body.query);
      const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);

      const contextChunks = results
        .map(r => r.payload?.text)
        .filter(Boolean)
        .join('\n\n');

      if (!contextChunks) {
        return { 
          answer: "I couldn't find any relevant content in your brain to answer this question.",
          sources: [] 
        };
      }

      const answer = await this.aiService.askQuestion(contextChunks, body.query, body.history);

      return {
        answer,
        sources: results.map(r => r.payload),
      };
    } catch (error) {
      console.error('AI Ask Error:', error);
      throw error;
    }
  }
}

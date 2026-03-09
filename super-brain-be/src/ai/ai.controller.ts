import { Controller, Get, Post, Body, Query, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { VectorService } from '../vector/vector.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private genAI: GoogleGenerativeAI;

  constructor(
    private aiService: AiService,
    private vectorService: VectorService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  @Get('search')
  async search(@Request() req: any, @Query('q') query: string) {
    if (!query) throw new BadRequestException('Query parameter q is required');

    const embedding = await this.aiService.generateEmbedding(query);
    const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);
    
    return results;
  }

  @Post('ask')
  async ask(@Request() req: any, @Body() body: { query: string }) {
    if (!body.query) throw new BadRequestException('query is required in body');

    const embedding = await this.aiService.generateEmbedding(body.query);
    const results = await this.vectorService.searchSimilar(embedding, req.user.userId, 5);

    const contextChunks = results.map(r => r.payload?.text).join('\n\n');

    if (!this.genAI) {
      return { answer: 'Gemini API not configured. Context retrieved successfully.', context: contextChunks };
    }

    const prompt = `
You are a personal knowledge assistant.
Answer the question using ONLY the provided context. If the answer is not in the context, say "I don't know based on the provided context."

Context:
${contextChunks}

Question:
${body.query}
`;

    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      sources: results.map(r => r.payload),
    };
  }
}

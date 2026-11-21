import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, parse, type AuthUser } from '../common/http/validation';
import { CONTENT_TYPES } from '../content/schemas/content.schema';
import { SearchService, type RetrievedSource } from './search.service';
import { ConversationService } from './conversation.service';
import { AiService } from '../ai/ai.service';
import type { Message } from './schemas/conversation.schema';

const SearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Type something to search for').max(500),
  type: z.enum(CONTENT_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const AskSchema = z.object({
  question: z.string().trim().min(1, 'Ask a question').max(2000),
  threadId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  /** Restrict retrieval to a single saved item. */
  contentId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
});

const RenameSchema = z.object({ title: z.string().trim().min(1).max(120) });

const AI_OFF = 'AI answers are unavailable right now, but these saved items look most relevant to your question.';
const AI_BUSY = 'The AI model is busy right now, so I can only show you the most relevant saved items. Try asking again in a minute.';

const NOTHING_FOUND =
  "I couldn't find anything in your library about that yet. Try rephrasing, or save a few sources on the topic and ask again.";

function sourcesBlock(sources: RetrievedSource[]): string {
  return sources
    .map((s) => {
      const attrs = [`id="${s.n}"`, `title="${s.title.replace(/"/g, "'")}"`, `type="${s.type}"`];
      if (s.createdAt) attrs.push(`saved="${new Date(s.createdAt).toISOString().slice(0, 10)}"`);
      if (s.siteName) attrs.push(`site="${s.siteName.replace(/"/g, "'")}"`);
      return `<source ${attrs.join(' ')}>\n${s.passages.join('\n…\n')}\n</source>`;
    })
    .join('\n\n');
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly conversations: ConversationService,
    private readonly ai: AiService,
  ) {}

  @Get('search')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async find(@CurrentUser() user: AuthUser, @Query() query: unknown) {
    const q = parse(SearchQuerySchema, query);
    return { results: await this.search.search(user.userId, q.q, { type: q.type, limit: q.limit }) };
  }

  @Get('content/:id/related')
  related(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.search.related(id, user.userId);
  }

  // ── Ask (streaming, server-sent events) ──────────────────────────────────

  @Post('ask')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async ask(@CurrentUser() user: AuthUser, @Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const { question, threadId, contentId } = parse(AskSchema, body);
    const thread = threadId ? await this.conversations.findOwned(threadId, user.userId) : null;
    const history = (thread?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));

    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    let closed = false;
    req.on('close', () => (closed = true));
    const send = (event: string, data: unknown) => {
      if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Follow-ups like "what about the second one?" retrieve poorly alone,
      // so blend in the previous question.
      const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content;
      const retrievalQuery = lastUser && question.split(/\s+/).length < 14 ? `${lastUser}\n${question}` : question;
      const sources = contentId
        ? await this.search.retrieveScoped(user.userId, contentId, retrievalQuery)
        : await this.search.retrieve(user.userId, retrievalQuery);
      const publicSources = sources.map(({ passages, ...s }) => ({ ...s, snippet: passages[0]?.slice(0, 280) ?? '' }));
      send('sources', publicSources);

      let answer = '';
      if (sources.length === 0) {
        answer = NOTHING_FOUND;
        send('token', answer);
      } else if (!this.ai.canTry()) {
        answer = AI_OFF;
        send('token', answer);
      } else {
        try {
          for await (const delta of this.ai.streamAnswer(sourcesBlock(sources), question, history)) {
            if (closed) break;
            answer += delta;
            send('token', delta);
          }
        } catch (err) {
          // Retrieval still succeeded: degrade to "here are your sources".
          if (answer) throw err;
          answer = this.ai.status === 'rejected' ? AI_OFF : AI_BUSY;
          send('token', answer);
        }
      }

      if (answer.trim()) {
        const messages: Message[] = [
          { role: 'user', content: question, sources: [] },
          {
            role: 'assistant',
            content: answer,
            sources: publicSources.map((s) => ({ n: s.n, contentId: s.contentId, title: s.title, type: s.type, url: s.url ?? undefined, siteName: s.siteName ?? undefined })),
          },
        ];
        if (thread) {
          await this.conversations.append(thread._id.toString(), user.userId, messages);
          send('thread', { id: thread._id.toString(), title: thread.title });
        } else {
          const title = await this.ai.titleFor(question);
          const created = await this.conversations.create(user.userId, title, messages);
          send('thread', { id: created._id.toString(), title });
        }
      }
      send('done', {});
    } catch (err: any) {
      const rateLimited = /429|quota|resource_exhausted/i.test(String(err?.message));
      send('error', {
        message: rateLimited
          ? 'The AI model is busy right now. Please try again in a minute.'
          : 'Something went wrong while answering. Please try again.',
      });
    } finally {
      res.end();
    }
  }

  @Get('ask/threads')
  threads(@CurrentUser() user: AuthUser) {
    return this.conversations.list(user.userId);
  }

  @Get('ask/threads/:id')
  thread(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversations.findOwned(id, user.userId);
  }

  @Patch('ask/threads/:id')
  rename(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.conversations.rename(id, user.userId, parse(RenameSchema, body).title);
  }

  @Delete('ask/threads/:id')
  @HttpCode(200)
  async deleteThread(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.conversations.delete(id, user.userId);
    return { ok: true };
  }
}

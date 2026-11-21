import { Injectable, Logger } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { EmbeddingService } from '../ai/embedding.service';
import { VectorService, type ChunkHit } from '../vector/vector.service';

/** Cosine similarity below which a semantic hit is considered noise (MiniLM scale). */
const SEMANTIC_FLOOR = 0.2;
/** Reciprocal Rank Fusion constant (standard value from Cormack et al.). */
const RRF_K = 60;

type Channel = 'semantic' | 'keyword' | 'title';

export interface SearchHit {
  item: Record<string, any>;
  score: number;
  snippet: string;
  matched: Channel[];
}

export interface RetrievedSource {
  n: number;
  contentId: string;
  title: string;
  type: string;
  url: string | null;
  siteName: string | null;
  createdAt: Date | null;
  passages: string[];
}

/** Extract a window of text around the first query term found. */
export function snippetAround(text: string | undefined, query: string, radius = 160): string {
  if (!text) return '';
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const lower = text.toLowerCase();
  let idx = -1;
  for (const t of terms) {
    idx = lower.indexOf(t);
    if (idx >= 0) break;
  }
  if (idx < 0) return text.slice(0, radius * 2).trim() + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/** Fuse ranked lists of ids: score(d) = Σ w / (k + rank). */
export function reciprocalRankFusion(lists: { ids: string[]; weight: number }[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const { ids, weight } of lists) {
    ids.forEach((id, rank) => scores.set(id, (scores.get(id) ?? 0) + weight / (RRF_K + rank + 1)));
  }
  return scores;
}

function groupHits(hits: ChunkHit[], floor = SEMANTIC_FLOOR) {
  const byContent = new Map<string, { best: number; chunks: ChunkHit[] }>();
  for (const h of hits) {
    if (h.score < floor) continue;
    const g = byContent.get(h.payload.contentId) ?? { best: 0, chunks: [] };
    g.best = Math.max(g.best, h.score);
    g.chunks.push(h);
    byContent.set(h.payload.contentId, g);
  }
  return [...byContent.entries()].sort((a, b) => b[1].best - a[1].best);
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly content: ContentService,
    private readonly embeddings: EmbeddingService,
    private readonly vectors: VectorService,
  ) {}

  private async semantic(userId: string, query: string, limit: number, type?: string): Promise<ChunkHit[]> {
    try {
      const vector = await this.embeddings.embedOne(query);
      return await this.vectors.search(vector, userId, limit, { type });
    } catch (err: any) {
      // Keyword search still works if the vector side is down.
      this.logger.warn(`Semantic search unavailable: ${err.message}`);
      return [];
    }
  }

  async search(userId: string, query: string, opts: { type?: string; limit?: number } = {}): Promise<SearchHit[]> {
    const limit = opts.limit ?? 20;
    const [semanticHits, keyword, titles] = await Promise.all([
      this.semantic(userId, query, 60, opts.type),
      this.content.keywordSearch(userId, query, 30, opts.type).catch(() => []),
      this.content.titleSearch(userId, query, 15, opts.type).catch(() => []),
    ]);

    const grouped = groupHits(semanticHits);
    const semanticIds = grouped.map(([id]) => id);
    const keywordIds = keyword.map((k) => k._id.toString());
    const titleIds = titles.map((t) => t._id.toString());

    // Short queries are usually names or exact terms, where keyword matching
    // is far more precise than a small embedding model.
    const short = query.trim().split(/\s+/).length <= 2;
    const fused = reciprocalRankFusion([
      { ids: semanticIds, weight: 1 },
      { ids: keywordIds, weight: short ? 1.5 : 1 },
      { ids: titleIds, weight: 0.8 },
    ]);
    const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    if (ranked.length === 0) return [];

    const docs = await this.content.findManyOwned(ranked.map(([id]) => id), userId);
    const docById = new Map(docs.map((d) => [d._id.toString(), d]));
    const semanticById = new Map(grouped);
    const keywordById = new Map(keyword.map((k) => [k._id.toString(), k]));

    return ranked
      .filter(([id]) => docById.has(id))
      .map(([id, score]) => {
        const matched: Channel[] = [];
        if (semanticById.has(id)) matched.push('semantic');
        if (keywordById.has(id)) matched.push('keyword');
        if (titleIds.includes(id)) matched.push('title');
        const chunk = semanticById.get(id)?.chunks[0]?.payload.text;
        const snippet = keywordById.has(id)
          ? snippetAround(keywordById.get(id)!.extractedText, query)
          : chunk
            ? snippetAround(chunk, query)
            : (docById.get(id)!.summary ?? '');
        return { item: docById.get(id)!, score, snippet, matched };
      });
  }

  /** Semantically related items — the "Connections" panel. */
  async related(contentId: string, userId: string, limit = 6) {
    await this.content.findOwned(contentId, userId); // ownership check
    const vector = await this.vectors.documentVector(contentId, userId).catch(() => null);
    if (!vector) return [];
    const hits = await this.vectors.search(vector, userId, 40, { excludeContentId: contentId });
    const grouped = groupHits(hits, 0.3).slice(0, limit);
    if (grouped.length === 0) return [];
    const docs = await this.content.findManyOwned(grouped.map(([id]) => id), userId);
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    return grouped
      .filter(([id]) => byId.has(id))
      .map(([id, g]) => ({ item: byId.get(id)!, score: Number(g.best.toFixed(3)), passage: g.chunks[0].payload.text.slice(0, 220) }));
  }

  /** Retrieval restricted to one item ("ask about this document"). */
  async retrieveScoped(userId: string, contentId: string, query: string): Promise<RetrievedSource[]> {
    const doc = await this.content.findOwned(contentId, userId, { withText: true });
    let passages: string[] = [];
    try {
      const vector = await this.embeddings.embedOne(query);
      const hits = await this.vectors.search(vector, userId, 8, { contentId });
      passages = hits.sort((a, b) => a.payload.chunkIndex - b.payload.chunkIndex).map((h) => h.payload.text);
    } catch (err: any) {
      this.logger.warn(`Scoped semantic retrieval failed: ${err.message}`);
    }
    if (passages.length === 0) passages = [(doc.extractedText ?? doc.summary ?? '').slice(0, 4000)];
    if (doc.summary) passages.unshift(`Summary: ${doc.summary}`);
    return [
      {
        n: 1,
        contentId,
        title: doc.title || 'Untitled',
        type: doc.type,
        url: doc.originalLink && /^https?:\/\//.test(doc.originalLink) ? doc.originalLink : null,
        siteName: doc.siteName ?? null,
        createdAt: doc.createdAt ?? null,
        passages: passages.filter(Boolean),
      },
    ];
  }

  /** Retrieval for grounded answers: up to `maxSources` items with their best passages. */
  async retrieve(userId: string, query: string, maxSources = 6): Promise<RetrievedSource[]> {
    const [semanticHits, keyword] = await Promise.all([
      this.semantic(userId, query, 30),
      this.content.keywordSearch(userId, query, 8).catch(() => []),
    ]);
    const grouped = groupHits(semanticHits, 0.15);
    const fused = reciprocalRankFusion([
      { ids: grouped.map(([id]) => id), weight: 1 },
      { ids: keyword.map((k) => k._id.toString()), weight: 0.9 },
    ]);
    const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxSources).map(([id]) => id);
    if (ranked.length === 0) return [];

    const docs = await this.content.findManyOwned(ranked, userId);
    const docById = new Map(docs.map((d) => [d._id.toString(), d]));
    const semanticById = new Map(grouped);
    const keywordById = new Map(keyword.map((k) => [k._id.toString(), k]));

    const sources: RetrievedSource[] = [];
    for (const id of ranked) {
      const doc = docById.get(id);
      if (!doc) continue;
      const passages = (semanticById.get(id)?.chunks ?? [])
        .slice(0, 3)
        .sort((a, b) => a.payload.chunkIndex - b.payload.chunkIndex)
        .map((c) => c.payload.text);
      if (passages.length === 0 && keywordById.has(id)) passages.push(snippetAround(keywordById.get(id)!.extractedText, query, 700));
      if (passages.length === 0 && doc.summary) passages.push(doc.summary);
      sources.push({
        n: sources.length + 1,
        contentId: id,
        title: doc.title || 'Untitled',
        type: doc.type,
        url: doc.originalLink && /^https?:\/\//.test(doc.originalLink) ? doc.originalLink : null,
        siteName: doc.siteName ?? null,
        createdAt: doc.createdAt ?? null,
        passages,
      });
    }
    return sources;
  }
}

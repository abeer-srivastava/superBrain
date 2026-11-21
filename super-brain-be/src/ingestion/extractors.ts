import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import { YoutubeTranscript } from 'youtube-transcript';
import { safeFetch } from '../common/http/safe-fetch';

export interface Extracted {
  text: string;
  title?: string;
  description?: string;
  siteName?: string;
  author?: string;
  imageUrl?: string;
  /** Final URL after redirects. */
  url?: string;
  /** Detected kind, e.g. a link that turned out to be a PDF. */
  kind?: 'html' | 'pdf' | 'youtube';
}

/** Raised for problems the user should see verbatim (not retried). */
export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export async function extractPdf(buffer: Buffer): Promise<Extracted> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    let title: string | undefined;
    try {
      const info = await parser.getInfo();
      const t = (info?.info as Record<string, unknown> | undefined)?.Title;
      if (typeof t === 'string' && t.trim().length > 2) title = t.trim();
    } catch {
      /* metadata is optional */
    }
    const text = result.text.replace(/-- \d+ of \d+ --/g, '\n');
    if (text.replace(/\s/g, '').length < 20) {
      throw new ExtractionError('This PDF has no selectable text (it may be a scan). Try uploading page images instead.');
    }
    return { text, title, kind: 'pdf' };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function absoluteHttpUrl(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    const u = new URL(href, base);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function extractHtml(html: string, url: string): Extracted {
  const $ = cheerio.load(html);
  const meta = (sel: string) => $(sel).attr('content')?.trim() || undefined;

  const title = meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]') || $('title').first().text().trim() || $('h1').first().text().trim() || undefined;
  const description = meta('meta[property="og:description"]') || meta('meta[name="description"]');
  const siteName = meta('meta[property="og:site_name"]') || new URL(url).hostname.replace(/^www\./, '');
  const author = meta('meta[name="author"]') || meta('meta[property="article:author"]');
  const imageUrl = absoluteHttpUrl(meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]'), url);

  $('script, style, noscript, template, svg, iframe, form, nav, footer, header, aside, [aria-hidden="true"], [role="navigation"], [role="banner"], [role="contentinfo"], .ad, .ads, .advert, .cookie, .newsletter').remove();

  const candidates = ['article', 'main', '[role="main"]', '#content', '.post-content', '.entry-content', 'body'];
  let root: ReturnType<typeof $> = $('body');
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().replace(/\s+/g, ' ').trim().length > 400) {
      root = el;
      break;
    }
  }

  // Keep paragraph structure: one block element per line.
  const blocks: string[] = [];
  root.find('h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, figcaption, td, dt, dd').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length > 1) blocks.push(t);
  });
  let text = blocks.join('\n');
  if (text.length < 200) text = root.text().replace(/\s+/g, ' ').trim();
  if (text.length < 80 && description) text = `${description}\n${text}`.trim();

  return { text, title, description, siteName, author, imageUrl, url, kind: 'html' };
}

export function youtubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export async function extractYouTube(url: string, allowPrivate = false): Promise<Extracted> {
  const id = youtubeId(url)!;
  let title: string | undefined;
  let author: string | undefined;
  let imageUrl: string | undefined;
  try {
    const res = await safeFetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { allowPrivate, maxBytes: 256 * 1024 });
    if (res.status === 200) {
      const data = JSON.parse(res.body.toString('utf8'));
      title = data.title;
      author = data.author_name;
      imageUrl = data.thumbnail_url;
    }
  } catch {
    /* oEmbed is best-effort */
  }

  let text = '';
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(id);
    text = transcript.map((t) => t.text.replace(/&amp;#39;/g, "'").replace(/&amp;/g, '&')).join(' ');
  } catch {
    /* no transcript — fall back to metadata below */
  }
  if (!text) {
    if (!title) throw new ExtractionError('Could not read this video (no transcript or metadata available).');
    text = `${title}${author ? ` — a video by ${author}` : ''}. Transcript not available.`;
  }
  return { text, title, author, siteName: 'YouTube', imageUrl, url, kind: 'youtube' };
}

export async function extractUrl(url: string, allowPrivate = false): Promise<Extracted> {
  if (youtubeId(url)) return extractYouTube(url, allowPrivate);

  const parsedUrl = new URL(url);
  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'app.notion.com' && parsedUrl.pathname.startsWith('/p/')) {
    throw new ExtractionError('This is a Notion app link and is not publicly readable. Publish the page to the web in Notion, then save its public notion.site link.');
  }
  if (
    ['chatgpt.com', 'chat.openai.com'].includes(host) &&
    /\/c\//.test(parsedUrl.pathname) &&
    !parsedUrl.pathname.startsWith('/share/')
  ) {
    throw new ExtractionError('This ChatGPT conversation is private. In ChatGPT, use Share → Create link, then save the chatgpt.com/share link.');
  }

  const res = await safeFetch(url, { allowPrivate, maxBytes: 25 * 1024 * 1024 });
  if (res.status === 401 || res.status === 403) throw new ExtractionError(`The site refused access (HTTP ${res.status}). It may require a login.`);
  if (res.status === 404 || res.status === 410) throw new ExtractionError('The page was not found (HTTP 404).');
  if (res.status >= 400) throw new Error(`The site returned HTTP ${res.status}`);

  const isPdf = res.contentType.includes('application/pdf') || res.body.subarray(0, 5).toString('latin1') === '%PDF-';
  if (isPdf) {
    const pdf = await extractPdf(res.body);
    return { ...pdf, url: res.url, siteName: new URL(res.url).hostname.replace(/^www\./, '') };
  }
  if (res.contentType && !/html|xml|text\/plain/.test(res.contentType)) {
    throw new ExtractionError(`This link points to a ${res.contentType.split(';')[0]} file, which can't be read yet.`);
  }
  const body = res.body.toString('utf8');
  if (res.contentType.startsWith('text/plain')) {
    return { text: body, url: res.url, siteName: new URL(res.url).hostname.replace(/^www\./, '') };
  }
  return extractHtml(body, res.url);
}

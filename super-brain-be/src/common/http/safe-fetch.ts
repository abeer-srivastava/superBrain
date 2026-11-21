import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF-safe HTTP fetching for user-supplied URLs.
 *
 * Users can ask SuperBrain to fetch arbitrary links. Without guarding, that
 * lets anyone make the server request internal services (Qdrant, Redis,
 * cloud metadata endpoints at 169.254.169.254, ...). Every hop — including
 * each redirect — is resolved and checked against private/reserved ranges.
 *
 * Residual risk: DNS rebinding between our lookup and the socket connect.
 * Mitigated by short timeouts; full mitigation requires an egress proxy,
 * which is the recommended production setup (see docs/SECURITY.md).
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  allowPrivate?: boolean;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  url: string;
  status: number;
  contentType: string;
  body: Buffer;
}

const DEFAULT_UA =
  'Mozilla/5.0 (compatible; SuperBrainBot/1.0; +https://github.com/abeer-srivastava/superBrain)';

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const BLOCKED_V4: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const n = ipv4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    // fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast
    return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff');
  }
  return true; // not an IP — treat as unsafe
}

export async function assertPublicUrl(raw: string, allowPrivate = false): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('That does not look like a valid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https links can be saved');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('Links with embedded credentials are not allowed');
  }
  if (allowPrivate) return url;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new UnsafeUrlError('Links to private network addresses are not allowed');
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) {
    throw new UnsafeUrlError(`Could not resolve ${host}`);
  }
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UnsafeUrlError('Links to private network addresses are not allowed');
  }
  return url;
}

export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const maxBytes = opts.maxBytes ?? 8 * 1024 * 1024;
  const maxRedirects = opts.maxRedirects ?? 5;

  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertPublicUrl(current, opts.allowPrivate);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_UA,
          Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en;q=0.9,*;q=0.5',
          ...opts.headers,
        },
      });

      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, url).toString();
        await res.body?.cancel();
        continue;
      }

      const declared = Number(res.headers.get('content-length') ?? 0);
      if (declared > maxBytes) {
        await res.body?.cancel();
        throw new Error(`Page is too large (${Math.round(declared / 1024 / 1024)} MB)`);
      }

      const chunks: Buffer[] = [];
      let total = 0;
      if (res.body) {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > maxBytes) {
            await reader.cancel();
            throw new Error(`Page is too large (over ${Math.round(maxBytes / 1024 / 1024)} MB)`);
          }
          chunks.push(Buffer.from(value));
        }
      }

      return {
        url: url.toString(),
        status: res.status,
        contentType: (res.headers.get('content-type') ?? '').toLowerCase(),
        body: Buffer.concat(chunks),
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error(`Timed out after ${timeoutMs / 1000}s fetching ${url.hostname}`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects');
}

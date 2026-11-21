import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Readable } from 'node:stream';
import { env } from '../config/env';

export type AllowedMime = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

/** Detect the real file type from magic bytes — never trust the client's mimetype. */
export function sniffMime(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 6).toString('latin1') === 'GIF87a' || buf.subarray(0, 6).toString('latin1') === 'GIF89a') return 'image/gif';
  return null;
}

const EXT: Record<AllowedMime, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * File storage boundary. The local-disk implementation is the default; an
 * object-store implementation (S3/R2/GCS) only needs to provide the same
 * four methods. Keys are opaque, namespaced per user, and never exposed to
 * clients — files are only served through the authenticated content API.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly root = path.resolve(process.cwd(), env().UPLOAD_DIR);

  async onModuleInit() {
    await fs.mkdir(this.root, { recursive: true });
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error('Invalid storage key');
    return full;
  }

  async put(userId: string, buf: Buffer, mime: AllowedMime): Promise<string> {
    const key = `${userId}/${randomBytes(16).toString('hex')}${EXT[mime]}`;
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buf, { mode: 0o600 });
    return key;
  }

  read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  stream(key: string): Readable {
    return createReadStream(this.resolve(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err: any) {
      if (err?.code !== 'ENOENT') this.logger.warn(`Could not delete ${key}: ${err.message}`);
    }
  }

  async removeUser(userId: string): Promise<void> {
    if (!/^[a-f0-9]{24}$/i.test(userId)) return;
    await fs.rm(this.resolve(userId), { recursive: true, force: true });
  }
}

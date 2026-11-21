import { sniffMime } from './storage.service';

const pad = (b: number[]) => Buffer.concat([Buffer.from(b), Buffer.alloc(16)]);

describe('sniffMime', () => {
  it('detects real file types from magic bytes', () => {
    expect(sniffMime(Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(16)]))).toBe('application/pdf');
    expect(sniffMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffMime(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)]))).toBe('image/gif');
    expect(sniffMime(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]))).toBe('image/webp');
  });

  it('rejects SVG/HTML disguised as images', () => {
    expect(sniffMime(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(sniffMime(Buffer.from('<!doctype html><script>alert(1)</script>'))).toBeNull();
  });

  it('rejects tiny buffers', () => {
    expect(sniffMime(Buffer.from('%PDF'))).toBeNull();
  });
});

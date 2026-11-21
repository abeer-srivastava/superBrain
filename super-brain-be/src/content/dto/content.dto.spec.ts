import { CreateContentSchema, ListContentQuerySchema, UpdateContentSchema, UploadMetaSchema } from './content.dto';

describe('Content DTOs', () => {
  it('accepts a link and adds a missing scheme', () => {
    const r = CreateContentSchema.parse({ type: 'link', originalLink: 'example.com/article' });
    expect(r.type === 'link' && r.originalLink).toBe('https://example.com/article');
  });

  it('normalises tags', () => {
    const r = CreateContentSchema.parse({ type: 'note', extractedText: 'hi', tags: ['#Deep Work', 'AI'] });
    expect(r.tags).toEqual(['deep-work', 'ai']);
  });

  it('requires note text and rejects unknown types', () => {
    expect(CreateContentSchema.safeParse({ type: 'note', extractedText: '  ' }).success).toBe(false);
    expect(CreateContentSchema.safeParse({ type: 'video', title: 'x' }).success).toBe(false);
    expect(CreateContentSchema.safeParse({ type: 'image', originalLink: 'https://x.com/a.png' }).success).toBe(false);
  });

  it('rejects empty updates and parses upload tags', () => {
    expect(UpdateContentSchema.safeParse({}).success).toBe(false);
    expect(UploadMetaSchema.parse({ tags: 'a, b ,,c' }).tags).toEqual(['a', 'b', 'c']);
  });

  it('validates list queries', () => {
    expect(ListContentQuerySchema.parse({ favorite: 'true', limit: '5' })).toMatchObject({ favorite: true, limit: 5 });
    expect(ListContentQuerySchema.safeParse({ cursor: 'zzz' }).success).toBe(false);
  });
});

import { CreateContentSchema } from './content.dto';

describe('Content DTO Validation', () => {
  it('validates a valid link content', () => {
    const valid = {
      type: 'link',
      title: 'Useful article',
      originalLink: 'https://example.com',
    };
    const result = CreateContentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates a valid note content', () => {
    const valid = {
      type: 'note',
      title: 'Meeting Notes',
      extractedText: 'Action items for Monday...',
      tags: ['work', 'meeting'],
    };
    const result = CreateContentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects unsupported content type', () => {
    const invalid = {
      type: 'video_unsupported',
      title: 'Invalid',
    };
    const result = CreateContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

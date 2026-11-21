import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

describe('AiService (Unit)', () => {
  let aiService: AiService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as ConfigService;
    aiService = new AiService(configService);
  });

  describe('chunkText', () => {
    it('should split text into chunks based on word limit', () => {
      const text = 'Sentence one. Sentence two. Sentence three. Sentence four.';
      const chunks = aiService.chunkText(text, 4, 1);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join(' ')).toContain('Sentence');
    });

    it('should handle single short sentence', () => {
      const text = 'This is a single short sentence.';
      const chunks = aiService.chunkText(text, 50, 10);
      expect(chunks).toEqual(['This is a single short sentence.']);
    });

    it('should handle empty or whitespace string', () => {
      const chunks = aiService.chunkText('   ', 50, 10);
      expect(chunks).toEqual([]);
    });
  });
});

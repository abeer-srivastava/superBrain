import { chunkText, cleanText, countWords } from './chunker';

describe('chunkText', () => {
  it('returns [] for blank input', () => {
    expect(chunkText('   \n ')).toEqual([]);
  });

  it('keeps short text as a single chunk', () => {
    expect(chunkText('This is a single short sentence.')).toEqual(['This is a single short sentence.']);
  });

  it('keeps every chunk within the word budget (fits the embedding window)', () => {
    const text = Array.from({ length: 200 }, (_, i) => `Sentence number ${i} talks about topic ${i % 7}.`).join(' ');
    const chunks = chunkText(text, 50, 10);
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(countWords(c)).toBeLessThanOrEqual(50);
  });

  it('overlaps consecutive chunks', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Alpha ${i} beta gamma delta.`).join(' ');
    const [a, b] = chunkText(text, 30, 10);
    const tail = a.split('. ').slice(-1)[0];
    expect(b).toContain(tail.replace(/\.$/, ''));
  });

  it('hard-splits a giant sentence with no punctuation', () => {
    const text = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(' ');
    const chunks = chunkText(text, 100, 20);
    for (const c of chunks) expect(countWords(c)).toBeLessThanOrEqual(100);
    expect(chunks.join(' ')).toContain('w999');
  });
});

describe('cleanText', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(cleanText('a\u0000b\u0007c   d\n\n\n\ne')).toBe('abc d\n\ne');
  });

  it('caps the number of words', () => {
    expect(countWords(cleanText('x '.repeat(50), 10))).toBe(10);
  });
});

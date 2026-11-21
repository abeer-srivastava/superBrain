import { reciprocalRankFusion, snippetAround } from './search.service';

describe('reciprocalRankFusion', () => {
  it('rewards items found by multiple retrievers', () => {
    const scores = reciprocalRankFusion([
      { ids: ['a', 'b', 'c'], weight: 1 },
      { ids: ['c', 'd'], weight: 1 },
    ]);
    const ranked = [...scores.entries()].sort((x, y) => y[1] - x[1]).map(([id]) => id);
    expect(ranked[0]).toBe('c');
    expect(ranked).toHaveLength(4);
  });

  it('respects weights', () => {
    const scores = reciprocalRankFusion([
      { ids: ['a'], weight: 1 },
      { ids: ['b'], weight: 1.5 },
    ]);
    expect(scores.get('b')!).toBeGreaterThan(scores.get('a')!);
  });
});

describe('snippetAround', () => {
  const text = `${'filler '.repeat(100)}the forgetting curve was described by Ebbinghaus ${'more '.repeat(100)}`;

  it('centres on the first matching term', () => {
    const s = snippetAround(text, 'Ebbinghaus curve', 40);
    expect(s).toContain('forgetting curve');
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
  });

  it('falls back to the start of the text', () => {
    expect(snippetAround('short text here', 'zzz')).toBe('short text here');
  });

  it('handles empty input', () => {
    expect(snippetAround(undefined, 'x')).toBe('');
  });
});

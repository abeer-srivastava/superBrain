/**
 * Sentence-boundary-aware chunking with overlap. Defaults keep chunks under
 * all-MiniLM-L6-v2's 256-token window (~180 words), so no text is silently
 * truncated before embedding. Pure function so it can be
 * unit tested and reused by the worker and the reindex script.
 */
export function chunkText(text: string, maxWords = 180, overlapWords = 30): string[] {
  const sentences = text.match(/[^.!?\n]+(?:[.!?]+["'”’)}\]]*|$)|\n+/g) || [text];
  const cleaned = sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  if (cleaned.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let count = 0;
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

  for (let sentence of cleaned) {
    // Hard-split pathological "sentences" (minified text, tables, transcripts).
    while (words(sentence) > maxWords) {
      const parts = sentence.split(/\s+/);
      if (current.length) {
        chunks.push(current.join(' '));
        current = [];
        count = 0;
      }
      chunks.push(parts.slice(0, maxWords).join(' '));
      sentence = parts.slice(maxWords - overlapWords).join(' ');
    }
    const n = words(sentence);
    if (count + n > maxWords && current.length > 0) {
      chunks.push(current.join(' '));
      const overlap: string[] = [];
      let oc = 0;
      for (let j = current.length - 1; j >= 0 && oc < overlapWords; j--) {
        overlap.unshift(current[j]);
        oc += words(current[j]);
      }
      current = overlap;
      count = oc;
    }
    current.push(sentence);
    count += n;
  }
  if (current.length) {
    const last = current.join(' ').trim();
    if (last && last !== chunks[chunks.length - 1]) chunks.push(last);
  }
  return chunks;
}

/** Normalise extracted text: drop control chars, collapse whitespace, cap length. */
export function cleanText(input: string, maxWords = 100_000): string {
  let text = input
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const words = text.split(/\s+/);
  if (words.length > maxWords) text = words.slice(0, maxWords).join(' ');
  return text;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

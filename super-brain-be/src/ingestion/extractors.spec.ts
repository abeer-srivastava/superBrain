import { extractHtml, youtubeId } from './extractors';

describe('youtubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=abc123def', 'abc123def'],
    ['https://www.youtube.com/shorts/abcdefghijk', 'abcdefghijk'],
    ['https://example.com/watch?v=nope', null],
    ['not a url', null],
  ])('%s → %s', (url, id) => expect(youtubeId(url)).toBe(id));
});

describe('extractHtml', () => {
  const html = `<!doctype html><html><head>
    <title>Fallback title</title>
    <meta property="og:title" content="The Real Title">
    <meta property="og:site_name" content="Example Mag">
    <meta property="og:image" content="/cover.jpg">
    <meta name="author" content="Ada Lovelace">
  </head><body>
    <nav>Home About Login</nav>
    <article>
      <h1>The Real Title</h1>
      <p>${'Knowledge compounds when it is connected. '.repeat(12)}</p>
      <p>Second paragraph about linking notes.</p>
      <script>evil()</script>
    </article>
    <footer>Copyright</footer>
  </body></html>`;

  it('extracts metadata and main content without chrome', () => {
    const r = extractHtml(html, 'https://example.com/post');
    expect(r.title).toBe('The Real Title');
    expect(r.siteName).toBe('Example Mag');
    expect(r.author).toBe('Ada Lovelace');
    expect(r.imageUrl).toBe('https://example.com/cover.jpg');
    expect(r.text).toContain('Second paragraph about linking notes.');
    expect(r.text).not.toMatch(/Login|Copyright|evil/);
    expect(r.text.split('\n').length).toBeGreaterThanOrEqual(3);
  });

  it('ignores non-http image URLs', () => {
    const r = extractHtml('<meta property="og:image" content="javascript:alert(1)"><body>hi</body>', 'https://e.com');
    expect(r.imageUrl).toBeUndefined();
  });
});

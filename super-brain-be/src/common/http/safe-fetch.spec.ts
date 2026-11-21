import { assertPublicUrl, isPrivateAddress, UnsafeUrlError } from './safe-fetch';

describe('SSRF guard', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1', 'not-an-ip',
  ])('blocks %s', (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700::1111'])('allows public %s', (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );

  it.each([
    'http://localhost:6333/collections',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://metadata.internal/',
    'file:///etc/passwd',
    'ftp://example.com/x',
    'http://user:pass@example.com/',
    'not a url',
  ])('rejects %s', async (url) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it('allows private addresses only when explicitly enabled', async () => {
    await expect(assertPublicUrl('http://127.0.0.1:8080/', true)).resolves.toBeInstanceOf(URL);
  });
});

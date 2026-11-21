import * as dns from 'node:dns';

/**
 * Optional workaround for flaky DNS resolution of Qdrant Cloud hosts seen on
 * some PaaS providers: remembers the last good IPv4 address for the Qdrant
 * hostname and reuses it when a lookup fails. Enabled only for https Qdrant
 * URLs (cloud), and can be disabled with QDRANT_DNS_CACHE=false.
 */
export function installQdrantDnsCache(qdrantUrl: string | undefined) {
  if (!qdrantUrl?.startsWith('https://') || process.env.QDRANT_DNS_CACHE === 'false') return;
  const host = new URL(qdrantUrl).hostname;
  let cachedIp = '';
  dns.resolve4(host, (err, addresses) => {
    if (!err && addresses.length > 0) cachedIp = addresses[0];
  });

  const original = dns.lookup;
  const patched = (hostname: string, options: any, callback?: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (hostname !== host) return (original as any)(hostname, options, callback);
    const fromCache = () => {
      const res = { address: cachedIp, family: 4 };
      return options?.all ? callback(null, [res]) : callback(null, res.address, res.family);
    };
    return (original as any)(hostname, options, (err: any, address: any, family: any) => {
      if (err && cachedIp) return fromCache();
      if (!err && !options?.all && typeof address === 'string') cachedIp = address;
      callback(err, address, family);
    });
  };
  (dns as any).lookup = patched;
}

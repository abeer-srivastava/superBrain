import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config({ path: '.env' });

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (QDRANT_URL.startsWith('https://')) {
  try {
    const qdrantHost = new URL(QDRANT_URL).hostname;
    let cachedIp = '';
    dns.resolve4(qdrantHost, (err, addresses) => {
      if (!err && addresses.length > 0) cachedIp = addresses[0];
    });
    const originalLookup = dns.lookup;
    dns.lookup = (hostname, options, callback) => {
      if (typeof options === 'function') { callback = options; options = {}; }
      if (hostname === qdrantHost && cachedIp) {
        const res = { address: cachedIp, family: 4 };
        return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
      }
      return originalLookup(hostname, options, (err, address, family) => {
        if (err && hostname === qdrantHost && cachedIp) {
          const res = { address: cachedIp, family: 4 };
          return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
        }
        if (!err && hostname === qdrantHost && !options.all) cachedIp = address;
        callback(err, address, family);
      });
    };
  } catch (e) {
    console.error('DNS patch failed', e);
  }
}

async function main() {
  const options = {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    checkCompatibility: false,
  };
  if (QDRANT_URL.startsWith('https://')) {
    const match = QDRANT_URL.match(/:(\d+)$/);
    options.port = match ? parseInt(match[1], 10) : 443;
  }
  
  const qdrant = new QdrantClient(options);
  try {
    const response = await qdrant.scroll('secondbrain', {
      limit: 100,
      with_payload: true,
      with_vector: false,
    });
    
    console.log(`Retrieved ${response.points.length} points from Qdrant:`);
    const contentCounts = {};
    for (const point of response.points) {
      const payload = point.payload || {};
      const contentId = payload.contentId || 'unknown';
      contentCounts[contentId] = (contentCounts[contentId] || 0) + 1;
      console.log(`- Point ID: ${point.id}, contentId: ${contentId}, title: "${payload.title}", text length: ${payload.text?.length}`);
    }
    
    console.log('\nSummary by contentId:', contentCounts);
  } catch (e) {
    console.error('Qdrant scroll failed:', e);
  }
}

main().catch(console.error);

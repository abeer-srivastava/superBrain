import mongoose from 'mongoose';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config({ path: '.env' });

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const MONGO_URL = process.env.MONGO_URL;

// DYNAMIC DNS MONKEY-PATCH for cloud Qdrant
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

async function inspect() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL);
  
  try {
    const db = mongoose.connection.db;
    const contents = await db.collection('contents').find({}).toArray();
    console.log(`\n--- MongoDB Status ---`);
    console.log(`Total documents: ${contents.length}`);
    
    const statuses = {};
    for (const c of contents) {
      statuses[c.status] = (statuses[c.status] || 0) + 1;
    }
    console.log('Document statuses:', statuses);
    
    console.log('\nSample documents:');
    contents.slice(0, 3).forEach(c => {
      console.log(`- Title: "${c.title}", Type: "${c.type}", Status: "${c.status}", Tags: ${JSON.stringify(c.tags)}`);
    });
  } catch (e) {
    console.error('Mongo query failed', e);
  } finally {
    await mongoose.disconnect();
  }

  console.log('\nConnecting to Qdrant...');
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
    const info = await qdrant.getCollection('secondbrain');
    console.log(`\n--- Qdrant Status ---`);
    console.log(`Collection status: ${info.status}`);
    console.log(`Vectors count: ${info.vectors_count}`);
    console.log(`Indexed vectors count: ${info.indexed_vectors_count}`);
    console.log(`Points count: ${info.points_count}`);
    console.log(`Vector config:`, JSON.stringify(info.config.params.vectors, null, 2));
  } catch (e) {
    console.error('Qdrant query failed:', e.message || e);
  }
}

inspect().catch(console.error);

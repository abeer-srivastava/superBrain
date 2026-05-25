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

async function main() {
  await mongoose.connect(MONGO_URL);
  try {
    const db = mongoose.connection.db;
    
    // Print all users
    const users = await db.collection('users').find({}).toArray();
    console.log('--- USERS ---');
    users.forEach(u => console.log(`- User ID: ${u._id.toString()}, Email: ${u.email || u.username}`));
    
    // Print all contents and their userIds
    const contents = await db.collection('contents').find({}).toArray();
    console.log('\n--- CONTENTS ---');
    contents.forEach(c => console.log(`- Content ID: ${c._id.toString()}, Title: "${c.title}", userId: ${c.userId?.toString()}, status: ${c.status}`));
    
    // Fetch Qdrant points payloads
    const qdrantOptions = {
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
      checkCompatibility: false,
    };
    if (QDRANT_URL.startsWith('https://')) {
      const match = QDRANT_URL.match(/:(\d+)$/);
      qdrantOptions.port = match ? parseInt(match[1], 10) : 443;
    }
    const qdrant = new QdrantClient(qdrantOptions);
    const scrollRes = await qdrant.scroll('secondbrain', { limit: 10, with_payload: true });
    console.log('\n--- QDRANT SAMPLE PAYLOADS ---');
    scrollRes.points.forEach(p => {
      console.log(`- Point ID: ${p.id}, contentId: ${p.payload?.contentId}, userId: ${p.payload?.userId}, title: "${p.payload?.title}"`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);

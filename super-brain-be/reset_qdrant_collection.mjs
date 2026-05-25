import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'node:dns';

// Load .env
dotenv.config({ path: '.env' });

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'secondbrain';

// DYNAMIC DNS MONKEY-PATCH
if (QDRANT_URL.startsWith('https://')) {
  try {
    const qdrantHost = new URL(QDRANT_URL).hostname;
    let cachedIp = '';

    dns.resolve4(qdrantHost, (err, addresses) => {
      if (!err && addresses.length > 0) {
        cachedIp = addresses[0];
      }
    });

    const originalLookup = dns.lookup;
    dns.lookup = (hostname, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (hostname === qdrantHost && cachedIp) {
        const res = { address: cachedIp, family: 4 };
        return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
      }
      return originalLookup(hostname, options, (err, address, family) => {
        if (err && hostname === qdrantHost && cachedIp) {
          const res = { address: cachedIp, family: 4 };
          return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
        }
        if (!err && hostname === qdrantHost && !options.all) {
          cachedIp = address;
        }
        callback(err, address, family);
      });
    };
  } catch (e) {
    console.error('Failed to configure dynamic DNS monkey-patch', e);
  }
}

async function reset() {
  console.log(`Connecting to Qdrant at ${QDRANT_URL}...`);
  const options = {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    checkCompatibility: false
  };

  if (QDRANT_URL.startsWith('https://')) {
    const match = QDRANT_URL.match(/:(\d+)$/);
    options.port = match ? parseInt(match[1], 10) : 443;
  }

  const client = new QdrantClient(options);

  try {
    console.log(`Deleting collection: ${COLLECTION_NAME}...`);
    await client.deleteCollection(COLLECTION_NAME);
    console.log('Collection deleted.');
  } catch (e) {
    console.log('Collection might not exist, skipping delete.');
  }

  console.log(`Creating collection ${COLLECTION_NAME} with dimension 4096...`);
  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: 4096,
      distance: 'Cosine'
    }
  });

  console.log('Creating payload index for userId...');
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: 'userId',
    field_schema: 'keyword',
    wait: true
  });

  console.log('Creating payload index for contentId...');
  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: 'contentId',
    field_schema: 'keyword',
    wait: true
  });

  console.log('Success! Collection reset to 4096 dimensions with indexing.');
}

reset().catch(console.error);

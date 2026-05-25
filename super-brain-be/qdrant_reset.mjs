import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

const url = process.env.QDRANT_URL || 'http://127.0.0.1:6333';

// DYNAMIC DNS MONKEY-PATCH
if (url.startsWith('https://')) {
  try {
    const qdrantHost = new URL(url).hostname;
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

const options = {
  url,
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
};

if (url.startsWith('https://')) {
  const match = url.match(/:(\d+)$/);
  options.port = match ? parseInt(match[1], 10) : 443;
}

const client = new QdrantClient(options);

async function reset() {
  try {
    // List existing collections
    const collections = await client.getCollections();
    console.log('Existing collections:', collections.collections.map(c => c.name));

    // Delete if exists
    const exists = collections.collections.find(c => c.name === 'secondbrain');
    if (exists) {
      console.log('Deleting collection "secondbrain"...');
      await client.deleteCollection('secondbrain');
      console.log('✅ Deleted successfully.');
    } else {
      console.log('Collection "secondbrain" does not exist, skipping delete.');
    }

    // Create with new 4096 dimensions
    console.log('Creating collection "secondbrain" with 4096-dim vectors...');
    await client.createCollection('secondbrain', {
      vectors: {
        size: 4096,
        distance: 'Cosine',
      },
    });
    console.log('✅ Collection created with 4096 dimensions!');

    console.log('Creating payload index for userId...');
    await client.createPayloadIndex('secondbrain', {
      field_name: 'userId',
      field_schema: 'keyword',
      wait: true
    });

    console.log('Creating payload index for contentId...');
    await client.createPayloadIndex('secondbrain', {
      field_name: 'contentId',
      field_schema: 'keyword',
      wait: true
    });

    // Verify
    const info = await client.getCollection('secondbrain');
    console.log('Collection info:', JSON.stringify(info.config.params.vectors, null, 2));
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

reset();

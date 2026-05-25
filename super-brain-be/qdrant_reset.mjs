import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: 'https://945ba0e7-c17a-40b8-ac1c-00ad9a4d5353.us-west-1-0.aws.cloud.qdrant.io:6333',
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.G_mxopsEXl8xSp0e9Dtx74ep_kGEJ3vQoueiH9xbnv0',
});

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

    // Create with new 768 dimensions
    console.log('Creating collection "secondbrain" with 768-dim vectors...');
    await client.createCollection('secondbrain', {
      vectors: {
        size: 768,
        distance: 'Cosine',
      },
    });
    console.log('✅ Collection created with 768 dimensions!');

    // Verify
    const info = await client.getCollection('secondbrain');
    console.log('Collection info:', JSON.stringify(info.config.params.vectors, null, 2));
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

reset();

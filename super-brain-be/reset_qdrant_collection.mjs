import { QdrantClient } from '@qdrant/js-client-rest';

async function main() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION || 'secondbrain';

  if (!url) {
    throw new Error('QDRANT_URL is required');
  }

  const client = new QdrantClient({
    url,
    apiKey,
    checkCompatibility: false,
  });

  const collections = await client.getCollections();
  const exists = collections.collections.some((collection) => collection.name === collectionName);

  if (!exists) {
    console.log(`Collection "${collectionName}" does not exist. Nothing to delete.`);
    return;
  }

  await client.deleteCollection(collectionName);
  console.log(`Deleted collection "${collectionName}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

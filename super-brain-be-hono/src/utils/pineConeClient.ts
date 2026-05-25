import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Get Pinecone Index instance using dynamic credentials
 * @param apiKey - Pinecone API Key
 * @param indexName - Pinecone Index Name
 * @returns Pinecone Index instance
 */
export function getPineconeIndex(apiKey: string, indexName: string) {
  if (!apiKey) {
    throw new Error("PINECONE_KEY is required to initialize Pinecone client");
  }
  const pc = new Pinecone({ apiKey });
  return pc.index(indexName);
}

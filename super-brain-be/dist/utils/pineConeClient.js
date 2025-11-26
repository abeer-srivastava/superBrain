import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();
// Initialize Pinecone client
export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_KEY || ""
});
// Get index name from environment or use default
const indexName = process.env.PINECONE_INDEX_NAME || "super-b2";
// Export the index
export const index = pinecone.index(indexName);
console.log(`📌 Pinecone initialized with index: ${indexName}`);
//# sourceMappingURL=pineConeClient.js.map
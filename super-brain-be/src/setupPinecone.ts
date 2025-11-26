import { pinecone } from "./utils/pineConeClient.js";

async function setupPineconeIndex() {
    const indexName = "super-brain";
    const dimension = 768; // Google Gemini text-embedding-004 dimension

    try {
        console.log(`🔍 Checking if index "${indexName}" exists...\n`);

        const indexes = await pinecone.listIndexes();
        const existingIndex = indexes.indexes?.find(idx => idx.name === indexName);

        if (existingIndex) {
            console.log(`✅ Index "${indexName}" already exists!`);
            console.log(`   Dimension: ${existingIndex.dimension}`);
            console.log(`   Metric: ${existingIndex.metric}`);
            console.log(`   Status: ${existingIndex.status?.state}\n`);

            if (existingIndex.dimension !== dimension) {
                console.log(`⚠️  WARNING: Index dimension (${existingIndex.dimension}) doesn't match Gemini embeddings (${dimension})`);
                console.log(`   You need to either:`);
                console.log(`   1. Delete the existing index and create a new one`);
                console.log(`   2. Use a different index name in your .env file\n`);
            }
        } else {
            console.log(`📝 Creating new index "${indexName}"...\n`);

            await pinecone.createIndex({
                name: indexName,
                dimension: dimension,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });

            console.log(`✅ Index "${indexName}" created successfully!`);
            console.log(`   Dimension: ${dimension}`);
            console.log(`   Metric: cosine`);
            console.log(`   Type: Serverless (AWS us-east-1)\n`);
            console.log(`⏳ Note: It may take a minute for the index to be ready.\n`);
        }
    } catch (error) {
        console.error("❌ Error setting up index:", error);
        console.log("\n💡 Manual setup instructions:");
        console.log("   1. Go to https://app.pinecone.io/");
        console.log("   2. Create a new Serverless index with:");
        console.log(`      - Name: ${indexName}`);
        console.log(`      - Dimensions: ${dimension}`);
        console.log("      - Metric: cosine");
        console.log("      - Cloud: AWS");
        console.log("      - Region: us-east-1");
    }
}

setupPineconeIndex();

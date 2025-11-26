import { pinecone } from "./utils/pineConeClient.js";
async function checkIndexStatus() {
    const indexName = "super-brain";
    try {
        console.log(`🔍 Checking status of index "${indexName}"...\n`);
        const indexDescription = await pinecone.describeIndex(indexName);
        console.log(`📊 Index Details:`);
        console.log(`   Name: ${indexDescription.name}`);
        console.log(`   Dimension: ${indexDescription.dimension}`);
        console.log(`   Metric: ${indexDescription.metric}`);
        console.log(`   Status: ${indexDescription.status?.state}`);
        console.log(`   Host: ${indexDescription.host}\n`);
        if (indexDescription.status?.state === 'Ready') {
            console.log(`✅ Index is READY to use!\n`);
            // Get stats
            const index = pinecone.index(indexName);
            const stats = await index.describeIndexStats();
            console.log(`📈 Index Statistics:`);
            console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
            console.log(`   Namespaces: ${stats.namespaces ? Object.keys(stats.namespaces).length : 0}\n`);
        }
        else {
            console.log(`⏳ Index is still initializing. Please wait a moment and try again.\n`);
        }
    }
    catch (error) {
        console.error("❌ Error checking index:", error);
    }
}
checkIndexStatus();
//# sourceMappingURL=checkIndex.js.map
import { pinecone } from "./utils/pineConeClient.js";
async function listIndexes() {
    try {
        console.log("🔍 Fetching Pinecone indexes...\n");
        const indexes = await pinecone.listIndexes();
        if (indexes.indexes && indexes.indexes.length > 0) {
            console.log("📋 Available Pinecone Indexes:\n");
            indexes.indexes.forEach((index, i) => {
                console.log(`${i + 1}. Name: ${index.name}`);
                console.log(`   Dimension: ${index.dimension}`);
                console.log(`   Metric: ${index.metric}`);
                console.log(`   Status: ${index.status?.state || 'unknown'}`);
                console.log("");
            });
        }
        else {
            console.log("⚠️  No indexes found in your Pinecone account.");
            console.log("\n💡 You need to create an index first.");
            console.log("   Visit: https://app.pinecone.io/");
        }
    }
    catch (error) {
        console.error("❌ Error listing indexes:", error);
    }
}
listIndexes();
//# sourceMappingURL=listIndexes.js.map
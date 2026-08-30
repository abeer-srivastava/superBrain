const { pipeline } = require('@huggingface/transformers');

async function main() {
  console.log("Starting download...");
  try {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'fp32' });
    console.log("Download successful!");
  } catch (error) {
    console.error("Download failed:", error);
  }
}

main();

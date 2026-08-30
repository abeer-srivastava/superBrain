const { pipeline, env } = require('@huggingface/transformers');
env.remoteHost = 'https://hf-mirror.com';

async function main() {
  console.log("Starting download with hf-mirror.com...");
  try {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'fp32' });
    console.log("Download successful!");
  } catch (error) {
    console.error("Download failed:", error);
  }
}

main();

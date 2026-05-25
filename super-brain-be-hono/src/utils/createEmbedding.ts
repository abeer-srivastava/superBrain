import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generate embeddings using Google Gemini (primary) or HuggingFace (fallback)
 * @param text - The text to generate embeddings for
 * @param geminiApiKey - Google Gemini API Key
 * @param hfApiKey - Hugging Face API Key (optional fallback)
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(
  text: string,
  geminiApiKey: string,
  hfApiKey?: string
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation");
  }

  // Try Google Gemini first
  try {
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      const embedding = result.embedding;

      if (embedding && embedding.values && Array.isArray(embedding.values)) {
        console.log(`✅ Generated embedding using Google Gemini (dimension: ${embedding.values.length})`);
        return embedding.values;
      }
    } else {
      console.warn("⚠️ Google Gemini API key not provided, skipping Gemini embedding.");
    }
  } catch (error) {
    console.warn("⚠️ Google Gemini embedding failed, falling back to HuggingFace:", error);
  }

  // Fallback to HuggingFace
  try {
    if (hfApiKey) {
      const hf = new HfInference(hfApiKey);
      const result = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text
      });

      // result is [Float32Array] or number[] etc., convert it to normal JS numbers:
      const first = Array.isArray(result) && result.length > 0 ? result[0] : [];
      const embedding = Array.from(first as Iterable<number>);
      console.log(`✅ Generated embedding using HuggingFace (dimension: ${embedding.length})`);
      return embedding;
    } else {
      throw new Error("HuggingFace API key is missing and Gemini failed/was skipped.");
    }
  } catch (error) {
    console.error("❌ HuggingFace embedding failed:", error);
    throw new Error("Failed to generate embedding with all providers");
  }
}

import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize clients
const hf = new HfInference(process.env.HF_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_KEY || "");

/**
 * Generate embeddings using Google Gemini (primary) or HuggingFace (fallback)
 * @param text - The text to generate embeddings for
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation");
  }

  // Try Google Gemini first
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    if (embedding && embedding.values && Array.isArray(embedding.values)) {
      console.log(`✅ Generated embedding using Google Gemini (dimension: ${embedding.values.length})`);
      return embedding.values;
    }
  } catch (error) {
    console.warn("⚠️ Google Gemini embedding failed, falling back to HuggingFace:", error);
  }

  // Fallback to HuggingFace
  try {
    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text
    });

    // result is [Float32Array], we convert it to normal JS numbers:
    const first = Array.isArray(result) && result.length > 0 ? result[0] : [];
    const embedding = Array.from(first as Iterable<number>);
    console.log(`✅ Generated embedding using HuggingFace (dimension: ${embedding.length})`);
    return embedding;
  } catch (error) {
    console.error("❌ HuggingFace embedding failed:", error);
    throw new Error("Failed to generate embedding with all providers");
  }
}

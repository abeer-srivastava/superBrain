import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private  logger = new Logger(AiService.name);

  // --- LLM Model Configuration ---
  private readonly llmModel = 'gemini-2.5-flash-lite';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not set! LLM features will fail.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(`LLM service ready — model: ${this.llmModel}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Retry Logic — handles Gemini 429 rate limits with exponential backoff
  // ──────────────────────────────────────────────────────────────────────────

  private async runWithRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 5000): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        const isRateLimit =
          error.status === 429 ||
          (error.message && error.message.includes('429')) ||
          (error.message && error.message.toLowerCase().includes('quota exceeded')) ||
          (error.message && error.message.toLowerCase().includes('too many requests')) ||
          (error.message && error.message.toLowerCase().includes('resource_exhausted'));

        if (isRateLimit && attempt < maxRetries) {
          let delay = initialDelay * Math.pow(2, attempt - 1);
          // Parse retry delay from Google API if available
          if (error.errorDetails && Array.isArray(error.errorDetails)) {
            const retryInfo = error.errorDetails.find(
              (d: any) => d.retryDelay || d['@type']?.includes('RetryInfo')
            );
            if (retryInfo && retryInfo.retryDelay) {
              const seconds = parseFloat(retryInfo.retryDelay);
              if (!isNaN(seconds)) {
                delay = Math.ceil(seconds + 1.5) * 1000; // Add 1.5s buffer
              }
            }
          }
          this.logger.warn(`Gemini API rate limit hit (429). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Summarization — generates a concise 1-2 sentence summary
  // ──────────────────────────────────────────────────────────────────────────

  async summarizeContent(text: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      return await this.runWithRetry(async () => {
        const model = this.genAI.getGenerativeModel({ model: this.llmModel });
        const prompt = `
You are a summarizing utility for a personal knowledge base.
Summarize the following content concisely (1-2 sentences, maximum 200 characters).

Rules:
1. Do NOT include any conversational filler, intro, or meta-commentary (e.g., do NOT start with "This summary is...", "Here is a summary...", "It appears...", "The text you pasted...", "This document contains...").
2. Start directly with the summarized content.
3. If the content is an error message, boilerplate code, login page, or blank/malformed page, summarize what it is directly in a few words (e.g., "Google Tag Manager tracking script" or "LeetCode error page").

Content:
${text.substring(0, 20000)}
`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
      });
    } catch (error) {
      this.logger.error('Failed to generate summary after retries', error);
      return '';
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tag Generation — generates 3-5 relevant tags
  // ──────────────────────────────────────────────────────────────────────────

  async generateTags(text: string): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      return await this.runWithRetry(async () => {
        const model = this.genAI.getGenerativeModel({ model: this.llmModel });
        const prompt = `Based on the following content, generate 3-5 relevant single-word tags (lowercase) for a personal knowledge base. Return only the tags separated by commas: \n\n${text.substring(0, 10000)}`;
        
        const result = await model.generateContent(prompt);
        const tagsText = result.response.text();
        return tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      });
    } catch (error) {
      this.logger.error('Failed to generate tags after retries', error);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RAG Q&A — answers questions grounded in user's content with citations
  // ──────────────────────────────────────────────────────────────────────────

  async askQuestion(
    context: string,
    question: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      return await this.runWithRetry(async () => {
        const model = this.genAI.getGenerativeModel({ model: this.llmModel });
        
        let historyText = '';
        if (history && history.length > 0) {
          historyText = '\nConversation History:\n' + history
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n') + '\n';
        }

        const prompt = `
You are an intelligent personal knowledge assistant (2nd Brain).
The user is asking a question about their saved content (they might call it their brain, vault, bookmarks, notes, or links).
Answer the question based ONLY on the numbered sources below. These sources represent the most relevant content retrieved from their brain.
Cite source numbers in your answer like [1], [2] when referencing specific information.
If the sources do not contain enough information to answer the question, say "I don't have information about that in your saved content."
Be concise, direct, and helpful.

CRITICAL: You must respond in the same language as the user's question.

Sources from user's brain:
${context}
${historyText}
Question:
${question}
`;
        const result = await model.generateContent(prompt);
        return result.response.text();
      });
    } catch (error) {
      this.logger.error('Failed to ask question after retries', error);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Text Chunking — sentence-boundary-aware with overlap
  // ──────────────────────────────────────────────────────────────────────────

  chunkText(text: string, maxWords = 500, overlapWords = 100): string[] {
    // Split into sentences — handles periods, exclamation marks, question marks, and newlines
    const sentences = text.match(/[^.!?\n]+(?:[.!?]+["'\u201d\u2019)}\]]*|$)|\n+/g) || [text];
    const cleanedSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (cleanedSentences.length === 0) {
      return [text.trim()].filter(t => t.length > 0);
    }

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const sentence of cleanedSentences) {
      const sentenceWordCount = sentence.split(/\s+/).length;

      // If adding this sentence exceeds the limit and we have content, finalize the chunk
      if (currentWordCount + sentenceWordCount > maxWords && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));

        // Build overlap: keep trailing sentences that fit within overlapWords
        const overlapChunk: string[] = [];
        let overlapCount = 0;
        for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapWords; j--) {
          overlapChunk.unshift(currentChunk[j]);
          overlapCount += currentChunk[j].split(/\s+/).length;
        }
        currentChunk = overlapChunk;
        currentWordCount = overlapCount;
      }

      currentChunk.push(sentence);
      currentWordCount += sentenceWordCount;
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      const lastChunk = currentChunk.join(' ').trim();
      if (lastChunk.length > 0) {
        chunks.push(lastChunk);
      }
    }

    return chunks;
  }
}

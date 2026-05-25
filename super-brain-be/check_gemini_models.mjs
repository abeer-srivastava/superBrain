import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // There isn't a direct "listModels" in the high-level SDK easily accessible, 
    // but we can try a few common names.
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-1.0-pro'];
    
    console.log('Testing models...');
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('hi');
        console.log(`✅ ${modelName}: SUCCESS`);
      } catch (e) {
        console.log(`❌ ${modelName}: FAILED (${e.message.split('\n')[0]})`);
      }
    }
  } catch (error) {
    console.error('Listing failed:', error);
  }
}

listModels();

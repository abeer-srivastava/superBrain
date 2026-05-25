import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function main() {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      console.error(await response.text());
      return;
    }
    const data = await response.json();
    console.log('Available Models:');
    for (const model of data.models) {
      console.log(`- ${model.name} (DisplayName: ${model.displayName}, SupportedMethods: ${model.supportedGenerationMethods.join(', ')})`);
    }
  } catch (error) {
    console.error('Failed to list models:', error);
  }
}

main();

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY is missing. Embeddings will fail.');
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' }
    });
    return result.embedding.values; // 768-dim vector
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const batches: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const embeddings = await Promise.all(batch.map(generateEmbedding));
    batches.push(...embeddings);
    // Sleep to respect rate limits
    if (i + 100 < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return batches;
}

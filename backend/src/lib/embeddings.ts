import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GeminiAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates a text embedding using the gemini-embedding-exp-03-07 model.
 * Falls back to a deterministic zero vector if the call fails, so the RAG
 * pipeline can continue without vector-DB retrieval.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-exp-03-07' });
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
    });
    return result.embedding.values;
  } catch (error) {
    // Return a zero vector so callers can still operate without embeddings
    console.warn('Embedding unavailable, returning zero vector:', (error as Error).message);
    return new Array(768).fill(0);
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const embeddings = await Promise.all(batch.map(generateEmbedding));
    results.push(...embeddings);
    if (i + 100 < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return results;
}

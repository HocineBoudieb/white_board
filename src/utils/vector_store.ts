import { pipeline, Pipeline } from '@xenova/transformers';

let embeddingPipeline: Pipeline | null = null;

// Initialize the embedding model (runs in browser)
export async function initEmbeddings(): Promise<Pipeline> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingPipeline;
}

// Generate embedding for a text
export async function generateEmbedding(text: string): Promise<Float32Array> {
  const model = await initEmbeddings();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return output.data;
}

// Generate embeddings for multiple texts
export async function generateEmbeddings(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Float32Array[]> {
  const embeddings: Float32Array[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }
  
  return embeddings;
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search for most similar chunks
export interface SearchResult {
  chunk: string;
  score: number;
  index: number;
}

export async function searchSimilarChunks(
  query: string,
  chunks: string[],
  embeddings: Float32Array[],
  topK: number = 3
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate similarities
  const similarities = embeddings.map((embedding, index) => ({
    chunk: chunks[index],
    score: cosineSimilarity(queryEmbedding, embedding),
    index
  }));
  
  // Sort by score and return top K
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// Batch process embeddings with progress
export async function batchGenerateEmbeddings(
  chunks: string[],
  batchSize: number = 10,
  onProgress?: (progress: number) => void
): Promise<Float32Array[]> {
  const embeddings: Float32Array[] = [];
  const totalBatches = Math.ceil(chunks.length / batchSize);
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchEmbeddings = await generateEmbeddings(batch);
    embeddings.push(...batchEmbeddings);
    
    if (onProgress) {
      const progress = ((i / chunks.length) * 100);
      onProgress(progress);
    }
  }
  
  if (onProgress) {
    onProgress(100);
  }
  
  return embeddings;
}
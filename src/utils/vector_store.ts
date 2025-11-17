function normalize(v: Float32Array) {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const o = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) o[i] = v[i] / n;
  return o;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function tokenize(t: string) {
  const a = t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const b: string[] = [];
  for (let i = 0; i < t.length - 1; i++) b.push(t.slice(i, i + 2));
  return a.concat(b);
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  const dim = 1024;
  const v = new Float32Array(dim);
  const toks = tokenize(text);
  for (const tok of toks) {
    const idx = hash(tok) % dim;
    v[idx] += 1;
  }
  return normalize(v);
}

function cosine(a: Float32Array, b: Float32Array) {
  let d = 0;
  for (let i = 0; i < a.length && i < b.length; i++) d += a[i] * b[i];
  return d;
}

export async function batchGenerateEmbeddings(chunks: string[], batchSize = 8, onProgress?: (progress: number) => void): Promise<Float32Array[]> {
  const total = chunks.length;
  let done = 0;
  const out: Float32Array[] = [];
  for (let i = 0; i < total; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const res = await Promise.all(batch.map((t) => generateEmbedding(t)));
    for (const r of res) {
      out.push(r);
      done++;
    }
    if (onProgress) onProgress(Math.round((done / total) * 100));
  }
  return out;
}

export function searchSimilarChunks(queryEmbedding: Float32Array, chunks: any, embeddings: Float32Array[], topK = 3): Array<{ chunk: string; score: number }> {
  const texts: string[] = Array.isArray(chunks) ? chunks : [];
  const scores = embeddings.map((e, i) => ({ idx: i, score: cosine(queryEmbedding, e) }));
  scores.sort((a, b) => b.score - a.score);
  const k = Math.min(topK, scores.length);
  const out: Array<{ chunk: string; score: number }> = [];
  for (let i = 0; i < k; i++) {
    const { idx, score } = scores[i];
    out.push({ chunk: texts[idx] || '', score });
  }
  return out;
}
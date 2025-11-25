/* eslint-disable */

// declare const self: any;

function normalize(vec: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
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

// This worker focuses on generating embeddings from provided text chunks.

self.onmessage = async (event: MessageEvent) => {
  const { type, fileName, chunks } = event.data as { type: string; fileName: string; chunks: string[] };
  if (type !== 'embed') return;
  try {
    const dim = 1024;
    const embeddings: number[][] = [];
    let done = 0;
    for (const chunk of chunks) {
      const v = new Float32Array(dim);
      const toks = tokenize(chunk);
      for (const tok of toks) {
        const idx = hash(tok) % dim;
        v[idx] += 1;
      }
      const norm = normalize(v);
      embeddings.push(Array.from(norm));
      done++;
      const progress = Math.round((done / chunks.length) * 100);
      self.postMessage({ type: 'progress', fileName, status: 'indexing', progress });
    }
    self.postMessage({ type: 'complete', fileName, chunks, embeddings });
  } catch (error: any) {
    self.postMessage({ type: 'error', fileName, error: error?.message || 'Embedding generation failed' });
  }
};
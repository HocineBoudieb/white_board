importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');

declare const pdfjsLib: any;

import { env, pipeline, Pipeline } from '@xenova/transformers';

import { batchGenerateEmbeddings, initEmbeddings } from '../utils/vector_store';

// Specify a custom location for the wasm files
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';

// Configure the environment
env.allowLocalModels = false;
env.allowQuantizedModels = false;

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

interface IndexMessage {
  type: 'index';
  fileContent: ArrayBuffer;
  fileName: string;
}

interface ProgressMessage {
  type: 'progress';
  fileName: string;
  progress: number;
  status: string;
}

interface CompleteMessage {
  type: 'complete';
  fileName: string;
  chunks: string[];
  embeddings: number[][];
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type WorkerMessage = ProgressMessage | CompleteMessage | ErrorMessage;

// Chunk text into smaller pieces
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

// Clean extracted text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

self.onmessage = async (event: MessageEvent<IndexMessage>) => {
  const data = event.data;
  console.log('Worker received message:', data);

  if (data.type === 'index') {
    try {
      const pdf = await pdfjsLib.getDocument(data.fileContent).promise;
      let allText = '';

      console.log(`Starting PDF text extraction for ${pdf.numPages} pages.`);
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        allText += text + '\n';

        const progress = (i / pdf.numPages) * 50;
        console.log(`PDF extraction progress: ${progress.toFixed(2)}%`);
        self.postMessage({
          type: 'progress',
          fileName: data.fileName,
          status: `Extracting text... (${i}/${pdf.numPages})`,
          progress: progress,
        });
      }
      console.log('PDF text extraction complete.');

      const cleanedText = cleanText(allText);
      const chunks = chunkText(cleanedText, 1000, 200);

      console.log('Initializing embedding model...');
      await initEmbeddings();
      console.log('Embedding model initialized.');

      console.log(`Generating embeddings for ${chunks.length} chunks.`);
      const embeddings = await batchGenerateEmbeddings(chunks, 10, (progress) => {
        const totalProgress = 50 + progress / 2;
        console.log(`Embedding generation progress: ${progress.toFixed(2)}% (Total: ${totalProgress.toFixed(2)}%)`);
        self.postMessage({
          type: 'progress',
          fileName: data.fileName,
          status: 'Generating embeddings...',
          progress: totalProgress,
        });
      });
      console.log('Embedding generation complete.');

      const serializedEmbeddings = embeddings.map(arr => Array.from(arr));

      console.log('Sending complete message.');
      self.postMessage({
        type: 'complete',
        fileName: data.fileName,
        chunks: chunks,
        embeddings: serializedEmbeddings,
      } as CompleteMessage);
    } catch (error: any) {
      self.postMessage({
        type: 'error',
        error: error.message || 'Failed to process PDF'
      } as ErrorMessage);
    }
  }
};
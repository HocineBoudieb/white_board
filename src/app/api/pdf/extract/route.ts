import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Use dynamic import to support both CommonJS and ESM builds of pdf-parse

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    const lastBreak = chunk.lastIndexOf('\n');
    if (lastBreak > 200) chunk = chunk.slice(0, lastBreak);
    chunks.push(chunk.trim());
    if (end >= text.length) break;
    start += chunk.length - overlap;
  }
  return chunks.filter((c) => c.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = '';
    try {
      const pdfParseModule: any = require('pdf-parse');
      const parseFn: any = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule?.default;
      if (typeof parseFn !== 'function') throw new Error('pdf-parse not a function');
      const result = await parseFn(buffer);
      text = result?.text || '';
    } catch {
      // @ts-ignore
      const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
      const loadingTask = pdfjs.getDocument({ data: buffer, disableWorker: true });
      const pdf = await loadingTask.promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ') + '\n';
      }
    }
    const chunks = chunkText(text);
    return NextResponse.json({ chunks });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to extract' }, { status: 500 });
  }
}
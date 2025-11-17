import { NextRequest, NextResponse } from 'next/server';
import { getTemporalClient } from '@/temporal/client';
import { indexPdfWorkflow } from '@/temporal/workflows/indexing.workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileId = formData.get('fileId') as string;

    if (!file || !fileId) {
      return NextResponse.json(
        { error: 'Missing file or fileId' },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Get Temporal client
    const client = await getTemporalClient();

    // Start workflow
    const workflowId = `pdf-indexing-${fileId}`;
    const handle = await client.workflow.start(indexPdfWorkflow, {
      taskQueue: 'pdf-indexing',
      workflowId,
      args: [
        {
          fileId,
          fileName: file.name,
          fileContent: arrayBuffer,
        },
      ],
    });

    console.log(`✅ Started workflow: ${workflowId}`);

    return NextResponse.json({
      success: true,
      workflowId,
      runId: handle.firstExecutionRunId,
    });
  } catch (error: any) {
    console.error('❌ Error starting workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start indexing' },
      { status: 500 }
    );
  }
}
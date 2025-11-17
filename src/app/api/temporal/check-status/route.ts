import { NextRequest, NextResponse } from 'next/server';
import { getTemporalClient } from '@/temporal/client';
import { getStatus } from '@/temporal/workflows/indexing.workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing workflowId' },
        { status: 400 }
      );
    }

    // Get Temporal client
    const client = await getTemporalClient();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    // Check if workflow is running
    const description = await handle.describe();

    if (description.status.name === 'RUNNING') {
      // Query the workflow for current status
      const status = await handle.query(getStatus);

      return NextResponse.json({
        workflowId,
        workflowStatus: 'running',
        ...status,
      });
    } else if (description.status.name === 'COMPLETED') {
      // Get the result
      const result = await handle.result();

      return NextResponse.json({
        workflowId,
        workflowStatus: 'completed',
        result,
      });
    } else {
      return NextResponse.json({
        workflowId,
        workflowStatus: description.status.name.toLowerCase(),
        error: 'Workflow failed or was terminated',
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking workflow status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
'use client';

import Whiteboard from '@/components/Whiteboard';
import { ReactFlowProvider } from 'reactflow';

export default function Home() {
  return (
    <main>
      <ReactFlowProvider>
        <Whiteboard />
      </ReactFlowProvider>
    </main>
  );
}

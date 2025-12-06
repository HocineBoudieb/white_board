import React, { memo, useEffect, useRef } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, useReactFlow } from 'reactflow';

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
}

interface ProgressData {
  title?: string;
  current: number; // 0..100
  milestones: Milestone[];
  stats?: { label: string; value: string }[];
}

const ProgressTrackerNode = ({ id, data }: NodeProps<ProgressData>) => {
  const completedCount = data.milestones.filter((m) => m.completed).length;
  const total = data.milestones.length;
  const contentRef = useRef<HTMLDivElement>(null);
  const { setNodes, getNode } = useReactFlow();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!contentRef.current) return;
      
      const contentHeight = contentRef.current.scrollHeight;
      const node = getNode(id);
      
      if (node && node.style) {
        const currentHeight = typeof node.style.height === 'number' 
          ? node.style.height 
          : parseInt(node.style.height as string || '0', 10);

        // Only resize if the content is significantly larger than current height
        // to avoid infinite loops or jitter
        if (Math.abs(contentHeight - currentHeight) > 5) {
          setNodes((nodes) =>
            nodes.map((n) => {
              if (n.id === id) {
                return { ...n, style: { ...n.style, height: contentHeight } };
              }
              return n;
            })
          );
        }
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [id, getNode, setNodes, data.milestones, data.stats]); // Re-run when data changes

  return (
    <div
      style={{
        background: '#fff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NodeResizer minWidth={250} />
      
      <div 
        ref={contentRef}
        style={{
          padding: 16,
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box' 
        }}
      >
        {data.title && <div style={{ fontWeight: 600, marginBottom: 8 }}>{data.title}</div>}
        {/* Bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>Progression</span>
            <span>{data.current.toFixed(0)} %</span>
          </div>
          <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                width: `${data.current}%`,
                height: '100%',
                background: '#6366f1',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
        {/* Milestones */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Jalons ({completedCount}/{total})</div>
          {data.milestones.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input type="checkbox" checked={m.completed} readOnly />
              <span style={{ textDecoration: m.completed ? 'line-through' : 'none', fontSize: 14 }}>{m.label}</span>
            </div>
          ))}
        </div>
        {/* Stats */}
        {data.stats && data.stats.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'space-around' }}>
            {data.stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ProgressTrackerNode);
import React, { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

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

const ProgressTrackerNode = ({ data }: { data: ProgressData }) => {
  const completedCount = data.milestones.filter((m) => m.completed).length;
  const total = data.milestones.length;

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#fff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NodeResizer />
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
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
  );
};

export default memo(ProgressTrackerNode);
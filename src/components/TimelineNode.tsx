import React, { memo, useState } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
}

interface TimelineData {
  events: TimelineEvent[];
}

const TimelineNode = ({ data }: { data: TimelineData }) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Sort chronologically
  const sorted = [...data.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div
      style={{
        padding: 16,
        background: '#fff',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <NodeResizer />
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Chronologie</div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* vertical line */}
        <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, background: '#ddd' }} />
        {sorted.map((evt, idx) => (
          <div
            key={evt.id}
            style={{
              position: 'relative',
              marginBottom: 16,
              cursor: 'pointer',
              padding: 8,
              borderRadius: 4,
              background: selected === evt.id ? '#f0f0ff' : 'transparent',
            }}
            onClick={() => setSelected(evt.id === selected ? null : evt.id)}
          >
            {/* dot */}
            <div
              style={{
                position: 'absolute',
                left: -19,
                top: 12,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: selected === evt.id ? '#6366f1' : '#bbb',
                border: '2px solid #fff',
              }}
            />
            <div style={{ fontSize: 12, color: '#555' }}>{evt.date}</div>
            <div style={{ fontWeight: 600 }}>{evt.title}</div>
            {selected === evt.id && evt.description && (
              <div style={{ marginTop: 6, fontSize: 14, color: '#444' }}>{evt.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TimelineNode);
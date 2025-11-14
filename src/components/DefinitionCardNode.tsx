import React, { memo, useState } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface DefinitionData {
  term: string;
  definition: string;
  example?: string;
  tags?: string[];
}

const DefinitionCardNode = ({ data }: { data: DefinitionData }) => {
  const [showExample, setShowExample] = useState(false);

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
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{data.term}</div>
      <div style={{ fontSize: 15, color: '#333', marginBottom: 8 }}>{data.definition}</div>
      {data.example && (
        <div style={{ marginBottom: 8 }}>
          <button
            style={{ fontSize: 12, padding: '4px 8px' }}
            onClick={() => setShowExample((s) => !s)}
          >
            {showExample ? 'Masquer exemple' : 'Voir exemple'}
          </button>
          {showExample && (
            <div style={{ marginTop: 6, fontStyle: 'italic', color: '#555' }}>Ex. : {data.example}</div>
          )}
        </div>
      )}
      {data.tags && data.tags.length > 0 && (
        <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {data.tags.map((t) => (
            <span
              key={t}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(DefinitionCardNode);
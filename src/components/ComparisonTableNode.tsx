import React, { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface Row {
  id: string;
  label: string;
  col1: string;
  col2: string;
}

interface ComparisonData {
  title?: string;
  headers: [string, string];
  rows: Row[];
}

const ComparisonTableNode = ({ data }: { data: ComparisonData }) => {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#fff',
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <NodeResizer />
      {data.title && <div style={{ fontWeight: 600, marginBottom: 12 }}>{data.title}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ccc' }}>Critère</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ccc' }}>{data.headers[0]}</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ccc' }}>{data.headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 500 }}>{r.label}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.col1}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.col2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(ComparisonTableNode);
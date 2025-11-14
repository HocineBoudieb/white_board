import React, { memo, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { NodeResizer } from '@reactflow/node-resizer';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MermaidNode = ({ data }: { data: { text: string } }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current && data.text) {
      try {
        mermaid.render('mermaid-svg', data.text, (svgCode) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svgCode;
          }
        });
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = 'Invalid Mermaid syntax';
        }
      }
    }
  }, [data.text]);

  return (
    <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 5, background: '#fff', width: '100%', height: '100%' }}>
      <NodeResizer />
      <div ref={mermaidRef}></div>
    </div>
  );
};

export default memo(MermaidNode);
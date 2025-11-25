import React, { memo, useEffect, useRef } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

const MermaidNode = ({ data, id }: { data: { text: string }, id: string }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(data.text || '');

  useEffect(() => {
    // Dynamically import mermaid only on the client to avoid SSR issues
    (async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        if (mermaidRef.current && data.text) {
          try {
            const id = `mermaid-svg-${Date.now()}`;
            // Clean the input text - remove problematic characters
            const cleanText = data.text
              .replace(/\\n/g, '\n')  // Handle escaped newlines
              .replace(/\r/g, '')     // Remove carriage returns
              .trim();
            
            if (!cleanText) {
              if (mermaidRef.current) {
                mermaidRef.current.innerHTML = '<div style="color: #666; font-style: italic;">Enter Mermaid diagram syntax...</div>';
              }
              return;
            }

            const { svg } = await mermaid.render(id, cleanText);
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
            }
          } catch (err: any) {
            console.error('Mermaid render failed:', err);
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `
                <div style="color: #e53e3e; font-size: 12px; padding: 10px; border: 1px solid #e53e3e; border-radius: 4px; background: #fff5f5;">
                  <strong>Syntax Error:</strong><br/>
                  ${err.message || 'Invalid Mermaid syntax'}<br/><br/>
                  <small>Example syntaxes:</small><br/>
                  <code style="background: #f7fafc; padding: 2px 4px; border-radius: 2px;">
                    graph TD; A-->B; B-->C;
                  </code><br/>
                  <code style="background: #f7fafc; padding: 2px 4px; border-radius: 2px;">
                    sequenceDiagram; A->>B: Hello;
                  </code>
                </div>
              `;
            }
          }
        }
      } catch (error) {
        console.error('Mermaid loading error:', error);
      }
    })();
  }, [data.text]);

  const handleSave = () => {
    // Update the node data using the global setNodes function
    if ((window as any).setNodes) {
      (window as any).setNodes((nodes: any[]) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, text: editText } }
            : node
        )
      );
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(data.text || '');
    setIsEditing(false);
  };

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #ddd',
        borderRadius: 5,
        background: '#fff',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <NodeResizer />
      
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter Mermaid diagram syntax..."
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'none',
              marginBottom: '8px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                background: '#f7fafc',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 8px',
                border: '1px solid #3182ce',
                borderRadius: '3px',
                background: '#3182ce',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div style={{ height: '100%', position: 'relative' }}>
          <div ref={mermaidRef} style={{ height: '100%' }} />
          <button
            onClick={() => setIsEditing(true)}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              background: '#f7fafc',
              cursor: 'pointer',
              fontSize: '11px',
              opacity: 0.7,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(MermaidNode);
import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { useState, useCallback } from 'react';

export function PostItNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  
  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, text: event.target.value } };
        }
        return node;
      })
    );
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={150} minHeight={150} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#fff740',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          transform: 'rotate(-1deg)',
          cursor: isEditing ? 'default' : 'move',
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <textarea
            value={data.text || ''}
            onChange={onChange}
            onBlur={() => setIsEditing(false)}
            placeholder="Écrire ici..."
            autoFocus
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none', 
              background: 'transparent', 
              resize: 'none', 
              fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
              fontSize: '16px',
              outline: 'none',
              color: '#333'
            }}
            className="nodrag"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
              fontSize: '16px',
              color: '#333',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
          >
            {data.text || 'Double-cliquez pour éditer'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </>
  );
}

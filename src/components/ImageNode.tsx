import React, { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Image as ImageIcon, Upload } from 'lucide-react';

export const ImageNode = memo(({ id, data }: NodeProps) => {
  const { setNodes } = useReactFlow();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setNodes((nodes: any[]) =>
          nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, url } }
              : n
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
      <NodeResizer minWidth={100} minHeight={100} />
      <Handle type="target" position={Position.Left} />
      
      {data.url ? (
        <img 
          src={data.url} 
          alt="Node content" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '10px'
        }}>
          <ImageIcon size={32} style={{ color: '#ccc', marginBottom: '8px' }} />
          <label 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #000',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '2px 2px 0px 0px #000',
            }}
          >
            <Upload size={14} />
            Choisir une image
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
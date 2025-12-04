import React, { memo, useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { LayoutGrid } from 'lucide-react';

export type GroupNodeProps = {
  data: {
    onFileDrop: (file: File, parentNodeId: string) => void;
    setNodes?: any;
    name?: string;
    onLayoutClick?: (id: string) => void;
  };
  id: string;
};

const GroupNode = ({ id, data }: GroupNodeProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [name, setName] = useState<string>(data?.name || '');

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf' && data.onFileDrop) {
        data.onFileDrop(file, id);
      }
      event.dataTransfer.clearData();
    }
  };

  return (
    <>
      <NodeResizer minWidth={100} minHeight={50} />
      <div
        className="group"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `3px dashed ${isDragOver ? '#3182ce' : '#000'}`,
          borderRadius: '0px',
          width: '100%',
          height: '100%',
          backgroundColor: isDragOver
            ? 'rgba(49, 130, 206, 0.1)'
            : 'rgba(0,0,0,0.05)',
          transition: 'border-color 0.2s, background-color 0.2s',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (data.setNodes) {
              const trimmed = (name || '').trim();
              data.setNodes((nds: any[]) =>
                nds.map((n: any) =>
                  n.id === id ? { ...n, data: { ...n.data, name: trimmed } } : n
                )
              );
            }
          }}
          placeholder="Nom du groupe"
          style={{
            position: 'absolute',
            top: -56,
            left: '0',
            padding: '8px 16px',
            borderRadius: 0,
            background: '#fff',
            fontSize: 24,
            fontWeight: 900,
            maxWidth: '100%',
            textAlign: 'left',
            outline: 'none',
            border: '3px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}
        />
        {data.onLayoutClick && (
          <button
            className="nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onLayoutClick?.(id);
            }}
            style={{
              position: 'absolute',
              top: -56,
              right: 0,
              padding: '8px',
              background: '#fff',
              border: '3px solid #000',
              boxShadow: '4px 4px 0px 0px #000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 56, // Match input height roughly
              width: 56,
            }}
            title="Réorganiser les nœuds"
          >
            <LayoutGrid size={24} />
          </button>
        )}
        {isDragOver && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#3182ce',
              fontWeight: 'bold',
            }}
          >
            Drop PDF here
          </div>
        )}
      </div>
    </>
  );
};

export default memo(GroupNode);
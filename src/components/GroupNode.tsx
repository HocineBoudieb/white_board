import React, { memo, useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

export type GroupNodeProps = {
  data: {
    onFileDrop: (file: File, parentNodeId: string) => void;
  };
  id: string;
};

const GroupNode = ({ id, data }: GroupNodeProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? '#3182ce' : '#000'}`,
          borderRadius: '5px',
          width: '100%',
          height: '100%',
          backgroundColor: isDragOver
            ? 'rgba(49, 130, 206, 0.1)'
            : 'rgba(0,0,0,0.05)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
      >
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
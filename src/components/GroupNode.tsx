import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const GroupNode = () => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={50} />
      <div
        style={{
          border: '2px dashed #000',
          borderRadius: '5px',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.05)',
        }}
      ></div>
    </>
  );
};

export default memo(GroupNode);
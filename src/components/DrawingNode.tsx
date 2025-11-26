import React, { useState } from 'react';
import { NodeProps } from 'reactflow';

interface Point {
  x: number;
  y: number;
}

interface DrawingNodeData {
  lines: Point[][];
  setNodes: any;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

export function DrawingNode({ data, id, xPos, yPos }: NodeProps<DrawingNodeData>) {
  const [isHovered, setIsHovered] = useState(false);

  if (!data || !data.lines || data.lines.length === 0) {
    return null;
  }

  const color = data.color || 'black';
  const strokeWidth = data.strokeWidth || 2;
  const opacity = data.opacity || 1;

  const handleDelete = () => {
    data.setNodes((nodes: any) => nodes.filter((n: any) => n.id !== id));
  };

  const allPoints = data.lines.flat();
  if (allPoints.length === 0) {
    return null;
  }

  const pathData = data.lines
    .map((line) => {
      if (line.length === 0) return '';
      return `M ${line[0].x} ${line[0].y} ${line.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}`;
    })
    .join(' ');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {isHovered && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          X
        </button>
      )}
      <svg
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          opacity: opacity,
        }}
      >
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ pointerEvents: 'all' }}
        />
      </svg>
    </div>
  );
}
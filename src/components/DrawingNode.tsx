import React from 'react';
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
  if (!data || !data.lines || data.lines.length === 0) {
    return null;
  }

  const color = data.color || 'black';
  const strokeWidth = data.strokeWidth || 2;
  const opacity = data.opacity || 1;

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
      data-id={id}
      className="drawing-node-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          opacity: opacity,
          pointerEvents: 'none',
        }}
      >
        {/* Hitbox path - invisible but thicker */}
        <path
          d={pathData}
          stroke="transparent"
          strokeWidth={Math.max(strokeWidth + 20, 25)}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Visible path */}
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  );
}
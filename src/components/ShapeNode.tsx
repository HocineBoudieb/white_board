import React, { memo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

export type ShapeType = 'arrow' | 'line' | 'double_arrow' | 'circle' | 'rectangle';
export type ShapeStyle = 'solid' | 'dashed' | 'dotted';

export type ShapeNodeData = {
  type: ShapeType;
  style: ShapeStyle;
  color?: string;
  strokeWidth?: number;
  label?: string;
};

const ShapeNode = ({ data, selected, id }: NodeProps<ShapeNodeData>) => {
  const { type = 'arrow', style = 'solid', color = '#000', strokeWidth = 2 } = data;

  const getStrokeDasharray = () => {
    switch (style) {
      case 'dashed': return '5,5';
      case 'dotted': return '2,2';
      default: return 'none';
    }
  };

  const renderShape = () => {
    const strokeDasharray = getStrokeDasharray();
    
    switch (type) {
      case 'circle':
        return (
          <ellipse
            cx="50%"
            cy="50%"
            rx="48%"
            ry="48%"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            fill="transparent"
          />
        );
      case 'rectangle':
        return (
          <rect
            x="2%"
            y="2%"
            width="96%"
            height="96%"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            fill="transparent"
            rx={4}
          />
        );
      case 'line':
      case 'arrow':
      case 'double_arrow':
        // For lines and arrows, we draw from left-center to right-center
        // This allows the user to rotate/resize
        // Wait, resizing a horizontal line only changes width.
        // If we want diagonal, we need SVG line from corner to corner.
        // But standard resizer keeps orientation.
        // Let's stick to horizontal for now and maybe add rotation later or 
        // just use corner-to-corner if we implement drag creation properly.
        
        // Simple approach: Center line.
        return (
          <>
            <defs>
              <marker
                id={`head-${id}`}
                orient="auto"
                markerWidth={6}
                markerHeight={6}
                refX={5}
                refY={3}
              >
                <path d="M0,0 L0,6 L6,3 z" fill={color} />
              </marker>
              <marker
                id={`tail-${id}`}
                orient="auto"
                markerWidth={6}
                markerHeight={6}
                refX={1}
                refY={3}
              >
                <path d="M6,0 L6,6 L0,3 z" fill={color} />
              </marker>
            </defs>
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              markerEnd={type === 'arrow' || type === 'double_arrow' ? `url(#head-${id})` : undefined}
              markerStart={type === 'double_arrow' ? `url(#tail-${id})` : undefined}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={50} 
        minHeight={20} 
        // Keep aspect ratio false
      />
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {renderShape()}
        </svg>
      </div>
    </>
  );
};

export default memo(ShapeNode);

import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position } from 'reactflow';

export function ImageNode({ data }: NodeProps) {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <img src={data.url} alt="" style={{ width: '100%', height: '100%' }} />
      <Handle type="source" position={Position.Right} />
    </>
  );
}
import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position } from 'reactflow';
import ReactMarkdown from 'react-markdown';

export function MarkdownNode({ data }: NodeProps) {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>
        <ReactMarkdown>{data.text}</ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
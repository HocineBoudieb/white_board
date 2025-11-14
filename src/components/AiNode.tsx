import { NodeResizer } from '@reactflow/node-resizer';
import { Node, NodeProps, useReactFlow } from 'reactflow';
import { Handle, Position } from 'reactflow';

export type AiNodeData = {
  label: string;
  text: string;
  onSubmit: (text: string) => void;
};

export type AiNode = Node<AiNodeData>;

export default function AiNode({ id, data, selected }: NodeProps<AiNodeData>) {
  const { setNodes } = useReactFlow();

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      data.onSubmit(event.currentTarget.value);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          node.data.text = event.target.value;
        }
        return node;
      })
    );
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>
        <textarea
          defaultValue={data.text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none' }}
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
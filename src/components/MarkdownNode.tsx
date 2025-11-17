import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import "easymde/dist/easymde.min.css";
import styles from './MarkdownNode.module.css';

const SimpleMdeEditor = dynamic(() => import("react-simplemde-editor"), { ssr: false });

export function MarkdownNode({ id, data }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    setText(data.text);
  }, [data.text]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, text } };
        }
        return node;
      })
    );
  }, [id, text, setNodes]);

  const onTextChange = (value: string) => {
    setText(value);
  };

  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }} onDoubleClick={handleDoubleClick} onBlur={handleBlur} className={styles['markdown-content']}>
        {isEditing ? (
          <SimpleMdeEditor
            value={text}
            onChange={onTextChange}
          />
        ) : (
          <ReactMarkdown>{text}</ReactMarkdown>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
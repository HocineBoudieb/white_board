import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './MarkdownNode.module.css';

export function MarkdownNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const { setNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(data.text);
  }, [data.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Optional: Move cursor to end
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

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

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={200} minHeight={100} />
      <Handle type="target" position={Position.Left} />
      <div 
        className={styles.container}
        onDoubleClick={handleDoubleClick} 
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onTextChange}
            onBlur={handleBlur}
            className={`${styles.editor} nodrag`}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Write markdown here..."
          />
        ) : (
          <div className={styles.markdownContent}>
            <ReactMarkdown>{text || '*Double-click to edit*'}</ReactMarkdown>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

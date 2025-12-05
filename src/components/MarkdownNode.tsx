import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './MarkdownNode.module.css';

export function MarkdownNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const { setNodes, getNode } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(data.text);
  }, [data.text]);

  useEffect(() => {
    if (!isEditing && contentRef.current) {
      // Give it a moment to render the markdown
      requestAnimationFrame(() => {
        if (!contentRef.current) return;
        
        const contentHeight = contentRef.current.scrollHeight;
        const node = getNode(id);
        
        if (node && node.style) {
          const currentHeight = typeof node.style.height === 'number' 
            ? node.style.height 
            : parseInt(node.style.height as string || '0', 10);

          // If content is taller than current height, expand it
          // We add a small buffer (e.g. 30px) to ensure no scrollbar appears
          if (contentHeight > currentHeight) {
            setNodes((nodes) =>
              nodes.map((n) => {
                if (n.id === id) {
                  return { ...n, style: { ...n.style, height: contentHeight + 30 } };
                }
                return n;
              })
            );
          }
        }
      });
    }
  }, [text, isEditing, id, setNodes, getNode]);

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
          <div className={styles.markdownContent} ref={contentRef}>
            <ReactMarkdown>{text || '*Double-click to edit*'}</ReactMarkdown>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

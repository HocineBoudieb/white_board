import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { useState, useEffect, useRef } from 'react';

export function TodoNode({ id, data }: NodeProps) {
  const [items, setItems] = useState(data.items || []);
  const { setNodes, getNode } = useReactFlow();
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync local state with React Flow data
  const updateData = (newItems: any[]) => {
    setItems(newItems);
    setNodes((nodes) => 
      nodes.map((node) => 
        node.id === id 
          ? { ...node, data: { ...node.data, items: newItems } } 
          : node
      )
    );
  };

  const addItem = () => {
    updateData([...items, { text: '', completed: false }]);
  };

  const updateItemText = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index].text = text;
    updateData(newItems);
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    updateData(newItems);
  };

  // Auto-resize logic for textareas and node
  useEffect(() => {
    const resizeTextareas = () => {
      if (!contentRef.current) return;
      const textareas = contentRef.current.querySelectorAll('textarea');
      textareas.forEach((t) => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!contentRef.current) return;
      
      // First ensure textareas are the right height for the current width
      resizeTextareas();
      
      const contentHeight = contentRef.current.scrollHeight;
      const node = getNode(id);
      
      if (node && node.style) {
        const currentHeight = typeof node.style.height === 'number' 
          ? node.style.height 
          : parseInt(node.style.height as string || '0', 10);

        // Only resize if the content height differs significantly
        if (Math.abs(contentHeight - currentHeight) > 5) {
          setNodes((nodes) =>
            nodes.map((n) => {
              if (n.id === id) {
                return { ...n, style: { ...n.style, height: contentHeight } };
              }
              return n;
            })
          );
        }
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      // Initial resize
      resizeTextareas();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [items, id, getNode, setNodes]);

  return (
    <>
      <NodeResizer minWidth={200} minHeight={100} />
      <Handle type="target" position={Position.Left} />
      <div 
        ref={contentRef}
        className="nodrag" // Allow text selection and interaction
        style={{ 
          height: '100%', 
          width: '100%', 
          padding: 10, 
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {items.map((item: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 5 }}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(index)}
              style={{ marginRight: 8, marginTop: 6 }}
            />
            <textarea
              value={item.text}
              onChange={(e) => updateItemText(index, e.target.value)}
              placeholder="Todo item..."
              rows={1}
              style={{
                textDecoration: item.completed ? 'line-through' : 'none',
                border: 'none',
                background: 'transparent',
                width: '100%',
                outline: 'none',
                fontSize: '14px',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />
          </div>
        ))}
        <button 
          onClick={addItem}
          style={{
            marginTop: 5,
            padding: '5px 10px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '12px',
            alignSelf: 'flex-start'
          }}
        >
          + Add item
        </button>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
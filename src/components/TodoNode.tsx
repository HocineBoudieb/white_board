import { NodeResizer } from '@reactflow/node-resizer';
import { NodeProps, Handle, Position } from 'reactflow';
import { useState } from 'react';

export function TodoNode({ data }: NodeProps) {
  const [items, setItems] = useState(data.items || []);

  const addItem = () => {
    setItems([...items, { text: '', completed: false }]);
  };

  const updateItemText = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index].text = text;
    setItems(newItems);
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    setItems(newItems);
  };

  return (
    <>
      <NodeResizer minWidth={200} minHeight={100} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>
        {items.map((item: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(index)}
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItemText(index, e.target.value)}
              style={{
                textDecoration: item.completed ? 'line-through' : 'none',
                border: 'none',
                background: 'transparent',
              }}
            />
          </div>
        ))}
        <button onClick={addItem}>+ Add item</button>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
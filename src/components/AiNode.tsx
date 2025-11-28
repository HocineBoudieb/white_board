import { NodeResizer } from '@reactflow/node-resizer';
import { useEffect, useRef } from 'react';
import { Node, NodeProps, useReactFlow } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { generateEmbedding, searchSimilarChunks } from '../utils/vector_store';

export type AiNodeData = {
  label: string;
  text: string;
  isLoading?: boolean;
  onSubmit: (text: string, context?: string) => void;
};

export type AiNode = Node<AiNodeData>;

export default function AiNode({ id, data, selected }: NodeProps<AiNodeData>) {
  const { setNodes, getNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    if (measureRef.current && data.text) {
      const newWidth = Math.min(Math.max(measureRef.current.offsetWidth + 40, 200), 600);
      setNodes((nodes) => 
        nodes.map((n) => 
          n.id === id ? { ...n, style: { ...n.style, width: newWidth } } : n
        )
      );
    }
  }, [data.text, id, setNodes]);

  const onKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const inputValue = event.currentTarget.value;
      const node = getNodes().find((n) => n.id === id);
      if (node && node.parentNode) {
        const parentNode = getNodes().find((n) => n.id === node.parentNode);
        if (parentNode) {
          const allNodes = getNodes();
          const siblingNodes = allNodes.filter((n) => n.parentNode === parentNode.id && n.id !== id);

          const textContext = siblingNodes
            .filter((n) => n.type === 'text' || n.type === 'markdown')
            .map((n) => n.data.text)
            .join('\n');

          const fileNodes = siblingNodes.filter((n) => n.type === 'file' && n.data.status === 'completed');

          let ragContext = '';

          if (fileNodes.length > 0) {
            const query = inputValue;
            const queryEmbedding = await generateEmbedding(query);

            for (const fileNode of fileNodes) {
              const similarChunks = await searchSimilarChunks(queryEmbedding, fileNode.data.chunks, fileNode.data.embeddings, 3);
              console.log('RAG recherche', {
                requete: query,
                fichier: fileNode.data.fileName,
                resultats: similarChunks,
              });
              if (similarChunks.length > 0) {
                ragContext += `\n\n--- Context from ${fileNode.data.fileName} ---\n`;
                ragContext += similarChunks.map((chunk) => chunk.chunk).join('\n\n');
                ragContext += '\n--- End of context ---';
              }
            }
          }

          const finalContext = `${textContext}${ragContext}`.trim();
          data.onSubmit(inputValue, finalContext);
          return;
        }
      }
      data.onSubmit(inputValue);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              text: event.target.value,
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }} className={data.isLoading ? 'thinking-node' : ''}>
        {data.isLoading && (
          <div className="thinking-overlay">
            <div className="thinking-spinner" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={data.text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={data.isLoading}
          maxLength={2000}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            resize: 'none',
            overflow: 'hidden',
            minHeight: '24px',
            fontFamily: 'inherit',
          }}
        />
        <div
          style={{
            textAlign: 'right',
            fontSize: '10px',
            color: (data.text?.length || 0) > 1800 ? 'red' : '#aaa',
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {data.text?.length || 0}/2000
        </div>
        
        {/* Hidden measurement div */}
        <div
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            height: 'auto',
            width: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            padding: 0,
          }}
        >
          {data.text}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
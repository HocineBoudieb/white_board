import { NodeResizer } from '@reactflow/node-resizer';
import { Node, NodeProps, useReactFlow } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { generateEmbedding, searchSimilarChunks } from '../utils/vector_store';

export type AiNodeData = {
  label: string;
  text: string;
  onSubmit: (text: string, context?: string) => void;
};

export type AiNode = Node<AiNodeData>;

export default function AiNode({ id, data, selected }: NodeProps<AiNodeData>) {
  const { setNodes, getNodes } = useReactFlow();

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
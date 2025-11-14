'use client'

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  useReactFlow,
} from 'reactflow';
import '@reactflow/node-resizer/dist/style.css';
import AiNode, { AiNodeData } from './AiNode';
import GroupNode from './GroupNode';
import { MarkdownNode } from './MarkdownNode';
import { ImageNode } from './ImageNode';
import { TodoNode } from './TodoNode';
import { DrawingNode } from './DrawingNode';
import MermaidNode from './MermaidNode';
import FlashcardNode from './FlashcardNode';
import QuizNode from './QuizNode';
import TimelineNode from './TimelineNode';
import DefinitionCardNode from './DefinitionCardNode';
import FormulaNode from './FormulaNode';
import ComparisonTableNode from './ComparisonTableNode';
import ProgressTrackerNode from './ProgressTrackerNode';

const proOptions = { hideAttribution: true };

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
  text: AiNode,
  group: GroupNode,
  markdown: MarkdownNode,
  image: ImageNode,
  todo: TodoNode,
  drawing: DrawingNode,
  mermaid: MermaidNode,
  flashcard: FlashcardNode,
  quiz: QuizNode,
  timeline: TimelineNode,
  definition: DefinitionCardNode,
  formula: FormulaNode,
  comparison: ComparisonTableNode,
  progress: ProgressTrackerNode,
};

export default function Whiteboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(0);
  const { screenToFlowPosition, getNodes, getNode } = useReactFlow();
  const lastClickTime = React.useRef(0);
  const isDrawing = React.useRef(false);
  const currentDrawing = React.useRef<any>(null);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleAiNodeSubmit = useCallback(
    (originNodeId: string, text: string) => {
      const originNode = getNode(originNodeId);
      if (!originNode) return;

      // Créer un node de chargement temporaire
      const loadingId = `loading-${nodeId + 1}`;
      setNodeId((prev) => prev + 1);

      const loadingNode: Node = {
        id: loadingId,
        type: 'markdown',
        position: {
          x: originNode.position.x + (originNode.width || 0) + 20,
          y: originNode.position.y,
        },
        data: {
          text: '🤔 AI is thinking...',
        },
        parentNode: originNode.parentNode,
        extent: originNode.extent,
      };

      setNodes((nodes) => nodes.concat(loadingNode));

      fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'user', 
              content: `${text}

IMPORTANT: Respond ONLY with a valid JSON array of nodes. Do not include any other text, explanation, or markdown formatting.

Each node should have this structure:
{
  "type": "markdown" | "todo" | "image" | "drawing" | "mermaid" | "flashcard" | "quiz" | "timeline" | "definition" | "formula" | "comparison" | "progress",
  "data": { ... }
}

Available node types:
- markdown: { "text": "markdown content" }
- todo: { "items": [{ "text": "item text", "completed": false }] }
- image: { "url": "image url" }
- drawing: { "lines": [[{"x": 0, "y": 0}, {"x": 10, "y": 10}]] }
- mermaid: { "text": "mermaid diagram syntax" }
- flashcard: { "front": "recto", "back": "verso" }
- quiz: { "question": "Q?", "choices": [{ "id": "1", "text": "A", "correct": true }, { "id": "2", "text": "B", "correct": false }], "explanation": "optional" }
- timeline: { "events": [{ "id": "1", "date": "2024-01-01", "title": "Event", "description": "optional" }] }
- definition: { "term": "Mot", "definition": "Définition", "example": "optional", "tags": ["tag1"] }
- formula: { "latex": "a + b", "variables": { "a": 1, "b": 2 } }
- comparison: { "headers": ["A", "B"], "rows": [{ "id": "1", "label": "Critère", "col1": "val A", "col2": "val B" }] }
- progress: { "current": 75, "milestones": [{ "id": "1", "label": "Done", "completed": true }], "stats": [{ "label": "Heures", "value": "12h" }] }

Example response:
[
  {
    "type": "markdown",
    "data": {
      "text": "# Hello\\nThis is markdown"
    }
  },
  {
    "type": "todo",
    "data": {
      "items": [
        { "text": "Task 1", "completed": false },
        { "text": "Task 2", "completed": true }
      ]
    }
  }
]

Respond with ONLY the JSON array, nothing else.` 
            },
          ],
        }),
      }).then(async (response) => {
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sepIndex = buffer.indexOf('\n\n');
          while (sepIndex !== -1) {
            const eventChunk = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);

            const dataLines = eventChunk
              .split('\n')
              .filter((line) => line.startsWith('data:'));
            if (dataLines.length > 0) {
              const jsonStr = dataLines
                .map((line) => line.replace(/^data:\s*/, ''))
                .join('');
              try {
                const evt = JSON.parse(jsonStr);
                if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
                  fullText += evt.delta;
                } else if (evt.type === 'error' && evt.error) {
                  setNodes((nodes) =>
                    nodes.map((node) =>
                      node.id === loadingId
                        ? { ...node, data: { ...node.data, text: `Error: ${evt.error}` } }
                        : node
                    )
                  );
                  return;
                }
              } catch (e) {
                // ignore malformed frames
              }
            }

            sepIndex = buffer.indexOf('\n\n');
          }
        }

        // Une fois le stream terminé, parser le JSON et créer les nodes
        try {
          // Nettoyer le texte (enlever markdown code blocks si présent)
          let cleanedText = fullText.trim();
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
          }

          const nodesData = JSON.parse(cleanedText);

          if (!Array.isArray(nodesData)) {
            throw new Error('Response is not an array');
          }

          // Supprimer le node de chargement
          setNodes((nodes) => nodes.filter((n) => n.id !== loadingId));

          // Créer les nouveaux nodes
          let currentNodeId = nodeId + 1;
          const newNodes: Node[] = [];
          const baseX = originNode.position.x + (originNode.width || 0) + 20;
          let currentY = originNode.position.y;

          nodesData.forEach((nodeData: any, index: number) => {
            const newId = `node-${currentNodeId}`;
            currentNodeId++;

            let newNode: Node | null = null;

            switch (nodeData.type) {
              case 'markdown':
                newNode = {
                  id: newId,
                  type: 'markdown',
                  position: { x: baseX, y: currentY },
                  data: {
                    text: nodeData.data.text || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200; // Espacement vertical
                break;

              case 'todo':
                newNode = {
                  id: newId,
                  type: 'todo',
                  position: { x: baseX, y: currentY },
                  data: {
                    items: nodeData.data.items || [],
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 250;
                break;

              case 'image':
                newNode = {
                  id: newId,
                  type: 'image',
                  position: { x: baseX, y: currentY },
                  data: {
                    url: nodeData.data.url || nodeData.data.src || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 300;
                break;

              case 'drawing':
                newNode = {
                  id: newId,
                  type: 'drawing',
                  position: { x: baseX, y: currentY },
                  data: {
                    lines: nodeData.data.lines || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200;
                break;
              case 'mermaid':
                newNode = {
                  id: newId,
                  type: 'mermaid',
                  position: { x: baseX, y: currentY },
                  data: {
                    text: nodeData.data.text || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 250;
                break;

              case 'flashcard':
                newNode = {
                  id: newId,
                  type: 'flashcard',
                  position: { x: baseX, y: currentY },
                  data: {
                    front: nodeData.data.front || '',
                    back: nodeData.data.back || '',
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200;
                break;

              case 'quiz':
                newNode = {
                  id: newId,
                  type: 'quiz',
                  position: { x: baseX, y: currentY },
                  data: {
                    question: nodeData.data.question || '',
                    choices: nodeData.data.choices || [],
                    explanation: nodeData.data.explanation || '',
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 250;
                break;

              case 'timeline':
                newNode = {
                  id: newId,
                  type: 'timeline',
                  position: { x: baseX, y: currentY },
                  data: {
                    events: nodeData.data.events || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 300;
                break;

              case 'definition':
                newNode = {
                  id: newId,
                  type: 'definition',
                  position: { x: baseX, y: currentY },
                  data: {
                    term: nodeData.data.term || '',
                    definition: nodeData.data.definition || '',
                    example: nodeData.data.example || '',
                    tags: nodeData.data.tags || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200;
                break;

              case 'formula':
                newNode = {
                  id: newId,
                  type: 'formula',
                  position: { x: baseX, y: currentY },
                  data: {
                    latex: nodeData.data.latex || '',
                    variables: nodeData.data.variables || {},
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200;
                break;

              case 'comparison':
                newNode = {
                  id: newId,
                  type: 'comparison',
                  position: { x: baseX, y: currentY },
                  data: {
                    title: nodeData.data.title || 'Comparaison',
                    headers: nodeData.data.headers || ['Item A', 'Item B'],
                    rows: nodeData.data.rows || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 250;
                break;

              case 'progress':
                newNode = {
                  id: newId,
                  type: 'progress',
                  position: { x: baseX, y: currentY },
                  data: {
                    current: nodeData.data.current || 0,
                    milestones: nodeData.data.milestones || [],
                    stats: nodeData.data.stats || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                };
                currentY += 200;
                break;
            }

            if (newNode) {
              newNodes.push(newNode);
            }
          });

          setNodeId(currentNodeId);
          setNodes((nodes) => [...nodes, ...newNodes]);

        } catch (error) {
          console.error('Error parsing AI response:', error);
          // En cas d'erreur, afficher le texte brut dans un node markdown
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === loadingId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      text: `⚠️ Could not parse response as JSON. Raw response:\n\n${fullText}` 
                    } 
                  }
                : node
            )
          );
        }
      });
    },
    [getNode, nodeId, setNodes]
  );

  const onNodesChangeWithResize = (changes: any) => {
    onNodesChange(changes);

    const parentIdsToResize = new Set<string>();

    changes.forEach((change: any) => {
      let node;
      switch (change.type) {
        case 'position':
          if (!change.position) break;
          node = getNodes().find((n) => n.id === change.id);
          if (node && node.parentNode) {
            parentIdsToResize.add(node.parentNode);
          }
          break;
        case 'dimensions':
          node = getNodes().find((n) => n.id === change.id);
          if (node && node.parentNode) {
            parentIdsToResize.add(node.parentNode);
          }
          break;
        case 'add':
          const addedNode = getNodes().find(n => n.id === change.item.id);
          if (addedNode && addedNode.parentNode) {
            parentIdsToResize.add(addedNode.parentNode);
          }
          break;
      }
    });

    if (parentIdsToResize.size > 0) {
      setNodes((currentNodes) => {
        let nodesToUpdate = [...currentNodes];
        parentIdsToResize.forEach(parentId => {
          const parent = nodesToUpdate.find(n => n.id === parentId);
          if (!parent) return;

          const children = nodesToUpdate.filter((n) => n.parentNode === parentId);
          if (children.length > 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            children.forEach((child) => {
              const childX = child.position.x;
              const childY = child.position.y;
              const childWidth = child.width || 0;
              const childHeight = child.height || 0;

              minX = Math.min(minX, childX);
              minY = Math.min(minY, childY);
              maxX = Math.max(maxX, childX + childWidth);
              maxY = Math.max(maxY, childY + childHeight);
            });

            const padding = 20;
            const newWidth = maxX - minX + 2 * padding;
            const newHeight = maxY - minY + 2 * padding;
            const newRelativeX = minX - padding;
            const newRelativeY = minY - padding;

            nodesToUpdate = nodesToUpdate.map(n => {
              if (n.id === parentId) {
                return {
                  ...n,
                  style: { ...n.style, width: newWidth, height: newHeight },
                  position: { x: n.position.x + newRelativeX, y: n.position.y + newRelativeY }
                };
              }
              if (n.parentNode === parentId) {
                return {
                  ...n,
                  position: { x: n.position.x - newRelativeX, y: n.position.y - newRelativeY }
                }
              }
              return n;
            });
          }
        });
        return nodesToUpdate;
      });
    }
  };

  const onPaneClick = useCallback(
    (event: any) => {
      const clickTime = new Date().getTime();
      if (clickTime - lastClickTime.current < 300) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newId = nodeId + 1;
        setNodeId(newId);

        const newNode = {
          id: `node-${newId}`,
          position,
          data: { label: `group` },
          type: 'group',
          style: { width: 200, height: 150 },
        };
        setNodes((nodes) => nodes.concat(newNode));
      }
      lastClickTime.current = clickTime;
    },
    [nodeId, screenToFlowPosition, setNodes],
  );

  const onMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 2) return;
    isDrawing.current = true;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    const newId = `drawing-${nodeId + 1}`;
    setNodeId((prev) => prev + 1);

    const targetGroup = getNodes().find(
      (node) =>
        node.type === 'group' &&
        point.x >= node.position.x &&
        point.x <= node.position.x + (node.width || 0) &&
        point.y >= node.position.y &&
        point.y <= node.position.y + (node.height || 0)
    );

    const newDrawingNode = {
      id: newId,
      type: 'drawing',
      position: point,
      data: { lines: [[point]], setNodes },
      parentNode: targetGroup ? targetGroup.id : undefined,
      extent: targetGroup ? 'parent' : undefined,
    };

    currentDrawing.current = newDrawingNode;
    setNodes((nodes) => nodes.concat(newDrawingNode));
    event.preventDefault();
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing.current || !currentDrawing.current) return;

    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    setNodes((nodes) =>
      nodes.map((node) => {
        if (currentDrawing.current && node.id === currentDrawing.current.id) {
          const newLines = [...node.data.lines];
          const lastLine = newLines[newLines.length - 1];
          newLines[newLines.length - 1] = [...lastLine, point];
          return { ...node, data: { ...node.data, lines: newLines } };
        }
        return node;
      })
    );
  };

  const onMouseUp = () => {
    isDrawing.current = false;
    currentDrawing.current = null;
  };

  const onNodeDoubleClick = useCallback(
    (event: any, node: any) => {
      if (node.type === 'group') {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newId = nodeId + 1;
        setNodeId(newId);

        const newNode = {
          id: `node-${newId}`,
          position: {
            x: position.x - node.position.x,
            y: position.y - node.position.y,
          },
          data: {
            label: `text node`,
            text: '',
            onSubmit: (text: string) => handleAiNodeSubmit(`node-${newId}`, text),
          },
          type: 'text',
          parentNode: node.id,
          extent: 'parent',
        };
        setNodes((nodes) => nodes.concat(newNode));
      }
    },
    [nodeId, screenToFlowPosition, setNodes, handleAiNodeSubmit],
  );
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWithResize}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
      >
        <Controls />
        <MiniMap />
        <Background color="#ccc" variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
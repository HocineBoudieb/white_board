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

      const newId = `node-${nodeId + 1}`;
      setNodeId((prev) => prev + 1);

      const newNode: Node<AiNodeData> = {
        id: newId,
        type: 'markdown',
        position: {
          x: originNode.position.x + (originNode.width || 0) + 20,
          y: originNode.position.y,
        },
        data: {
          label: 'Markdown',
          text: 'AI is thinking...',
        },
        parentNode: originNode.parentNode,
        extent: originNode.extent,
      };

      setNodes((nodes) => nodes.concat(newNode));

      fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `${text}\n\nRespond in well-formatted markdown.` },
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
                  setNodes((nodes) =>
                    nodes.map((node) =>
                      node.id === newId
                        ? { ...node, data: { ...node.data, text: fullText } }
                        : node
                    )
                  );
                } else if (evt.type === 'error' && evt.error) {
                  setNodes((nodes) =>
                    nodes.map((node) =>
                      node.id === newId
                        ? { ...node, data: { ...node.data, text: `Error: ${evt.error}` } }
                        : node
                    )
                  );
                }
              } catch (e) {
                // ignore malformed frames
              }
            }

            sepIndex = buffer.indexOf('\n\n');
          }
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
    [nodeId, screenToFlowPosition, setNodes],
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
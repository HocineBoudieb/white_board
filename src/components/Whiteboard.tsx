'use client'

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import FileNode, { FileNodeData } from './FileNode';
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
import { PostItNode } from './PostItNode';
import { LimitModal } from './LimitModal';
import { searchSimilarChunks, batchGenerateEmbeddings } from '../utils/vectorStore';
const proOptions = { hideAttribution: true };

const defaultInitialNodes: Node[] = [];
const defaultInitialEdges: Edge[] = [];

const nodeTypes = {
  text: AiNode,
  group: GroupNode,
  file: FileNode,
  markdown: MarkdownNode,
  image: ImageNode,
  postit: PostItNode,
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

export type WhiteboardHandle = {
  focusGroup: (id: string) => void;
  saveNow: () => void;
};

export default forwardRef<WhiteboardHandle, { onGroupsChange?: (groups: { id: string; name: string }[]) => void; initialNodes?: Node[]; initialEdges?: Edge[]; projectId?: string; title?: string; userStatus?: any; tool?: 'cursor' | 'markdown' | 'image' | 'postit' | 'highlighter' | 'eraser' | 'pen' }>(function Whiteboard({ onGroupsChange, initialNodes = defaultInitialNodes, initialEdges = defaultInitialEdges, projectId, title, userStatus, tool = 'cursor' }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const reactFlow = useReactFlow();
  const { screenToFlowPosition, getNodes, getNode } = reactFlow;
  const lastClickTime = React.useRef(0);
  const isDrawing = React.useRef(false);
  const currentDrawing = React.useRef<any>(null);
  const drawingStartPos = React.useRef({ x: 0, y: 0 });
  const workerRef = React.useRef<Worker | null>(null);
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(new URL('../workers/workers.ts', import.meta.url));

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, ...data } = event.data;

      if (type === 'progress') {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === 'file' && node.data.fileName === data.fileName) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: data.status,
                  progress: data.progress,
                },
              };
            }
            return node;
          })
        );
      } else if (type === 'complete') {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === 'file' && node.data.fileName === data.fileName) {
              // Deserialize embeddings
              const embeddings = data.embeddings.map((emb: number[]) => new Float32Array(emb));

              return {
                ...node,
                data: {
                  ...node.data,
                  status: 'completed',
                  progress: 100,
                  chunks: data.chunks,
                  embeddings: embeddings,
                },
              };
            }
            return node;
          })
        );
      } else if (type === 'error') {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === 'file' && node.data.fileName === data.fileName) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: 'error',
                  error: data.error,
                },
              };
            }
            return node;
          })
        );
      }
    };

    // Cleanup worker on component unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, [setNodes]);

  React.useEffect(() => {
    if (!projectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const serializableNodes = nodes.map((n: any) => {
        if (n?.type === 'file' && Array.isArray(n?.data?.embeddings)) {
          const emb = n.data.embeddings.map((e: any) => Array.isArray(e) ? e : Array.from(e));
          return { ...n, data: { ...n.data, embeddings: emb } };
        }
        return n;
      });
      const payload = { title, nodes: serializableNodes, edges };
      fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, title, nodes, edges]);

  React.useEffect(() => {
    const groups = nodes
      .filter((n) => n.type === 'group' && typeof (n as any).data?.name === 'string' && (n as any).data.name.trim().length > 0)
      .map((n) => ({ id: n.id, name: ((n as any).data.name as string).trim() }));
    onGroupsChange?.(groups);
  }, [nodes, onGroupsChange]);

  useImperativeHandle(ref, () => ({
    focusGroup: (groupId: string) => {
      const node = getNode(groupId);
      if (!node) return;
      if ((reactFlow as any).fitView) {
        (reactFlow as any).fitView({ nodes: [{ id: groupId }], padding: 0.2, duration: 600 });
      } else {
        const w = ((node.style as any)?.width ?? (node as any).width ?? 200) as number;
        const h = ((node.style as any)?.height ?? (node as any).height ?? 150) as number;
        const cx = node.position.x + w / 2;
        const cy = node.position.y + h / 2;
        (reactFlow as any).setCenter?.(cx, cy, { zoom: 1.2, duration: 600 });
      }
    },
    saveNow: () => {
      if (!projectId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const serializableNodes = (nodes as any[]).map((n: any) => {
        if (n?.type === 'file' && Array.isArray(n?.data?.embeddings)) {
          const emb = n.data.embeddings.map((e: any) => (Array.isArray(e) ? e : Array.from(e)));
          return { ...n, data: { ...n.data, embeddings: emb } };
        }
        return n;
      });
      const payload = { title, nodes: serializableNodes, edges };
      fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
  }));

  const handleFileDrop = useCallback(
    (file: File, parentNodeId: string) => {
      const newId = `file-${uuidv4()}`;

      const parentNode = getNode(parentNodeId);
      if (!parentNode) return;

      const position = {
        x: (parentNode.width || 200) / 2 - 100, // Center it
        y: (parentNode.height || 150) / 2 - 50,
      };

      const newNode: Node<FileNodeData> = {
        id: newId,
        type: 'file',
        position,
        data: {
          fileName: file.name,
          fileSize: file.size,
          status: 'uploading',
          progress: 0,
        },
        parentNode: parentNodeId,
        extent: 'parent',
      };

      setNodes((nodes) => nodes.concat(newNode));

      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target?.result as ArrayBuffer;
        setNodes((nds) => nds.map((n) => (n.id === newId ? { ...n, data: { ...n.data, status: 'indexing', progress: 20 } } : n)));
        try {
          // @ts-ignore
          const pdfjs: any = await import('pdfjs-dist/build/pdf.min.mjs').catch(async () => await import('pdfjs-dist/build/pdf.mjs'));
          pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
          const loadingTask = pdfjs.getDocument({ data: fileContent });
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          let fullText = '';
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
            fullText += pageText + '\n';
            const progress = Math.min(60, 20 + Math.round((i / numPages) * 40));
            setNodes((nds) => nds.map((n) => (n.id === newId ? { ...n, data: { ...n.data, progress } } : n)));
          }
          const chunkText = (text: string, chunkSize = 1500, overlap = 200): string[] => {
            const chunks: string[] = [];
            let start = 0;
            while (start < text.length) {
              const end = Math.min(start + chunkSize, text.length);
              let chunk = text.slice(start, end);
              const lastBreak = chunk.lastIndexOf('\n');
              if (lastBreak > 200) chunk = chunk.slice(0, lastBreak);
              chunks.push(chunk.trim());
              if (end >= text.length) break;
              start += chunk.length - overlap;
            }
            return chunks.filter((c) => c.length > 0);
          };
          const chunks = chunkText(fullText);
          workerRef.current?.postMessage({ type: 'embed', fileName: file.name, chunks });
        } catch (err: any) {
          setNodes((nds) => nds.map((n) => (n.id === newId ? { ...n, data: { ...n.data, status: 'error', error: err?.message || 'PDF parse failed' } } : n)));
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [setNodes, getNode]
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const all = getNodes();
      const padding = 16;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type !== 'group') return n;
          const children = all.filter((c) => c.parentNode === n.id);
          if (children.length === 0) return n;
          const currentW = (n.style && (n.style as any).width) || (n as any).width || 100;
          const currentH = (n.style && (n.style as any).height) || (n as any).height || 50;
          let needW = currentW;
          let needH = currentH;
          for (const c of children) {
            const cw = (c.style && (c.style as any).width) || (c as any).width || 150;
            const ch = (c.style && (c.style as any).height) || (c as any).height || 100;
            const right = c.position.x + cw;
            const bottom = c.position.y + ch;
            if (right + padding > needW) needW = right + padding;
            if (bottom + padding > needH) needH = bottom + padding;
          }
          if (needW !== currentW || needH !== currentH) {
            return {
              ...n,
              style: { ...(n.style || {}), width: needW, height: needH },
            };
          }
          return n;
        })
      );
    },
    [onNodesChange, getNodes, setNodes]
  );

  const handleAiNodeSubmit = useCallback(
    (originNodeId: string, text: string, context?: string) => {
      const originNode = getNode(originNodeId);
      if (!originNode) return;

      // Update source node to loading state
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === originNodeId
            ? { ...node, className: 'thinking-node', data: { ...node.data, isLoading: true } }
            : node
        )
      );

      const content = `${context ? `${context}\n\n` : ''}${text}\n\nIMPORTANT: Respond ONLY with a valid JSON array of nodes. Do not include any other text, explanation, or markdown formatting.\n\nEach node should have this structure:\n{\n  "type": "markdown" | "todo" | "image" | "drawing" | "mermaid" | "flashcard" | "quiz" | "timeline" | "definition" | "formula" | "comparison" | "progress",\n  "data": { ... }\n}\n\nAvailable node types:\n- markdown: { "text": "markdown content" }\n- todo: { "items": [{ "text": "item text", "completed": false }] }\n- image: { "url": "image url" }\n- drawing: { "lines": [[{"x": 0, "y": 0}, {"x": 10, "y": 10}]] }\n- mermaid: { "text": "mermaid diagram syntax" }\n- flashcard: { "front": "recto", "back": "verso" }\n- quiz: { "question": "Q?", "choices": [{ "id": "1", "text": "A", "correct": true }, { "id": "2", "text": "B", "correct": false }], "explanation": "optional" }\n- timeline: { "events": [{ "id": "1", "date": "2024-01-01", "title": "Event", "description": "optional" }] }\n- definition: { "term": "Mot", "definition": "Définition", "example": "optional", "tags": ["tag1"] }\n- formula: { "latex": "a + b", "variables": { "a": 1, "b": 2 } }\n- comparison: { "headers": ["A", "B"], "rows": [{ "id": "1", "label": "Critère", "col1": "val A", "col2": "val B" }] }\n- progress: { "current": 75, "milestones": [{ "id": "1", "label": "Done", "completed": true }], "stats": [{ "label": "Heures", "value": "12h" }] }\n\nExample response:\n[\n  {\n    "type": "markdown",\n    "data": {\n      "text": "# Hello\\nThis is markdown"\n    }\n  },\n  {\n    "type": "todo",\n    "data": {\n      "items": [\n        { "text": "Task 1", "completed": false },\n        { "text": "Task 2", "completed": true }\n      ]\n    }\n  }\n]\n\nRespond with ONLY the JSON array, nothing else.`;

      console.log('AI request (text):', text);
      console.log('AI request (context length):', context ? context.length : 0);
      if (context && typeof context === 'string') {
        console.log('AI request (context head 200):', context.slice(0, 200));
        console.log('AI request (context tail 200):', context.slice(Math.max(0, context.length - 200)));
      }
      console.log('AI request (full content length):', content.length);
      console.log('AI request (full content head 200):', content.slice(0, 200));
      console.log('AI request (full content tail 200):', content.slice(Math.max(0, content.length - 200)));

      fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'user', 
              content: content 
            },
          ],
        }),
      }).then(async (response) => {
        if (response.status === 403) {
          setShowLimitModal(true);
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === originNodeId
                ? { ...node, className: '', data: { ...node.data, isLoading: false } }
                : node
            )
          );
          return;
        }
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
              node.id === originNodeId
                ? { ...node, className: '', data: { ...node.data, isLoading: false, text: `Error: ${evt.error}` } }
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

        try {
          let cleanedText = fullText.trim();
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
          }
          console.log('AI response (raw):', cleanedText);
          console.log('AI response (raw length):', cleanedText.length);
          console.log('AI response (raw head 200):', cleanedText.slice(0, 200));
          console.log('AI response (raw tail 200):', cleanedText.slice(Math.max(0, cleanedText.length - 200)));
          console.log('AI response (raw bracket balance):', {
            square: (cleanedText.match(/\[/g) || []).length - (cleanedText.match(/\]/g) || []).length,
            curly: (cleanedText.match(/\{/g) || []).length - (cleanedText.match(/\}/g) || []).length,
          });
          const nodesData = JSON.parse(cleanedText);
          console.log('AI response (parsed):', nodesData);

          if (!Array.isArray(nodesData)) {
            throw new Error('Response is not an array');
          }

          // Supprimer le node de chargement
          // Reset source node loading state
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === originNodeId
                ? { ...node, className: '', data: { ...node.data, isLoading: false } }
                : node
            )
          );

          const newNodes: Node[] = [];
          const parent = originNode.parentNode ? getNode(originNode.parentNode) : null;
          const padding = 16;
          const sizes: Record<string, { w: number; h: number }> = {
            markdown: { w: 220, h: 180 },
            todo: { w: 220, h: 220 },
            image: { w: 220, h: 260 },
            drawing: { w: 220, h: 180 },
            mermaid: { w: 220, h: 220 },
            flashcard: { w: 220, h: 180 },
            quiz: { w: 220, h: 250 },
            timeline: { w: 220, h: 300 },
            definition: { w: 220, h: 200 },
            formula: { w: 220, h: 200 },
            comparison: { w: 220, h: 250 },
            progress: { w: 220, h: 200 },
          };
          const baseXLocal = originNode.position.x + (originNode.width || 0) + 20;
          const startYLocal = originNode.position.y;
          let colX = baseXLocal;
          let colY = startYLocal;
          const parentHeight = parent ? (((parent.style as any)?.height ?? (parent as any).height) || 150) : Infinity;

          nodesData.forEach((nodeData: any, index: number) => {
            const newId = `node-${uuidv4()}`;

            let newNode: Node | null = null;
            const type = nodeData.type;
            const sz = sizes[type] || { w: 220, h: 200 };
            if (parentHeight !== Infinity && colY + sz.h + padding > parentHeight) {
              colX += sz.w + padding;
              colY = startYLocal;
            }

            switch (nodeData.type) {
              case 'markdown':
                newNode = {
                  id: newId,
                  type: 'markdown',
                  position: { x: colX, y: colY },
                  data: {
                    text: nodeData.data.text || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'todo':
                newNode = {
                  id: newId,
                  type: 'todo',
                  position: { x: colX, y: colY },
                  data: {
                    items: nodeData.data.items || [],
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'image':
                newNode = {
                  id: newId,
                  type: 'image',
                  position: { x: colX, y: colY },
                  data: {
                    url: nodeData.data.url || nodeData.data.src || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'drawing':
                newNode = {
                  id: newId,
                  type: 'drawing',
                  position: { x: colX, y: colY },
                  data: {
                    lines: nodeData.data.lines || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h, pointerEvents: 'none' },
                };
                break;
              case 'mermaid':
                newNode = {
                  id: newId,
                  type: 'mermaid',
                  position: { x: colX, y: colY },
                  data: {
                    text: nodeData.data.text || '',
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'flashcard':
                newNode = {
                  id: newId,
                  type: 'flashcard',
                  position: { x: colX, y: colY },
                  data: {
                    front: nodeData.data.front || '',
                    back: nodeData.data.back || '',
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'quiz':
                newNode = {
                  id: newId,
                  type: 'quiz',
                  position: { x: colX, y: colY },
                  data: {
                    question: nodeData.data.question || '',
                    choices: nodeData.data.choices || [],
                    explanation: nodeData.data.explanation || '',
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'timeline':
                newNode = {
                  id: newId,
                  type: 'timeline',
                  position: { x: colX, y: colY },
                  data: {
                    events: nodeData.data.events || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'definition':
                newNode = {
                  id: newId,
                  type: 'definition',
                  position: { x: colX, y: colY },
                  data: {
                    term: nodeData.data.term || '',
                    definition: nodeData.data.definition || '',
                    example: nodeData.data.example || '',
                    tags: nodeData.data.tags || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'formula':
                newNode = {
                  id: newId,
                  type: 'formula',
                  position: { x: colX, y: colY },
                  data: {
                    latex: nodeData.data.latex || '',
                    variables: nodeData.data.variables || {},
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'comparison':
                newNode = {
                  id: newId,
                  type: 'comparison',
                  position: { x: colX, y: colY },
                  data: {
                    title: nodeData.data.title || 'Comparaison',
                    headers: nodeData.data.headers || ['Item A', 'Item B'],
                    rows: nodeData.data.rows || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;

              case 'progress':
                newNode = {
                  id: newId,
                  type: 'progress',
                  position: { x: colX, y: colY },
                  data: {
                    current: nodeData.data.current || 0,
                    milestones: nodeData.data.milestones || [],
                    stats: nodeData.data.stats || [],
                    setNodes,
                  },
                  parentNode: originNode.parentNode,
                  extent: originNode.extent,
                  style: { width: sz.w, height: sz.h },
                };
                break;
            }

          if (newNode) {
            newNodes.push(newNode);
            colY += sz.h + padding;
          }
        });
          setNodes((nodes) => nodes.concat(newNodes));
        } catch (e: any) {
          setNodes((nodes) =>
            nodes.map((n) =>
              n.id === originNodeId
                ? { ...n, className: '', data: { ...n.data, isLoading: false, text: `Error: ${e?.message || 'Invalid response'}` } }
                : n
            )
          );
        }
      }).catch((e) => {
        setNodes((nodes) =>
          nodes.map((n) =>
            n.id === originNodeId
              ? { ...n, className: '', data: { ...n.data, isLoading: false, text: `Error: ${e?.message || 'Network error'}` } }
              : n
          )
        );
      });
    }, [getNode, setNodes]);

  const onPaneClick = useCallback(
    (event: any) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Handle tools on pane click
      if (tool !== 'cursor' && tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen') {
        const newId = uuidv4();
        let newNode: Node | null = null;

        if (tool === 'image') {
          newNode = {
            id: `node-${newId}`,
            type: 'image',
            position,
            data: { url: '', setNodes },
            style: { width: 220, height: 260 },
          };
        } else if (tool === 'markdown') {
          newNode = {
            id: `node-${newId}`,
            type: 'markdown',
            position,
            data: { text: '' },
            style: { width: 220, height: 180 },
          };
        } else if (tool === 'postit') {
          newNode = {
            id: `node-${newId}`,
            type: 'postit',
            position,
            data: { text: '' },
            style: { width: 200, height: 200 },
          };
        }

        if (newNode) {
          setNodes((nodes) => nodes.concat(newNode!));
          return;
        }
      }

      const clickTime = new Date().getTime();
      if (clickTime - lastClickTime.current < 300) {
        const newId = uuidv4();

        const newNode = {
          id: `node-${newId}`,
          position,
          data: { label: `group`, onFileDrop: handleFileDrop, setNodes, name: '' },
          type: 'group',
          className: 'group',
          style: { width: 200, height: 150 },
        };
        setNodes((nodes) => nodes.concat(newNode));
      }
      lastClickTime.current = clickTime;
    },
    [screenToFlowPosition, setNodes, tool, handleFileDrop],
  );

  const onMouseDown = (event: React.MouseEvent) => {
    const isHighlighter = tool === 'highlighter' && event.button === 0;
    const isPen = tool === 'pen' && event.button === 0;

    if (!isHighlighter && !isPen) return;

    isDrawing.current = true;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    drawingStartPos.current = point;

    const newId = `drawing-${uuidv4()}`;

    // Find the topmost node under the cursor
    const targetNode = getNodes().reverse().find(
      (node) => {
        // Skip drawing nodes to avoid attaching highlight to another highlight
        if (node.type === 'drawing') return false;
        
        // Use absolute position for intersection check
        const posX = node.positionAbsolute?.x ?? node.position.x;
        const posY = node.positionAbsolute?.y ?? node.position.y;
        const width = (node.style?.width as number) || node.width || 0;
        const height = (node.style?.height as number) || node.height || 0;

        return (
          point.x >= posX &&
          point.x <= posX + width &&
          point.y >= posY &&
          point.y <= posY + height
        );
      }
    );

    const localPosition = targetNode
      ? { x: point.x - (targetNode.positionAbsolute?.x ?? targetNode.position.x), y: point.y - (targetNode.positionAbsolute?.y ?? targetNode.position.y) }
      : point;

    const newDrawingNode: Node = {
      id: newId,
      type: 'drawing',
      position: localPosition,
      draggable: false,
      selectable: false,
      deletable: false,
      className: 'drawing-node',
      style: { pointerEvents: 'none' },
      data: { 
        lines: [[{ x: 0, y: 0 }]], 
        setNodes,
        color: isHighlighter ? '#fff740' : 'black',
        strokeWidth: isHighlighter ? 20 : 2,
        opacity: isHighlighter ? 0.4 : 1
      },
      parentNode: targetNode ? targetNode.id : undefined,
      extent: targetNode?.type === 'group' ? 'parent' : undefined,
      zIndex: isHighlighter ? 1000 : undefined,
    };

    currentDrawing.current = newDrawingNode;
    setNodes((nodes) => nodes.concat(newDrawingNode));
    // For highlighter and pen (left click), we need to prevent default to stop selection/panning
    event.preventDefault();
  };

  const onMouseMove = (event: React.MouseEvent) => {
    // Handle eraser drag
    if (tool === 'eraser' && event.buttons === 1) {
      const eraserPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const eraserRadius = 15; // Tolerance in pixels
      
      const nodes = getNodes();
      const nodesToDelete = nodes.filter((n) => {
        if (n.type !== 'drawing' || !n.data?.lines) return false;
        
        // Calculate node absolute position
        const xOffset = n.positionAbsolute?.x ?? n.position.x;
        const yOffset = n.positionAbsolute?.y ?? n.position.y;
        
        // Check if any line segment is close to the eraser
        for (const line of n.data.lines) {
          if (!line || line.length < 2) continue;
          
          for (let i = 0; i < line.length - 1; i++) {
            const p1 = { x: line[i].x + xOffset, y: line[i].y + yOffset };
            const p2 = { x: line[i+1].x + xOffset, y: line[i+1].y + yOffset };
            
            // Distance from point to line segment
            const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
            if (l2 === 0) {
              if (Math.sqrt(Math.pow(eraserPos.x - p1.x, 2) + Math.pow(eraserPos.y - p1.y, 2)) < eraserRadius) return true;
              continue;
            }
            
            let t = ((eraserPos.x - p1.x) * (p2.x - p1.x) + (eraserPos.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            
            const proj = {
              x: p1.x + t * (p2.x - p1.x),
              y: p1.y + t * (p2.y - p1.y)
            };
            
            if (Math.sqrt(Math.pow(eraserPos.x - proj.x, 2) + Math.pow(eraserPos.y - proj.y, 2)) < eraserRadius) {
              return true;
            }
          }
        }
        return false;
      });

      if (nodesToDelete.length > 0) {
        const idsToDelete = new Set(nodesToDelete.map((n) => n.id));
        setNodes((nds) => nds.filter((n) => !idsToDelete.has(n.id)));
      }
      return;
    }

    if (!isDrawing.current || !currentDrawing.current) return;

    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const relativePoint = {
      x: point.x - drawingStartPos.current.x,
      y: point.y - drawingStartPos.current.y
    };

    setNodes((nodes) =>
      nodes.map((node) => {
        if (currentDrawing.current && node.id === currentDrawing.current.id) {
          const newLines = [...node.data.lines];
          const lastLine = newLines[newLines.length - 1];
          newLines[newLines.length - 1] = [...lastLine, relativePoint];
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
        // Check AI permission
        if (!userStatus || userStatus.plan.aiTokens === 0) {
          setShowLimitModal(true);
          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newId = uuidv4();

        const newNode: Node = {
          id: `node-${newId}`,
          position: {
            x: position.x - node.position.x,
            y: position.y - node.position.y,
          },
          data: {
            label: `text node`,
            text: '',
            onSubmit: (text: string, context?: string) => handleAiNodeSubmit(`node-${newId}`, text, context),
          },
          type: 'text',
          parentNode: node.id,
          extent: 'parent',
        };
        setNodes((nodes) => nodes.concat(newNode));
      }
    },
    [screenToFlowPosition, setNodes, handleAiNodeSubmit],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (tool === 'eraser') {
        // Logic handled in onMouseMove for drawings
        if (node.type !== 'drawing') {
           // ... other eraser logic if needed
        }
        return;
      }

      if (tool && tool !== 'cursor' && node.type === 'group') {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newId = uuidv4();
        let newNode: Node | null = null;
        
        const relativeX = position.x - node.position.x;
        const relativeY = position.y - node.position.y;

        if (tool === 'markdown') {
          newNode = {
            id: `node-${newId}`,
            type: 'markdown',
            position: { x: relativeX, y: relativeY },
            data: {
              text: '',
            },
            parentNode: node.id,
            extent: 'parent',
            style: { width: 220, height: 180 },
          };
        } else if (tool === 'image') {
          newNode = {
            id: `node-${newId}`,
            type: 'image',
            position: { x: relativeX, y: relativeY },
            data: {
              url: '',
            },
            parentNode: node.id,
            extent: 'parent',
            style: { width: 220, height: 260 },
          };
        } else if (tool === 'postit') {
          newNode = {
            id: `node-${newId}`,
            type: 'postit',
            position: { x: relativeX, y: relativeY },
            data: {
              text: '',
            },
            parentNode: node.id,
            extent: 'parent',
            style: { width: 200, height: 200 },
          };
        }

        if (newNode) {
          setNodes((nodes) => nodes.concat(newNode!));
        }
      }
    },
    [tool, screenToFlowPosition, setNodes]
  );
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes nodeAppear {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes nodeHover {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.02);
          }
        }

        .react-flow__node {
          animation: nodeAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .react-flow__node.drawing-node {
          pointer-events: none;
        }

        .react-flow__node:not(.drawing-node):hover {
          transform: scale(1.02);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .react-flow__node:not(.drawing-node).selected {
          box-shadow: 0 0 0 2px #3182ce, 0 8px 20px rgba(49, 130, 206, 0.3);
          transform: scale(1.02);
        }

        .react-flow__node.dragging {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }

        .react-flow__edge {
          animation: edgeAppear 0.4s ease-out;
        }

        @keyframes edgeAppear {
          from {
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        .react-flow__edge-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 0;
          transition: stroke 0.2s ease, stroke-width 0.2s ease;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke-width: 3;
          stroke: #3182ce;
        }

        .react-flow__handle {
          transition: all 0.2s ease;
        }

        .react-flow__handle:hover {
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(49, 130, 206, 0.5);
        }

        .react-flow__controls {
          animation: controlsAppear 0.5s ease-out 0.2s both;
        }

        @keyframes controlsAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .react-flow__minimap {
          animation: minimapAppear 0.5s ease-out 0.3s both;
        }

        @keyframes minimapAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .react-flow__node-group {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .react-flow__node-group:hover {
          transform: scale(1.01);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .react-flow__node-group.selected {
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.3), 0 10px 30px rgba(49, 130, 206, 0.2);
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        panOnDrag={tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen'}
        panOnScroll={tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen'}
        selectionOnDrag={tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen'}
        nodesDraggable={tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen'}
        nodesConnectable={tool !== 'highlighter' && tool !== 'eraser' && tool !== 'pen'}
        elementsSelectable={tool !== 'highlighter' && tool !== 'pen'}
      >
        <Controls />
        <MiniMap />
        <Background color="#ccc" variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      <LimitModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        description="Vous avez atteint la limite de votre plan. Passez à la vitesse supérieure pour utiliser l'IA et créer plus de contenu."
      />
    </div>
  );
});

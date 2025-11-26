'use client';

import React from 'react';
import Whiteboard from '@/components/Whiteboard';
import { ReactFlowProvider, Node, Edge } from 'reactflow';
import { useRouter } from 'next/navigation';
import { MousePointer2, Type, Image as ImageIcon, StickyNote, Highlighter, ArrowLeft, Save } from 'lucide-react';

function fixEmbeddings(nodes: any[]): any[] {
  return (Array.isArray(nodes) ? nodes : []).map((n: any) => {
    if (n?.type === 'file' && Array.isArray(n?.data?.embeddings)) {
      const emb = n.data.embeddings.map((e: any) => (Array.isArray(e) ? new Float32Array(e as number[]) : e));
      return { ...n, data: { ...n.data, embeddings: emb } };
    }
    return n;
  });
}

export default function ClientBoard({ id, initialTitle, initialNodes, initialEdges, userStatus }: { id: string; initialTitle: string; initialNodes: Node[] | any[]; initialEdges: Edge[] | any[]; userStatus?: any }) {
  const [title, setTitle] = React.useState<string>(initialTitle || 'Titre');
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([]);
  const whiteboardRef = React.useRef<any>(null);
  const [tool, setTool] = React.useState<'cursor' | 'markdown' | 'image' | 'postit' | 'highlighter'>('cursor');
  const router = useRouter();

  const nodesFixed = React.useMemo(() => fixEmbeddings(initialNodes as any[]), [initialNodes]);

  return (
    <main>
      <button
        onClick={() => router.push('/projects')}
        title="Retour aux projets"
        className="action-button"
        style={{ left: 12 }}
      >
        <ArrowLeft size={20} />
      </button>
      <div className={`sticky-title-container ${collapsed ? 'collapsed' : ''}`}>
        <button
          className="sticky-title-toggle"
          aria-label={collapsed ? 'Étendre le titre' : 'Rétracter le titre'}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? '▾' : '▴'}
        </button>
        <input
          className="sticky-title"
          readOnly={collapsed}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          title="Cliquez pour éditer le titre"
        />
        {groups.length > 0 && !collapsed && (
          <select
            className="group-select"
            defaultValue=""
            onChange={(e) => {
              const gid = e.target.value;
              if (gid) {
                whiteboardRef.current?.focusGroup(gid);
              }
            }}
            title="Aller au groupe"
          >
            <option value="" disabled>
              Aller au groupe
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>
      <button
        onClick={() => whiteboardRef.current?.saveNow?.()}
        title="Sauvegarder"
        className="action-button"
        style={{ right: 12 }}
      >
        <Save size={20} />
      </button>
      <ReactFlowProvider>
        <Whiteboard
          ref={whiteboardRef}
          onGroupsChange={setGroups}
          initialNodes={nodesFixed as any}
          initialEdges={(Array.isArray(initialEdges) ? initialEdges : []) as any}
          projectId={id}
          title={title}
          userStatus={userStatus}
          tool={tool}
        />
      </ReactFlowProvider>
      {tool !== 'cursor' && (
        <style>{`
          .react-flow__pane, .react-flow__node {
            cursor: crosshair !important;
          }
        `}</style>
      )}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        padding: '12px 20px',
        boxShadow: '4px 4px 0px 0px #000',
        display: 'flex',
        gap: 12,
        zIndex: 1000,
        border: '3px solid #000',
      }}>
        <button
          onClick={() => setTool('cursor')}
          title="Curseur"
          style={{
            padding: '10px',
            background: tool === 'cursor' ? '#000' : '#fff',
            color: tool === 'cursor' ? '#fff' : '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            transition: 'all 0.1s',
            transform: tool === 'cursor' ? 'translate(2px, 2px)' : 'none',
            boxShadow: tool === 'cursor' ? 'none' : '2px 2px 0px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MousePointer2 size={20} />
        </button>
        <button
          onClick={() => setTool('markdown')}
          title="Texte / Markdown"
          style={{
            padding: '10px',
            background: tool === 'markdown' ? '#000' : '#fff',
            color: tool === 'markdown' ? '#fff' : '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            transition: 'all 0.1s',
            transform: tool === 'markdown' ? 'translate(2px, 2px)' : 'none',
            boxShadow: tool === 'markdown' ? 'none' : '2px 2px 0px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => setTool('image')}
          title="Image"
          style={{
            padding: '10px',
            background: tool === 'image' ? '#000' : '#fff',
            color: tool === 'image' ? '#fff' : '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            transition: 'all 0.1s',
            transform: tool === 'image' ? 'translate(2px, 2px)' : 'none',
            boxShadow: tool === 'image' ? 'none' : '2px 2px 0px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon size={20} />
        </button>
        <button
          onClick={() => setTool('postit')}
          title="Post-it"
          style={{
            padding: '10px',
            background: tool === 'postit' ? '#000' : '#fff',
            color: tool === 'postit' ? '#fff' : '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            transition: 'all 0.1s',
            transform: tool === 'postit' ? 'translate(2px, 2px)' : 'none',
            boxShadow: tool === 'postit' ? 'none' : '2px 2px 0px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StickyNote size={20} />
        </button>
        <button
          onClick={() => setTool('highlighter')}
          title="Surligneur"
          style={{
            padding: '10px',
            background: tool === 'highlighter' ? '#000' : '#fff',
            color: tool === 'highlighter' ? '#fff' : '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            transition: 'all 0.1s',
            transform: tool === 'highlighter' ? 'translate(2px, 2px)' : 'none',
            boxShadow: tool === 'highlighter' ? 'none' : '2px 2px 0px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Highlighter size={20} />
        </button>
      </div>
    </main>
  );
}

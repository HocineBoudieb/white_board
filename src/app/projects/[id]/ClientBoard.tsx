'use client';

import React from 'react';
import Whiteboard from '@/components/Whiteboard';
import { ReactFlowProvider, Node, Edge } from 'reactflow';
import { useRouter } from 'next/navigation';

function fixEmbeddings(nodes: any[]): any[] {
  return (Array.isArray(nodes) ? nodes : []).map((n: any) => {
    if (n?.type === 'file' && Array.isArray(n?.data?.embeddings)) {
      const emb = n.data.embeddings.map((e: any) => (Array.isArray(e) ? new Float32Array(e as number[]) : e));
      return { ...n, data: { ...n.data, embeddings: emb } };
    }
    return n;
  });
}

export default function ClientBoard({ id, initialTitle, initialNodes, initialEdges }: { id: string; initialTitle: string; initialNodes: Node[] | any[]; initialEdges: Edge[] | any[] }) {
  const [title, setTitle] = React.useState<string>(initialTitle || 'Titre');
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([]);
  const whiteboardRef = React.useRef<any>(null);
  const [groupsOpen, setGroupsOpen] = React.useState<boolean>(false);
  const router = useRouter();

  const nodesFixed = React.useMemo(() => fixEmbeddings(initialNodes as any[]), [initialNodes]);

  return (
    <main>
      <button
        onClick={() => router.push('/projects')}
        title="Retour aux projets"
        style={{
          position: 'fixed',
          top: 8,
          left: 12,
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 999,
          padding: '6px 10px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 1000,
        }}
      >
        ← Retour
      </button>
      <div className={`sticky-title-container ${collapsed ? 'collapsed' : ''}`}>
        <button
          className="sticky-title-toggle"
          aria-label={collapsed ? 'Étendre le titre' : 'Rétracter le titre'}
          onClick={() => {
            setCollapsed((v) => {
              const next = !v;
              setGroupsOpen(!next);
              return next;
            });
          }}
        >
          {collapsed ? '▾' : '▴'}
        </button>
        <div
          className="sticky-title"
          contentEditable={!collapsed}
          suppressContentEditableWarning
          suppressHydrationWarning
          onInput={(e) => setTitle((e.target as HTMLElement).innerText)}
          title="Cliquez pour éditer le titre"
        >
          {title}
        </div>
        {groups.length > 0 && groupsOpen && (
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
        style={{
          position: 'fixed',
          top: 8,
          right: 12,
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 999,
          padding: '6px 10px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 1000,
        }}
      >
        💾 Sauvegarder
      </button>
      <ReactFlowProvider>
        <Whiteboard
          ref={whiteboardRef}
          onGroupsChange={setGroups}
          initialNodes={nodesFixed as any}
          initialEdges={(Array.isArray(initialEdges) ? initialEdges : []) as any}
          projectId={id}
          title={title}
        />
      </ReactFlowProvider>
    </main>
  );
}

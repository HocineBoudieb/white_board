'use client';

import React from 'react';
import Whiteboard from '@/components/Whiteboard';
import { ReactFlowProvider, Node, Edge } from 'reactflow';
import { useRouter } from 'next/navigation';
import { MousePointer2, Type, Image as ImageIcon, StickyNote, Highlighter, ArrowLeft, Save, Eraser, Pen, Youtube } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TourProvider } from '@reactour/tour';
import ProjectTour from '@/components/ProjectTour';

function fixEmbeddings(nodes: any[]): any[] {
  return (Array.isArray(nodes) ? nodes : []).map((n: any) => {
    if (n?.type === 'file' && Array.isArray(n?.data?.embeddings)) {
      const emb = n.data.embeddings.map((e: any) => (Array.isArray(e) ? new Float32Array(e as number[]) : e));
      return { ...n, data: { ...n.data, embeddings: emb } };
    }
    return n;
  });
}

const steps = [
  {
    selector: 'body',
    content: 'Bienvenue sur votre Whiteboard ! 👋 Laissez-nous vous faire visiter en quelques secondes.',
    position: 'center' as const,
  },
  {
    selector: '.tour-toolbar',
    content: 'Voici votre barre d\'outils. Sélectionnez un outil pour ajouter du texte, des images, des post-its ou dessiner !',
  },
  {
    selector: '.tour-groups-nav',
    content: 'Gérez le titre de votre projet et naviguez rapidement entre vos groupes ici.',
  },
  {
    selector: '.tour-save-button',
    content: 'Sauvegardez manuellement votre travail ici (la sauvegarde est aussi automatique).',
  },
  {
    selector: '.tour-back-button',
    content: 'Retournez à la liste de vos projets quand vous avez fini.',
  },
  {
    selector: '.tour-whiteboard',
    content: 'C\'est votre espace de travail ! Double-cliquez pour créer un groupe, puis double-cliquez dans un groupe pour écrire quelques choses à l\'IA. Faites un clic droit sur un élément pour modifier avec l\'IA.',
  }
];

export default function ClientBoard({ id, initialTitle, initialNodes, initialEdges, userStatus }: { id: string; initialTitle: string; initialNodes: Node[] | any[]; initialEdges: Edge[] | any[]; userStatus?: any }) {
  const [title, setTitle] = React.useState<string>(initialTitle || 'Titre');
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([]);
  const whiteboardRef = React.useRef<any>(null);
  const [tool, setTool] = React.useState<'cursor' | 'markdown' | 'image' | 'youtube' | 'postit' | 'highlighter' | 'eraser' | 'pen'>('cursor');
  const router = useRouter();
  const { track } = useAnalytics();

  const nodesFixed = React.useMemo(() => fixEmbeddings(initialNodes as any[]), [initialNodes]);

  const handleToolChange = (newTool: typeof tool) => {
    setTool(newTool);
    track('select_tool', { label: newTool, category: 'toolbar', userId: userStatus?.id });
  };

  return (
    <TourProvider 
      steps={steps} 
      beforeClose={() => localStorage.setItem('hasSeenProjectTour', 'true')}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: 0,
          color: '#171717',
          fontFamily: 'var(--font-mono)',
          border: '3px solid #000',
          boxShadow: '6px 6px 0px 0px #000',
          padding: '24px',
          backgroundColor: '#fff',
          maxWidth: '400px',
        }),
        maskArea: (base) => ({ ...base, rx: 0 }),
        maskWrapper: (base) => ({ ...base, opacity: 0.7, color: '#000' }),
        badge: (base) => ({ 
          ...base, 
          backgroundColor: '#fde047', 
          color: '#000', 
          fontWeight: 900,
          border: '2px solid #000',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          fontSize: '14px',
        }),
        controls: (base) => ({ ...base, marginTop: 24 }),
        close: (base) => ({ 
          ...base, 
          color: '#000',
          right: 12,
          top: 12,
          width: 24,
          height: 24,
          padding: 4,
        }),
        dot: (base, { current }) => ({
          ...base,
          background: current ? '#000' : '#ccc',
          border: '1px solid #000',
        }),
      }}
      components={{
        // Customizing navigation buttons to match Neo-Brutalist style
        Navigation: ({ steps, currentStep, setIsOpen, setCurrentStep }) => (
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', gap: 4 }}>
               {steps.map((_, i) => (
                 <div 
                   key={i}
                   style={{
                     width: 12,
                     height: 12,
                     background: i === currentStep ? '#000' : 'transparent',
                     border: '2px solid #000',
                     borderRadius: '50%',
                     cursor: 'pointer',
                   }}
                   onClick={() => setCurrentStep(i)}
                 />
               ))}
             </div>
             <div style={{ display: 'flex', gap: 12 }}>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: '2px solid #000',
                    padding: '8px 16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    boxShadow: '2px 2px 0px 0px #000',
                  }}
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: '#fde047',
                    color: '#000',
                    border: '2px solid #000',
                    padding: '8px 16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    boxShadow: '2px 2px 0px 0px #000',
                  }}
                >
                  Terminer
                </button>
              )}
             </div>
          </div>
        )
      }}
    >
      <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <ProjectTour />
        <button
          onClick={() => {
            router.push('/projects');
            track('navigate', { label: 'back_to_projects', userId: userStatus?.id });
          }}
          title="Retour aux projets"
          className="action-button tour-back-button"
          style={{ left: 12 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className={`sticky-title-container tour-groups-nav ${collapsed ? 'collapsed' : ''}`}>
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
          onClick={() => {
            whiteboardRef.current?.saveNow?.();
            track('save_project', { category: 'action', userId: userStatus?.id });
          }}
          title="Sauvegarder"
          className="action-button tour-save-button"
          style={{ right: 12 }}
        >
          <Save size={20} />
        </button>
        <ReactFlowProvider>
          <div className="tour-whiteboard" style={{ width: '100%', height: '100%' }}>
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
          </div>
        </ReactFlowProvider>
        {tool !== 'cursor' && (
          <style>{`
            .react-flow__pane, .react-flow__node {
              cursor: crosshair !important;
            }
          `}</style>
        )}
        <div 
          className="tour-toolbar"
          style={{
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
            onClick={() => handleToolChange('cursor')}
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
            onClick={() => handleToolChange('markdown')}
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
            onClick={() => handleToolChange('image')}
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
            onClick={() => handleToolChange('youtube')}
            title="YouTube"
            style={{
              padding: '10px',
              background: tool === 'youtube' ? '#000' : '#fff',
              color: tool === 'youtube' ? '#fff' : '#000',
              border: '2px solid #000',
              cursor: 'pointer',
              transition: 'all 0.1s',
              transform: tool === 'youtube' ? 'translate(2px, 2px)' : 'none',
              boxShadow: tool === 'youtube' ? 'none' : '2px 2px 0px 0px #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Youtube size={20} />
          </button>
          <button
            onClick={() => handleToolChange('postit')}
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
            onClick={() => handleToolChange('pen')}
            title="Stylo"
            style={{
              padding: '10px',
              background: tool === 'pen' ? '#000' : '#fff',
              color: tool === 'pen' ? '#fff' : '#000',
              border: '2px solid #000',
              cursor: 'pointer',
              transition: 'all 0.1s',
              transform: tool === 'pen' ? 'translate(2px, 2px)' : 'none',
              boxShadow: tool === 'pen' ? 'none' : '2px 2px 0px 0px #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => handleToolChange('highlighter')}
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
          <button
            onClick={() => handleToolChange('eraser')}
            title="Gomme"
            style={{
              padding: '10px',
              background: tool === 'eraser' ? '#000' : '#fff',
              color: tool === 'eraser' ? '#fff' : '#000',
              border: '2px solid #000',
              cursor: 'pointer',
              transition: 'all 0.1s',
              transform: tool === 'eraser' ? 'translate(2px, 2px)' : 'none',
              boxShadow: tool === 'eraser' ? 'none' : '2px 2px 0px 0px #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Eraser size={20} />
          </button>
        </div>
      </main>
    </TourProvider>
  );
}

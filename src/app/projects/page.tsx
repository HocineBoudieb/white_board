'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Search, MoreVertical, Clock, Filter, Pencil, Check, X, Lock, Zap, Settings } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface UserStatus {
  plan: {
    name: string;
    slug: string;
    quota: number;
    aiTokens: number;
  };
  usage: {
    projects: number;
    aiTokens: number;
  };
}

import { LimitModal } from '@/components/LimitModal';

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const creatingRef = React.useRef(false);
  const [uid, setUid] = React.useState('guest');
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'All' | 'AZ' | 'Recent'>('All');
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState<string>('');
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [userStatus, setUserStatus] = React.useState<UserStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoadingProjects(true);
    
    // Fetch user status in parallel
    const statusPromise = fetch('/api/user/status').then(res => res.ok ? res.json() : null);
    const projectsPromise = fetch('/api/projects').then(res => {
      if (!res.ok && res.status === 401) {
        throw new Error('Unauthorized');
      }
      return res.json();
    });

    try {
      const [statusData, projectsData] = await Promise.all([statusPromise, projectsPromise]);
      
      if (statusData) {
        if (statusData.hasSelectedPlan === false) {
          router.replace('/pricing');
          return;
        }
        setUserStatus(statusData);
      }
      
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (e) {
      router.replace('/login');
    } finally {
      setLoadingProjects(false);
    }
  }, [router]);

  React.useEffect(() => {
    const cookieUid = typeof document !== 'undefined' ? (document.cookie.split('; ').find((c) => c.startsWith('uid='))?.split('=')[1] || '') : '';
    if (!cookieUid) {
      router.replace('/login');
      return;
    }
    setUid(cookieUid);
    load();
  }, [load, router]);

  const create = async () => {
    if (creatingRef.current || loading) return;
    creatingRef.current = true;
    setLoading(true);
    let navigated = false;
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          navigated = true;
          router.push(`/projects/${data.id}`);
        }
      } else if (res.status === 403) {
        setShowLimitModal(true);
      }
    } finally {
      if (!navigated) {
        creatingRef.current = false;
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  };

  const displayedProjects = React.useMemo(() => {
    const list = Array.isArray(projects) ? [...projects] : [];
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((p: any) => String(p.name || '').toLowerCase().includes(q)) : list;
    if (filter === 'AZ') filtered.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')));
    else filtered.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return filtered;
  }, [projects, query, filter]);

  const deleteProject = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setOpenMenuId((cur) => (cur === id ? null : cur));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getTitle = (p: { state?: string; name?: string }): string => {
    const s = p?.state;
    if (typeof s === 'string' && s.length > 0) {
      try {
        const st = JSON.parse(s) as { title?: string };
        const t = st?.title;
        if (typeof t === 'string' && t.trim().length > 0) return t;
      } catch {}
    }
    const nm = p?.name;
    return typeof nm === 'string' && nm.trim().length > 0 ? nm : 'Titre';
  };

  const startRename = (p: any) => {
    setEditingId(p.id);
    setEditingTitle(getTitle(p));
  };

  const confirmRename = async (p: any) => {
    if (renamingId) return;
    setRenamingId(p.id);
    let st: any = {};
    const s = p?.state;
    if (typeof s === 'string' && s.length > 0) {
      try {
        st = JSON.parse(s);
      } catch {}
    }
    const nextState = { ...st, title: editingTitle };
    try {
      const res = await fetch(`/api/projects/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: nextState }) });
      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((it) => (it.id === p.id ? updated : it)));
        setEditingId(null);
        setEditingTitle('');
      }
    } finally {
      setRenamingId(null);
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <nav className="sticky top-0 z-40 bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">FRAYM.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-600 hidden md:inline">{uid}</span>
          
          {userStatus && (
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex flex-col items-end">
                <div className="text-xs font-black uppercase tracking-wider">{userStatus.plan.name}</div>
                <div className="text-[10px] font-mono font-bold text-gray-500">
                  {userStatus.usage.projects} / {userStatus.plan.quota === Infinity ? '∞' : userStatus.plan.quota} Boards
                </div>
              </div>
            </div>
          )}

          <a href="/pricing" className="text-xs font-bold px-3 py-1 border-2 border-black bg-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2">
            <Zap size={12} className="fill-black" /> Abonnement
          </a>
          <button onClick={() => router.push('/settings')} className="text-xs font-bold px-3 py-1 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2">
            <Settings size={12} /> Paramètres
          </button>
          <button onClick={logout} className="text-xs font-bold px-3 py-1 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">Se déconnecter</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="relative w-full md:w-auto">
            <h1 className="text-6xl md:text-7xl font-black mb-2 relative z-10">Mes Boards<span className="text-primary-foreground">.</span></h1>
            <div className="h-4 w-full bg-primary absolute bottom-2 left-2 opacity-50 transform -skew-x-12"></div>
            <p className="text-xl font-bold text-gray-500 mt-2 font-mono">Construisons quelque chose aujourd'hui.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input type="text" placeholder="Rechercher un board..." value={query} onChange={(e) => setQuery(e.target.value)} disabled={!!openingId} className="w-full h-14 pl-4 pr-10 border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed" />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
            </div>
            <button onClick={create} disabled={loading || !!openingId} className="h-14 px-8 bg-black text-white font-black text-lg border-4 border-transparent hover:bg-white hover:text-black hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus strokeWidth={3} /> NOUVEAU
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-white font-bold mr-2"><Filter size={16} /> Filtre:</div>
          {[
            { label: 'Tous', key: 'All' as const },
            { label: 'A-Z', key: 'AZ' as const },
            { label: 'Récents', key: 'Recent' as const },
          ].map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)} disabled={!!openingId} className={`px-4 py-1 font-bold border-2 rounded-lg transition-all whitespace-nowrap ${filter === t.key ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]' : 'bg-white border-black hover:bg-primary/30 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'} disabled:opacity-60 disabled:cursor-not-allowed`}>{t.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div onClick={() => { if (!loading && !openingId) create(); }} className={`group relative h-72 border-4 border-dashed border-gray-400 bg-gray-50 hover:bg-white hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col items-center justify-center gap-4 ${(loading || openingId) ? 'opacity-60 cursor-wait pointer-events-none' : 'cursor-pointer'}`}>
            {loading ? (
              <>
                <div className="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center"><h3 className="text-2xl font-black">Création…</h3><p className="font-mono text-sm text-gray-500 mt-1">Veuillez patienter</p></div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Plus size={32} className="text-black" /></div>
                <div className="text-center"><h3 className="text-2xl font-black">Créer un projet</h3><p className="font-mono text-sm text-gray-500 mt-1">Commencer de zéro</p></div>
              </>
            )}
          </div>
          {loadingProjects ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse flex flex-col justify-between">
                <div className="h-5 w-40 bg-gray-200" />
                <div className="h-3 w-32 bg-gray-200" />
                <div className="h-9 w-24 bg-gray-200" />
              </div>
            ))
          ) : (
            displayedProjects.map((p, i) => (
              <div
                key={p.id}
                onClick={() => { if (!openingId) { setOpeningId(p.id); router.push(`/projects/${p.id}`); } }}
                className="group relative h-80 bg-white border-4 border-black flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all duration-300 cursor-pointer rounded-xl overflow-hidden"
              >
                <div
                  className={`h-40 w-full border-b-4 border-black relative bg-primary overflow-hidden`}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        i % 3 === 0
                          ? 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)'
                          : i % 3 === 1
                          ? 'radial-gradient(var(--primary) 2px, transparent 2px)'
                          : 'repeating-linear-gradient(45deg, var(--primary), var(--primary) 1px, transparent 1px, transparent 10px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: 'radial-gradient(black 2px, transparent 2px)',
                      backgroundSize: '18px 18px',
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-yellow-300 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-md border-2 border-black">
                    BOARD
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((cur) => (cur === p.id ? null : p.id));
                        }}
                        disabled={!!openingId}
                        className="p-2 hover:bg-yellow-100 rounded-full border-2 border-transparent hover:border-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openMenuId === p.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(p.id);
                            }}
                            disabled={deletingId === p.id}
                            className={`px-4 py-2 w-full text-left font-bold ${deletingId === p.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-100'} text-red-600`}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    {editingId === p.id ? (
                      <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRename(p);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          className="h-10 px-3 border-2 border-black bg-white font-black text-lg focus:outline-none"
                        />
                        <button onClick={(e) => { e.stopPropagation(); confirmRename(p); }} disabled={renamingId === p.id} className={`h-10 px-3 border-2 border-black bg-white font-bold ${renamingId === p.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-100'} flex items-center`}>
                          <Check size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="h-10 px-3 border-2 border-black bg-white font-bold hover:bg-red-100 flex items-center">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-black leading-tight group-hover:underline decoration-yellow-300 decoration-2 underline-offset-4">
                          {getTitle(p)}
                        </h3>
                        <button onClick={(e) => { e.stopPropagation(); startRename(p); }} disabled={!!openingId} className="p-2 hover:bg-yellow-100 rounded-full border-2 border-transparent hover:border-black transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                          <Pencil size={16} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 font-mono">
                      <Clock size={14} /> {new Date(p.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex -space-x-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-xs font-bold shadow-sm"
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      {openingId && (
        <div className="fixed inset-0 z-[999] bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <div className="text-lg font-black">Ouverture…</div>
            <div className="text-sm font-mono text-gray-600">Veuillez patienter</div>
          </div>
        </div>
      )}

      <LimitModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        description="Vous avez atteint le nombre maximum de boards autorisés pour votre plan actuel. Passez à la vitesse supérieure pour créer plus de projets."
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Palette, Save, Loader2, Check } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface UserPreferences {
  themeColor?: string;
  darkMode?: boolean;
}

interface UserStatus {
  plan: {
    name: string;
    slug: string;
    quota: number;
    aiTokens: number;
  };
  usage?: {
    projects: number;
    aiTokens: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'preferences' | 'billing'>('preferences');
  const [preferences, setPreferences] = useState<UserPreferences>({ themeColor: '#000000', darkMode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [prefsRes, statusRes] = await Promise.all([
          fetch('/api/user/settings'),
          fetch('/api/user/status')
        ]);

        if (prefsRes.status === 401 || statusRes.status === 401) {
          router.replace('/login');
          return;
        }

        if (prefsRes.ok) {
          const prefs = await prefsRes.json();
          setPreferences(prev => ({ ...prev, ...prefs }));
        }

        if (statusRes.ok) {
          const status = await statusRes.json();
          setUserStatus(status);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      // Optionally show success message
    } catch (e) {
      console.error('Failed to save', e);
    } finally {
      setSaving(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert('Impossible d\'ouvrir le portail de facturation. Êtes-vous sur le plan gratuit ?');
      }
    } catch (e) {
      console.error('Portal error', e);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <nav className="sticky top-0 z-40 bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 font-bold hover:underline"
          >
            <ArrowLeft size={20} /> Retour
          </button>
          <span className="text-2xl font-black tracking-tighter">Paramètres</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-4 py-3 font-bold border-2 transition-all ${
                activeTab === 'preferences'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]'
                  : 'bg-white border-transparent hover:bg-gray-100 hover:border-black'
              }`}
            >
              <Palette size={20} /> Préférences
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-3 px-4 py-3 font-bold border-2 transition-all ${
                activeTab === 'billing'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]'
                  : 'bg-white border-transparent hover:bg-gray-100 hover:border-black'
              }`}
            >
              <CreditCard size={20} /> Facturation
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-[400px] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Apparence</h2>
                  
                  <div className="space-y-4">
                    <label className="block font-bold text-lg">Couleur principale</label>
                    <div className="flex gap-4">
                      {['#000000', '#2563EB', '#DC2626', '#16A34A', '#D97706', '#9333EA', '#fde047'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setPreferences({ ...preferences, themeColor: color })}
                          className={`w-12 h-12 rounded-full border-4 transition-transform ${
                            preferences.themeColor === color ? 'border-black scale-110' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 font-mono mt-2">Cette couleur sera utilisée pour les accents de l'interface.</p>
                  </div>
                </div>

                <div className="pt-8 border-t-4 border-gray-100">
                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="px-8 py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-transparent hover:bg-primary hover:text-black hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Abonnement</h2>
                  
                  <div className="bg-gray-50 border-2 border-black p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-500 uppercase tracking-wider">Plan Actuel</span>
                      <span className="px-3 py-1 bg-primary border-2 border-black font-black text-sm uppercase">
                        {userStatus?.plan.name || 'Gratuit'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-sm">
                        <span>Boards utilisés</span>
                        <span className="font-bold">{userStatus?.plan.quota === 9999 ? 'Illimité' : `${userStatus?.usage?.projects || 0} / ${userStatus?.plan.quota}`}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 border border-black">
                        <div 
                          className="bg-black h-full" 
                          style={{ width: `${Math.min(100, ((userStatus?.usage?.projects || 0) / (userStatus?.plan.quota || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {userStatus?.plan.slug === 'free' ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-300">
                      <p className="mb-4 font-medium">Vous êtes sur le plan gratuit.</p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-black text-white font-bold border-4 border-transparent hover:bg-primary hover:text-black hover:border-black transition-all"
                      >
                        Mettre à niveau
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={openPortal}
                        disabled={portalLoading}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest border-4 border-black hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                      >
                        {portalLoading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                        Gérer mon abonnement
                      </button>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest border-4 border-transparent hover:border-black transition-all flex items-center justify-center gap-2"
                      >
                        Changer de plan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

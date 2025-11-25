'use client';

import React from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Github, Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken().catch(() => '');
        const res = await fetch('/api/auth/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.uid, email: user.email || '', name: user.displayName || '', idToken: token }) });
        if (res.ok) {
          const data = await res.json();
          if (data.hasSubscription) {
            router.replace('/projects');
          } else {
            router.replace('/pricing');
          }
        }
      }
    });
    return () => unsub();
  }, [router]);

  React.useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      const user = result?.user;
      if (user) {
        const token = await user.getIdToken().catch(() => '');
        const res = await fetch('/api/auth/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: user.uid, email: user.email || '', name: user.displayName || '', idToken: token }) });
        if (res.ok) {
          const data = await res.json();
          if (data.hasSubscription) {
            router.replace('/projects');
          } else {
            router.replace('/pricing');
          }
        }
      }
    }).catch(() => {});
  }, [router]);

  const doLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e?.message || 'Erreur d’inscription');
    } finally {
      setLoading(false);
    }
  };

  const doGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/network-request-failed' || code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
        } catch (ee: any) {
          setError(ee?.message || 'Erreur Google');
        }
      } else {
        setError(e?.message || 'Erreur Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    await signOut(auth);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin();
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-between relative z-10">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter hover:skew-x-[-10deg] transition-transform inline-block cursor-pointer">FRAYM.</h1>
        </div>
        <div className="max-w-md w-full mx-auto mt-12 mb-12">
          <div className="mb-10">
            <h2 className="text-5xl font-black mb-4 text-black">Welcome back.</h2>
            <p className="text-xl font-medium text-gray-600">Ready to organize the chaos inside your brain?</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={doGoogle} disabled={loading} className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              GOOGLE
            </button>
            <button disabled className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-sm opacity-60 cursor-not-allowed">
              <Github size={20} />
              GITHUB
            </button>
          </div>
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-black" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white font-bold border-2 border-black text-black">OR EMAIL</span></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-black uppercase tracking-wide ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-black" /></div>
                <input type="email" required className="block w-full pl-10 pr-3 py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(236,72,153,1)] focus:border-pink-500 transition-all font-bold placeholder:text-gray-400 placeholder:font-normal bg-white" placeholder="elon@mars.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1"><label className="text-sm font-black uppercase tracking-wide">Password</label><a href="#" className="text-sm font-bold text-blue-600 hover:text-black hover:underline decoration-2 decoration-black underline-offset-2">Forgot?</a></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-black" /></div>
                <input type={showPassword ? 'text' : 'password'} required className="block w-full pl-10 pr-10 py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(236,72,153,1)] focus:border-pink-500 transition-all font-bold placeholder:text-gray-400 placeholder:font-normal bg-white" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">{showPassword ? <EyeOff className="h-5 w-5 text-black" /> : <Eye className="h-5 w-5 text-black" />}</button>
              </div>
            </div>
            {error && <div className="text-red-700 text-sm font-bold">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-black text-white text-xl font-black py-4 border-4 border-transparent hover:bg-yellow-300 hover:text-black hover:border-black shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group">{loading ? (<div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />) : (<>LOG IN <ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} /></>)}</button>
          </form>
          <div className="mt-8 text-center"><p className="font-bold text-gray-600">Don't have an account? <button onClick={doRegister} className="text-black underline decoration-4 decoration-yellow-300 hover:decoration-black underline-offset-4 transition-all">Create one now</button></p></div>
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2025 Fraym Inc. No boring stuff allowed.</div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-yellow-300 relative border-l-4 border-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, black 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
        <div className="relative w-full h-full">
          <div className="absolute top-[20%] left-[15%] w-72 bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg] animate-float-slow z-20">
            <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(i => <Sparkles key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}</div>
            <p className="font-bold text-lg leading-tight mb-4">"Finally, a tool that works like my chaotic brain does. Goodbye linear docs!"</p>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-black rounded-full" /><div><div className="text-sm font-black uppercase">Sarah K.</div><div className="text-xs font-bold text-gray-500">Product Designer</div></div></div>
          </div>
          <div className="absolute bottom-[20%] right-[15%] w-80 bg-pink-400 border-4 border-black p-2 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rotate-[3deg] animate-float-delayed z-10">
            <div className="bg-black p-4 h-48 flex items-center justify-center"><h3 className="text-4xl font-black text-white text-center leading-none">MAKE<br/>IDEAS<br/>HAPPEN</h3></div>
          </div>
          <div className="absolute top-10 right-10 bg-blue-400 text-black font-black px-4 py-2 border-4 border-black rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">v2.0 IS LIVE</div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-green-400 rounded-full border-4 border-black flex items-center justify-center animate-spin-slow">
            <svg viewBox="0 0 100 100" width="100" height="100"><defs><path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" /></defs><text fontSize="12" fontWeight="bold"><textPath xlinkHref="#circle">• ORGANIZE • VISUALIZE • CREATE</textPath></text></svg>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-20px) rotate(-4deg); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-15px) rotate(5deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

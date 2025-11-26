'use client';

import React, { useState, useEffect } from 'react';
import { PLANS } from '@/utils/subscription';
import { Check, Loader2, ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserStatus {
  hasSelectedPlan: boolean;
  plan: {
    name: string;
    slug: string;
    quota: number;
    aiTokens: number;
  };
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [confirmationData, setConfirmationData] = useState<{
    priceId: string;
    amountDue: number;
    currency: string;
    newPlanName: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/user/status');
        if (res.ok) {
          const data = await res.json();
          setUserStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch user status:', error);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) return;
    setLoading(priceId);
    try {
      // Check if updating existing subscription
      if (userStatus?.hasSelectedPlan && userStatus.plan.slug !== 'free') {
        // Preview the update first
        const previewRes = await fetch('/api/stripe/subscription/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId }),
        });

        if (previewRes.ok) {
            const previewData = await previewRes.json();
            const plan = PLANS.find(p => p.price.priceIds.test === priceId || p.price.priceIds.production === priceId);
            setConfirmationData({
                priceId,
                amountDue: previewData.amountDue,
                currency: previewData.currency,
                newPlanName: plan?.name || 'Unknown Plan',
            });
        } else {
            console.error('Failed to preview subscription update');
            // Fallback or error message?
            // Maybe direct update attempt if preview fails? No, safer to stop.
        }
      } else {
        // New subscription
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });

        if (response.status === 401) {
            router.push('/login');
            return;
        }

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!confirmationData) return;
    setLoading('confirm');
    try {
        if (confirmationData.newPlanName === 'Gratuit') {
             // Handle downgrade to free
             const res = await fetch('/api/stripe/subscription', {
                method: 'DELETE',
             });
             if (res.ok) {
                const updated = await fetch('/api/user/status').then(r => r.json());
                setUserStatus(updated);
                setConfirmationData(null);
             } else {
                 console.error('Cancellation failed');
             }
        } else {
            // Handle update to paid plan
            const res = await fetch('/api/stripe/subscription', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ priceId: confirmationData.priceId }),
            });
            
            if (res.ok) {
              // Refresh status and UI
              const updated = await fetch('/api/user/status').then(r => r.json());
              setUserStatus(updated);
              setConfirmationData(null);
            } else {
               console.error('Update failed');
            }
        }
    } catch (error) {
        console.error('Error confirming update:', error);
    } finally {
        setLoading(null);
    }
  };

  const handleSelectFree = async () => {
    if (userStatus?.hasSelectedPlan && userStatus.plan.slug !== 'free') {
        // Show confirmation for downgrade
        setConfirmationData({
            priceId: '',
            amountDue: 0,
            currency: 'EUR',
            newPlanName: 'Gratuit',
        });
    } else {
        // Initial selection logic (if needed)
        setLoading('free');
        try {
            const res = await fetch('/api/plans/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planSlug: 'free' }),
            });
            if (res.ok) {
                router.push('/projects');
            }
        } catch (error) {
            console.error('Error selecting free plan:', error);
        } finally {
            setLoading(null);
        }
    }
  };



  return (
    <div className="min-h-screen w-full bg-white font-sans text-black overflow-x-hidden relative">
       {confirmationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                <button 
                    onClick={() => setConfirmationData(null)}
                    className="absolute top-4 right-4 hover:bg-gray-100 p-1"
                >
                    <X size={24} />
                </button>
                <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Confirmer le changement</h2>
                
                <div className="space-y-4 mb-8">
                    <p className="text-lg font-medium">
                        Vous passez au plan <span className="font-black">{confirmationData.newPlanName}</span>.
                    </p>
                    
                    {confirmationData.newPlanName === 'Gratuit' ? (
                         <div className="bg-red-50 p-4 border-2 border-red-500 text-red-700">
                             <p className="font-bold uppercase mb-1">Attention</p>
                             <p>Votre abonnement actuel sera résilié immédiatement. Vous perdrez accès aux fonctionnalités payantes.</p>
                         </div>
                    ) : (
                        <div className="bg-gray-50 p-4 border-2 border-black">
                            <p className="text-sm text-gray-500 font-bold uppercase mb-1">Montant à régler maintenant</p>
                            <p className="text-4xl font-black">
                                {(confirmationData.amountDue / 100).toFixed(2)} {confirmationData.currency.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Calculé au prorata de votre période actuelle.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setConfirmationData(null)}
                        className="flex-1 py-3 border-4 border-black font-bold uppercase hover:bg-gray-100 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirmUpdate}
                        disabled={loading === 'confirm'}
                        className="flex-1 py-3 border-4 border-black bg-primary font-bold uppercase hover:brightness-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading === 'confirm' ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
       )}

       <nav className="sticky top-0 z-40 bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/projects')}>
          <span className="text-2xl font-black tracking-tighter">FRAYM.</span>
        </div>
        <button 
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 font-bold hover:underline"
        >
            <ArrowLeft size={20} /> Retour
        </button>
      </nav>

      <div className="max-w-6xl mx-auto py-20 px-6">
        <div className="text-center mb-16 relative">
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 relative z-10 inline-block">
            Passez au niveau supérieur
            <div className="h-6 w-full bg-primary absolute bottom-2 left-0 opacity-50 transform -skew-x-12 -z-10"></div>
          </h1>
          <p className="text-xl font-bold text-gray-500 font-mono">Choisissez l'outil adapté à votre ambition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`border-4 border-black p-8 flex flex-col justify-between transition-all bg-white relative ${
                plan.slug === 'pro' 
                    ? 'shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              {plan.slug === 'pro' && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary border-4 border-black text-black px-6 py-2 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  Populaire
                </div>
              )}
              
              <div>
                <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">{plan.name}</h3>
                <div className="mb-8 border-b-4 border-black pb-8">
                  <span className="text-5xl font-black">{plan.price.amount}€</span>
                  <span className="text-gray-500 font-bold text-xl">/mois</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="bg-black text-white p-1 rounded-none mt-1">
                      <Check className="w-3 h-3" strokeWidth={4} />
                    </div>
                    <span className="font-bold text-lg">
                      {plan.quota === 9999 ? 'Boards illimités' : `${plan.quota} Boards`}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className={`p-1 mt-1 ${plan.aiTokens > 0 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
                      <Check className="w-3 h-3" strokeWidth={4} />
                    </div>
                    <span className={`font-bold text-lg ${plan.aiTokens > 0 ? '' : 'text-gray-400 line-through'}`}>
                      {plan.aiTokens > 0
                        ? `${(plan.aiTokens / 1000).toFixed(0)}k Tokens AI`
                        : 'Pas d\'accès AI'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                     <div className="bg-black text-white p-1 mt-1">
                      <Check className="w-3 h-3" strokeWidth={4} />
                    </div>
                    <span className="font-bold text-lg">Support {plan.slug === 'team' ? 'Prioritaire' : 'Standard'}</span>
                  </li>
                </ul>
              </div>

                  <button
                onClick={() => {
                  if (userStatus?.plan.slug === plan.slug && userStatus?.hasSelectedPlan) return;
                  plan.slug === 'free' ? handleSelectFree() : handleSubscribe(plan.price.priceIds.test);
                }}
                disabled={loading !== null || (userStatus?.plan.slug === plan.slug && userStatus?.hasSelectedPlan)}
                className={`w-full py-4 border-4 border-black font-black text-lg uppercase tracking-widest transition-all ${
                  userStatus?.plan.slug === plan.slug && userStatus?.hasSelectedPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
                    : plan.slug === 'pro'
                    ? 'bg-black text-white hover:bg-primary hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-black hover:text-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0`}
              >
                {loading === plan.price.priceIds.test || (plan.slug === 'free' && loading === 'free') ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : userStatus?.plan.slug === plan.slug && userStatus?.hasSelectedPlan ? (
                  'Plan Actuel'
                ) : plan.slug === 'free' ? (
                  'Choisir'
                ) : (
                  'S\'abonner'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

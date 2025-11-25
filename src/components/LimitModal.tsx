'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function LimitModal({ 
  isOpen, 
  onClose, 
  title = "Limite atteinte", 
  description = "Vous avez atteint la limite de votre plan actuel. Passez à la vitesse supérieure pour débloquer plus de fonctionnalités." 
}: LimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all"
        >
          <X size={20} />
        </button>
        
        <div className="w-16 h-16 bg-yellow-300 border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Lock size={32} className="text-black" />
        </div>
        
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">{title}</h2>
        
        <p className="font-medium text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.push('/pricing')}
            className="w-full py-4 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-yellow-300 hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            Voir les offres
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest border-4 border-black hover:bg-gray-100 transition-all"
          >
            Peut-être plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

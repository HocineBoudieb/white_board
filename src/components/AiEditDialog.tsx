'use client';

import React, { useState } from 'react';
import { X, Wand2 } from 'lucide-react';

interface AiEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instructions: string) => void;
  isLoading?: boolean;
}

export function AiEditDialog({ 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading = false
}: AiEditDialogProps) {
  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructions.trim()) {
      onSubmit(instructions);
      setInstructions('');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all"
          disabled={isLoading}
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-purple-300 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Wand2 size={24} className="text-black" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Éditer avec l'IA</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold text-sm mb-2 uppercase">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Traduis ce texte en anglais, ou ajoute une tâche à la liste..."
              className="w-full h-32 p-4 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-purple-200 resize-none"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest border-4 border-black hover:bg-gray-100 transition-all"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-purple-400 hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !instructions.trim()}
            >
              {isLoading ? 'Traitement...' : 'Générer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

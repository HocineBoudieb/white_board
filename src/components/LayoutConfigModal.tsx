'use client';

import React, { useState } from 'react';
import { LayoutGrid, Network, GitGraph, Activity, X } from 'lucide-react';
import { LayoutType, LayoutOptions } from '../utils/semanticLayout';

interface LayoutConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (type: LayoutType, options: LayoutOptions) => void;
}

export function LayoutConfigModal({ isOpen, onClose, onApply }: LayoutConfigModalProps) {
  const [selectedType, setSelectedType] = useState<LayoutType>('grid');
  const [spacing, setSpacing] = useState(50);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(selectedType, { spacing });
    onClose();
  };

  const layoutOptions: { type: LayoutType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'grid',
      label: 'Matriciel',
      icon: <LayoutGrid size={24} />,
      desc: 'Organise les nœuds en grille, groupés par type.',
    },
    {
      type: 'hierarchy',
      label: 'Hiérarchique',
      icon: <GitGraph size={24} />,
      desc: 'Structure en arbre basée sur les connexions.',
    },
    {
      type: 'radial',
      label: 'Radial',
      icon: <Activity size={24} />,
      desc: 'Dispose les nœuds connectés autour d\'un centre.',
    },
    {
      type: 'organic',
      label: 'Organique',
      icon: <Network size={24} />,
      desc: 'Simulation physique pour un regroupement naturel.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">
          Réarrangement Spatial
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block font-bold mb-3 uppercase text-sm">Style d'arrangement</label>
            <div className="grid grid-cols-2 gap-3">
              {layoutOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`p-4 border-2 flex flex-col items-center gap-2 text-center transition-all
                    ${
                      selectedType === option.type
                        ? 'bg-yellow-300 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white border-gray-300 hover:border-black hover:bg-gray-50'
                    }`}
                >
                  {option.icon}
                  <span className="font-bold">{option.label}</span>
                  <span className="text-xs text-gray-600 leading-tight">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold mb-3 uppercase text-sm">
              Espacement (px): {spacing}
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer border-2 border-black"
            />
          </div>

          <button
            onClick={handleApply}
            className="w-full py-3 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-blue-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            Appliquer le réarrangement
          </button>
        </div>
      </div>
    </div>
  );
}

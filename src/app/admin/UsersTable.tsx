'use client';

import { useState } from 'react';
import { Trash2, RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import { deleteUser, resetAiUsage } from './actions';

type UserWithCount = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: Date | string;
  stripePriceId: string | null;
  aiTokensUsed: number;
  _count: {
    projects: number;
  };
};

export default function UsersTable({ users }: { users: UserWithCount[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.id || '').includes(searchTerm)
  );

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;
    
    setLoadingId(userId);
    await deleteUser(userId);
    setLoadingId(null);
  };

  const handleResetAi = async (userId: string) => {
    if (!confirm('Réinitialiser les tokens AI pour cet utilisateur ?')) return;
    
    setLoadingId(userId);
    await resetAiUsage(userId);
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un utilisateur (email, nom, id)..."
          className="w-full pl-10 pr-4 py-2 border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-yellow-300 border-b-2 border-black">
              <th className="p-4 font-bold border-r-2 border-black">Utilisateur</th>
              <th className="p-4 font-bold border-r-2 border-black">Projets</th>
              <th className="p-4 font-bold border-r-2 border-black">Plan</th>
              <th className="p-4 font-bold border-r-2 border-black">IA Tokens</th>
              <th className="p-4 font-bold border-r-2 border-black">Date d'inscription</th>
              <th className="p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b-2 border-black last:border-b-0 hover:bg-gray-50">
                <td className="p-4 border-r-2 border-black">
                  <div className="font-bold">{user.name || 'Sans nom'}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1">{user.id}</div>
                </td>
                <td className="p-4 border-r-2 border-black text-center font-mono">
                  {user._count.projects}
                </td>
                <td className="p-4 border-r-2 border-black">
                  {user.stripePriceId ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 border border-green-800 text-xs font-bold uppercase">
                      Premium
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 border border-gray-800 text-xs font-bold uppercase">
                      Gratuit
                    </span>
                  )}
                </td>
                <td className="p-4 border-r-2 border-black font-mono">
                  {user.aiTokensUsed.toLocaleString()}
                </td>
                <td className="p-4 border-r-2 border-black text-sm">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetAi(user.id)}
                      disabled={loadingId === user.id}
                      className="p-2 hover:bg-blue-100 border-2 border-transparent hover:border-black transition-all"
                      title="Réinitialiser IA"
                    >
                      <RefreshCcw size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={loadingId === user.id}
                      className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-black transition-all"
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

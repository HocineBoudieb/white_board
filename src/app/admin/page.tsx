import { getStats, getUsers } from './actions';
import UsersTable from './UsersTable';
import { Users, FileText, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [stats, users] = await Promise.all([getStats(), getUsers()]);

  // Serialize dates for Client Component
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd ? user.stripeCurrentPeriodEnd.toISOString() : null,
  }));

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Utilisateurs Total" 
          value={stats.userCount} 
          icon={<Users size={24} />} 
          color="bg-white"
        />
        <StatCard 
          title="Whiteboards Créés" 
          value={stats.projectCount} 
          icon={<FileText size={24} />} 
          color="bg-yellow-300"
        />
        <StatCard 
          title="Abonnés Premium" 
          value={stats.proUsers} 
          icon={<CreditCard size={24} />} 
          color="bg-white"
        />
      </div>

      {/* User Management */}
      <div>
        <h2 className="text-2xl font-black mb-6 uppercase border-l-8 border-yellow-300 pl-4">
          Gestion des Utilisateurs
        </h2>
        <UsersTable users={serializedUsers} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className={`${color} border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-transform hover:-translate-y-1`}>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-75">{title}</h3>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <div className="p-3 bg-white border-2 border-black rounded-full">
        {icon}
      </div>
    </div>
  );
}

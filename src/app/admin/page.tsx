'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAdminUsers, updateUserRole, getAdminStats, updateUserStatus, deleteUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal'; // IMPORTADO

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Estado para Modal de Confirmação
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Verificar se é admin
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => getAdminUsers(page),
    enabled: user?.role === 'admin',
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    enabled: user?.role === 'admin',
  });

  // Mutation para mudar role
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Role atualizada com sucesso!');
    },
    onError: () => alert('Erro ao atualizar role.'),
  });

  // Mutation para mudar status (Bloquear/Desbloquear)
  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => alert('Erro ao atualizar estado.'),
  });

  // Mutation para apagar utilizador
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      // alert('Utilizador apagado com sucesso.'); // Opcional, o modal fecha
    },
    onError: () => alert('Erro ao apagar utilizador.'),
  });

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  if (authLoading || (usersLoading && !usersData)) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary text-muted font-heading font-bold animate-pulse">A carregar painel de admin... 🛡️</div>;
  }

  if (user?.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-8 transition-colors duration-300">
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Apagar Utilizador?"
        message="Esta ação é irreversível. Todas as contas, transações e dados deste utilizador serão apagados permanentemente."
        confirmText="Sim, Apagar"
        isDanger={true}
      />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-darkText dark:text-lightText mb-8">Painel de Administração 🛡️</h1>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-700">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">Utilizadores Totais</span>
            <div className="text-3xl font-heading font-bold text-darkText dark:text-lightText mt-2 tabular-nums">{statsData?.total_users || '-'}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-700">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">Transações Totais</span>
            <div className="text-3xl font-heading font-bold text-darkText dark:text-lightText mt-2 tabular-nums">{statsData?.total_transactions || '-'}</div>
          </div>
        </div>

        {/* TABELA DE UTILIZADORES */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-secondary dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-secondary dark:border-gray-700">
            <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText">Gestão de Utilizadores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted">
              <thead className="text-xs text-darkText dark:text-lightText uppercase bg-secondary dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.items.map((u) => (
                  <tr key={u.id} className="bg-white dark:bg-gray-800 border-b border-secondary dark:border-gray-700 hover:bg-secondary/50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-mono tabular-nums">{u.id}</td>
                    <td className="px-6 py-4 font-medium text-darkText dark:text-lightText">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                        className="bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-darkText dark:text-lightText text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 outline-none"
                      >
                        <option value="basic">Básico</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => statusMutation.mutate({ userId: u.id, isActive: !u.is_active })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          u.is_active 
                            ? 'bg-success/10 text-success hover:bg-success/20' 
                            : 'bg-error/10 text-error hover:bg-error/20'
                        }`}
                      >
                        {u.is_active ? 'Ativo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteClick(u.id)}
                        className="text-muted hover:text-error transition-colors p-1"
                        title="Apagar Utilizador"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINAÇÃO */}
          <div className="flex justify-between items-center p-4 border-t border-secondary dark:border-gray-700 bg-secondary dark:bg-gray-900">
            <span className="text-sm text-muted">Página <span className="font-bold text-darkText dark:text-lightText">{usersData?.page}</span> de <span className="font-bold text-darkText dark:text-lightText">{usersData?.pages}</span></span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-secondary dark:hover:bg-gray-700 disabled:opacity-50 text-darkText dark:text-lightText">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= (usersData?.pages || 1)} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-secondary dark:hover:bg-gray-700 disabled:opacity-50 text-darkText dark:text-lightText">Próxima</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
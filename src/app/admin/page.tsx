'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAdminUsers, updateUserRole, getAdminStats, updateUserStatus, deleteUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Check Admin
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

  // Mutations
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showNotification('success', 'Role updated successfully!');
    },
    onError: () => showNotification('error', 'Error updating role.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showNotification('success', 'User status updated.');
    },
    onError: () => showNotification('error', 'Error updating status.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showNotification('success', 'User deleted successfully.');
    },
    onError: () => showNotification('error', 'Error deleting user.'),
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
    return <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary text-muted font-heading font-bold animate-pulse">Loading Admin Panel... 🛡️</div>;
  }

  if (user?.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-8 transition-colors duration-300">
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User?"
        message="This action is irreversible. All accounts, transactions, and data for this user will be permanently deleted."
        confirmText="Yes, Delete"
        isDanger={true}
      />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-darkText dark:text-lightText mb-8">Admin Panel 🛡️</h1>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-700">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">Total Users</span>
            <div className="text-3xl font-heading font-bold text-darkText dark:text-lightText mt-2 tabular-nums">{statsData?.total_users || '-'}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-700">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">Total Transactions</span>
            <div className="text-3xl font-heading font-bold text-darkText dark:text-lightText mt-2 tabular-nums">{statsData?.total_transactions || '-'}</div>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-secondary dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-secondary dark:border-gray-700">
            <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted">
              <thead className="text-xs text-darkText dark:text-lightText uppercase bg-secondary dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
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
                        <option value="basic">Basic</option>
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
                        {u.is_active ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteClick(u.id)}
                        className="text-muted hover:text-error transition-colors p-1"
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION */}
          <div className="flex justify-between items-center p-4 border-t border-secondary dark:border-gray-700 bg-secondary dark:bg-gray-900">
            <span className="text-sm text-muted">Page <span className="font-bold text-darkText dark:text-lightText">{usersData?.page}</span> of <span className="font-bold text-darkText dark:text-lightText">{usersData?.pages}</span></span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-secondary dark:hover:bg-gray-700 disabled:opacity-50 text-darkText dark:text-lightText">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= (usersData?.pages || 1)} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-secondary dark:hover:bg-gray-700 disabled:opacity-50 text-darkText dark:text-lightText">Next</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface UserData {
    id: number;
    email: string;
    role: 'basic' | 'premium' | 'admin';
    created_at: string;
    profile?: {
        first_name: string;
    };
}

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;

        // Segurança Frontend: Se não for admin, manda para casa
        if (!user || user.role !== 'admin') {
            router.push('/');
            return;
        }

        loadUsers();
    }, [user, authLoading, router]);

    const loadUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsersList(res.data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar lista de utilizadores.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async (userId: number, newRole: string) => {
        if(!confirm(`Tem a certeza que quer mudar este user para ${newRole}?`)) return;
        
        try {
            // Nota: O backend espera um query param ?role=...
            await api.put(`/users/${userId}/role?role=${newRole}`);
            
            // Atualizar lista localmente
            setUsersList(usersList.map(u => 
                u.id === userId ? { ...u, role: newRole as any } : u
            ));
        } catch (err) {
            alert('Erro ao atualizar permissões.');
        }
    };

    if (authLoading || loading) return <div className="p-10 text-center text-gray-500">A carregar painel de controlo... 🔐</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Administração 🛡️</h1>
                        <p className="text-gray-500">Gestão de utilizadores e sistema</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                        <span className="font-bold text-blue-600 text-lg">{usersList.length}</span>
                        <span className="text-gray-500 text-sm ml-2">Utilizadores Totais</span>
                    </div>
                </header>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">ID</th>
                                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Utilizador</th>
                                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Email</th>
                                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Role</th>
                                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {usersList.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-5 text-gray-400 font-mono text-xs">#{u.id}</td>
                                        <td className="p-5 font-bold text-gray-800">
                                            {u.profile?.first_name || 'Sem nome'}
                                        </td>
                                        <td className="p-5 text-gray-600">{u.email}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                u.role === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <select 
                                                className="text-sm border border-gray-200 rounded-lg p-2 outline-none focus:border-blue-500"
                                                value={u.role}
                                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                disabled={u.id === user?.id} // Não te podes despromover a ti próprio
                                            >
                                                <option value="basic">Basic</option>
                                                <option value="premium">Premium</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
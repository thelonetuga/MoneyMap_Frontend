'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const res = await api.post('/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            login(res.data.access_token); 
            
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Email ou password incorretos.');
            } else {
                setError('Erro ao ligar ao servidor. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Classes de estilo atualizadas para Dark Mode
    const inputClass = "w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium";
    const labelClass = "block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1";

    return (
        <main className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex items-center justify-center p-6 transition-colors duration-200">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 md:p-10 animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">MoneyMap 🌍</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Bem-vindo de volta!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-800 text-center">
                            {error} ⚠️
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Email</label>
                        <input
                            required
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <input
                            required
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 mt-4 ${loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                    >
                        {loading ? 'A entrar...' : 'Entrar 🔐'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    Ainda não tem conta? <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Registar</Link>
                </div>
            </div>
        </main>
    );
}
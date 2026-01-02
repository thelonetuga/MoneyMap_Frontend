'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // O AuthContext já faz o push, mas podemos manter por segurança
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // <--- IMPORTANTE: Usar o Contexto
import api from '@/services/api'; // <--- IMPORTANTE: Usar o Axios configurado

export default function LoginPage() {
    const { login } = useAuth(); // Vamos usar a função login do contexto
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Preparar os dados no formato OAuth2 padrão (x-www-form-urlencoded)
            const params = new URLSearchParams();
            params.append('username', email); // Mapear email para username
            params.append('password', password);

            // 2. Enviar pedido usando o cliente API
            const res = await api.post('/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // 3. Usar a função login do contexto
            // Isto guarda o token E atualiza o estado global da App imediatamente
            login(res.data.access_token); 
            
            // Nota: O router.push('/') geralmente é feito dentro do login(), 
            // mas não faz mal estar lá também.

        } catch (err: any) {
            console.error(err);
            // Mensagem de erro amigável
            if (err.response?.status === 401) {
                setError('Email ou password incorretos.');
            } else {
                setError('Erro ao ligar ao servidor. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Classes de estilo
    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-500 font-medium";
    const labelClass = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1";

    return (
        <main className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">MoneyMap 🌍</h1>
                    <p className="text-gray-500 font-medium">Bem-vindo de volta!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
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
                        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading ? 'A entrar...' : 'Entrar 🔐'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Ainda não tem conta? <Link href="/register" className="text-blue-600 font-bold hover:underline">Registar</Link>
                </div>
            </div>
        </main>
    );
}
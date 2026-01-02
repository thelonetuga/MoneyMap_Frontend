'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As passwords não coincidem');
            setLoading(false);
            return;
        }

        try {
            // 1. Criar Utilizador
            await api.post('/users/', {
                email,
                password,
                role: 'basic'
            });

            // 2. Login Automático (Pedir Token)
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            // Nota: Para o token, usamos axios mas precisamos de override ao Content-Type
            const tokenRes = await api.post('/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 3. Entrar
            login(tokenRes.data.access_token);

        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400) {
                setError('Este email já está registado.');
            } else {
                setError('Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-500 font-medium";
    const labelClass = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1";

    return (
        <main className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">Criar Conta 🚀</h1>
                    <p className="text-gray-500 font-medium">Junte-se ao MoneyMap</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
                            {error} ⚠️
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Email</label>
                        <input required type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <input required type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Confirmar Password</label>
                        <input required type="password" placeholder="••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
                    </div>

                    <button type="submit" disabled={loading} className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-4 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {loading ? 'A criar conta...' : 'Registar ✨'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Já tem conta? <Link href="/login" className="text-blue-600 font-bold hover:underline">Entrar</Link>
                </div>
            </div>
        </main>
    );
}
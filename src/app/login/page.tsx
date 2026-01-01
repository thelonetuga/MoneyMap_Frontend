'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // O FastAPI espera os dados em formato "Form Data", não JSON!
        // E exige que o campo de email se chame "username".
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const res = await fetch('http://127.0.0.1:8000/token', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Email ou password incorretos');
            }

            const data = await res.json();

            // GUARDAR O TOKEN NO BROWSER
            localStorage.setItem('token', data.access_token);

            // Redirecionar para o Dashboard
            router.push('/');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Classes de estilo (iguais ao formulário anterior)
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
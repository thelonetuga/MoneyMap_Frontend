'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validação Simples
        if (formData.password !== formData.confirmPassword) {
            setError("As passwords não coincidem.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    // Enviamos o perfil opcional logo no registo
                    profile: {
                        first_name: formData.first_name,
                        preferred_currency: "EUR"
                    }
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Erro ao criar conta');
            }

            // Sucesso!
            alert("Conta criada com sucesso! 🚀\nFaça login para continuar.");
            router.push('/login');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-500 font-medium";
    const labelClass = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1";

    return (
        <main className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta ✨</h1>
                    <p className="text-gray-500 font-medium">Junte-se ao MoneyMap</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
                            {error} ⚠️
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Nome</label>
                        <input required name="first_name" type="text" placeholder="Como te chamas?" className={inputClass} onChange={handleChange} />
                    </div>

                    <div>
                        <label className={labelClass}>Email</label>
                        <input required name="email" type="email" placeholder="seu@email.com" className={inputClass} onChange={handleChange} />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <input required name="password" type="password" placeholder="••••••" className={inputClass} onChange={handleChange} />
                    </div>

                    <div>
                        <label className={labelClass}>Confirmar Password</label>
                        <input required name="confirmPassword" type="password" placeholder="••••••" className={inputClass} onChange={handleChange} />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'}`}
                    >
                        {loading ? 'A criar...' : 'Registar 🚀'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Já tem conta? <Link href="/login" className="text-blue-600 font-bold hover:underline">Entrar</Link>
                </div>

            </div>
        </main>
    );
}
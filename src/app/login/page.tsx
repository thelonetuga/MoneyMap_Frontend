'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://127.0.0.1:8000/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: email, password }),
            });

            if (!res.ok) throw new Error('Credenciais inválidas');
            
            const data = await res.json();
            login(data.access_token);
        } catch (err) {
            setError('Email ou password incorretos.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
                <h1 className="text-2xl font-heading font-bold text-darkText dark:text-lightText mb-6 text-center">Bem-vindo de volta! 👋</h1>
                
                {error && <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm font-medium text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-transform active:scale-95 shadow-glow">
                        Entrar
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-muted">
                    Ainda não tens conta? <Link href="/register" className="text-accent hover:underline font-bold">Regista-te</Link>
                </p>
            </div>
        </div>
    );
}
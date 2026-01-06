'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api'; // Usar a instância do Axios

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Axios lança erro automaticamente se o status não for 2xx
      const res = await api.post('/auth/token', new URLSearchParams({ username: email, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      login(res.data.access_token);
    } catch (err: any) {
      console.error(err);
      
      // Tratamento de erros específico
      if (err.response) {
        if (err.response.status === 403) {
          setError('A sua conta foi bloqueada. Por favor contacte o suporte.');
        } else if (err.response.status === 401) {
          setError('Email ou password incorretos.');
        } else {
          setError(err.response.data?.detail || 'Ocorreu um erro ao tentar entrar.');
        }
      } else {
        setError('Erro de conexão. Verifique a sua internet.');
      }
      
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-accent mb-2">MoneyMap</h1>
          <p className="text-muted">Bem-vindo de volta!</p>
        </div>

        {error && (
          <div className={`mb-4 p-3 border text-sm rounded-lg text-center font-medium ${
            error.includes('bloqueada') 
              ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
              : 'bg-error/10 border-error/20 text-error'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-heading font-bold rounded-xl transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Ainda não tens conta? <Link href="/register" className="text-accent hover:underline font-bold">Criar conta</Link>
        </div>
      </div>
    </main>
  );
}
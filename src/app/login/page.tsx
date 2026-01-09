'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { loginUser } from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      login(data.access_token);
    } catch (err: any) {
      console.error(err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('A sua conta foi bloqueada. Por favor contacte o administrador.');
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-muted uppercase">Password</label>
              <Link href="/forgot-password" className="text-xs text-accent hover:underline font-medium">
                Esqueceu-se?
              </Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
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
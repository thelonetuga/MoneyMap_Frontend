'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Redirecionar se não houver token
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Link inválido ou incompleto.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setErrorMsg('As passwords não coincidem.');
      return;
    }

    // Validação básica de complexidade
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('A password deve ter pelo menos 8 caracteres, 1 maiúscula e 1 número.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await resetPassword(token, password);
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'O link expirou ou é inválido.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            ✅
          </div>
          <h1 className="text-2xl font-heading font-bold text-darkText dark:text-lightText mb-2">Password Alterada!</h1>
          <p className="text-muted">A sua password foi atualizada com sucesso.</p>
          <p className="text-sm text-muted mt-4">A redirecionar para o login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-accent mb-2">Nova Password</h1>
          <p className="text-muted text-sm">Defina a sua nova password segura.</p>
        </div>

        {status === 'error' && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Nova Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Confirmar Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !token}
            className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-heading font-bold rounded-xl transition-all shadow-glow disabled:opacity-50"
          >
            {loading ? 'A alterar...' : 'Alterar Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
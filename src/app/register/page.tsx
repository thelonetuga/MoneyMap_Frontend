'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { loginUser } from '@/services/api'; // Importar loginUser
import { useAuth } from '@/context/AuthContext'; // Importar useAuth

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // Hook de autenticação
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currency: 'EUR',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação de Password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('A password deve ter pelo menos 8 caracteres, 1 maiúscula e 1 número.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As passwords não coincidem.');
      setLoading(false);
      return;
    }

    try {
      // 1. Criar Utilizador
      const payload = {
        email: formData.email,
        password: formData.password,
        profile: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          preferred_currency: formData.currency
        }
      };

      await api.post('/users/', payload);

      // 2. Fazer Login Automático
      const loginData = await loginUser(formData.email, formData.password);
      
      // 3. Guardar Token e Redirecionar
      login(loginData.access_token);
      // O redirecionamento é tratado dentro do login() ou pelo AuthContext, mas por segurança:
      router.push('/');

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Ocorreu um erro ao criar conta.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-accent mb-2">Junta-te ao MoneyMap</h1>
          <p className="text-muted">Cria a tua conta personalizada.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* NOME COMPLETO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Nome</label>
              <input 
                name="firstName" required
                value={formData.firstName} onChange={handleChange}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                placeholder="João"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Apelido</label>
              <input 
                name="lastName" required
                value={formData.lastName} onChange={handleChange}
                className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
                placeholder="Silva"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Email</label>
            <input 
              name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="seu@email.com"
            />
          </div>

          {/* MOEDA */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Moeda Principal</label>
            <select 
              name="currency" 
              value={formData.currency} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dólar ($)</option>
              <option value="GBP">Libra (£)</option>
            </select>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Password</label>
            <input 
              name="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="w-full p-3 bg-secondary dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText transition-all"
              placeholder="Mín. 8 chars, 1 Maiúscula, 1 Número"
            />
          </div>

          {/* CONFIRMAR PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Confirmar Password</label>
            <input 
              name="confirmPassword" type="password" required
              value={formData.confirmPassword} onChange={handleChange}
              className={`w-full p-3 bg-secondary dark:bg-gray-900 border rounded-xl outline-none focus:ring-2 transition-all text-darkText dark:text-lightText ${
                formData.confirmPassword && formData.password !== formData.confirmPassword 
                  ? 'border-error focus:ring-error' 
                  : 'border-gray-200 dark:border-gray-600 focus:ring-accent'
              }`}
              placeholder="Repetir password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-error mt-1">As passwords não coincidem.</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-heading font-bold rounded-xl transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'A criar conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Já tem conta? <Link href="/login" className="text-accent hover:underline font-bold">Entrar</Link>
        </div>
      </div>
    </main>
  );
}
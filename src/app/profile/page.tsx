'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    api.get('/users/me/').then(res => {
      if (res.data.profile) {
        setFirstName(res.data.profile.first_name || '');
        setLastName(res.data.profile.last_name || '');
        setCurrency(res.data.profile.preferred_currency || 'EUR');
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/me/', { 
        first_name: firstName, 
        last_name: lastName,
        preferred_currency: currency 
      });
      alert('Perfil atualizado com sucesso! ✅');
      // Opcional: Recarregar user do contexto se necessário
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar perfil.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">A carregar perfil...</div>;

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-darkText dark:text-lightText mb-8">O Meu Perfil 👤</h1>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft border border-secondary dark:border-gray-700">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-4 border-2 border-accent">
              {user?.profile?.avatar_url ? (
                <img src={`http://127.0.0.1:8000${user.profile.avatar_url}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{firstName?.[0] || user?.email?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <p className="text-muted text-sm">{user?.email}</p>
            <span className="px-3 py-1 rounded-full bg-secondary dark:bg-gray-700 text-xs font-bold mt-2 uppercase tracking-wider text-muted">
              {user?.role}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Nome</label>
                <input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Apelido</label>
                <input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Moeda Preferida</label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)} 
                className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar ($)</option>
                <option value="GBP">Libra (£)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow"
            >
              Guardar Alterações
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api'; // Usar Axios

// Definição de tipos para evitar erros de TypeScript
interface Option {
  id: number;
  name: string;
}

export default function AddTransaction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para dropdowns
  const [types, setTypes] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  // Estado do formulário
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    transaction_type_id: '',
    category_id: '', 
    // Campos de Investimento
    symbol: '',
    quantity: '',
    price_per_unit: ''
  });

  // 1. CARREGAR DADOS (Usando Axios)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Axios já trata do token e da URL base
        const [typesRes, accountsRes, catsRes] = await Promise.all([
          api.get('/lookups/transaction-types'),
          api.get('/accounts'),
          api.get('/categories')
        ]);

        const typesData = typesRes.data;
        const accountsData = accountsRes.data;
        const catsData = catsRes.data;

        if (Array.isArray(typesData)) {
          setTypes(typesData);
          if (typesData.length > 0) setFormData(prev => ({ ...prev, transaction_type_id: String(typesData[0].id) }));
        }

        if (Array.isArray(accountsData)) {
          setAccounts(accountsData);
          if (accountsData.length > 0) setFormData(prev => ({ ...prev, account_id: String(accountsData[0].id) }));
        }

        if (Array.isArray(catsData)) {
          setCategories(catsData);
        }

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Não foi possível carregar os dados. Verifica a conexão.");
      }
    };

    fetchData();
  }, []);

  // 2. DETEÇÃO DE INVESTIMENTO
  const selectedType = Array.isArray(types) 
    ? types.find(t => t.id === Number(formData.transaction_type_id)) 
    : undefined;

  const isInvestment = selectedType 
    ? ['compra', 'buy', 'venda', 'sell', 'investimento'].some(k => selectedType.name.toLowerCase().includes(k)) 
    : false;

  // 3. SUBMETER FORMULÁRIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Converter valores numéricos
    const payload: any = {
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      account_id: Number(formData.account_id),
      transaction_type_id: Number(formData.transaction_type_id),
    };

    if (formData.category_id) payload.category_id = Number(formData.category_id);

    // Validação específica de Investimento
    if (isInvestment) {
      if (!formData.symbol || !formData.quantity) {
        setError('Para investimentos, tens de preencher o Símbolo (Ticker) e a Quantidade.');
        setLoading(false);
        return;
      }
      payload.symbol = String(formData.symbol).toUpperCase(); 
      payload.quantity = Number(formData.quantity);
      if (formData.price_per_unit) payload.price_per_unit = Number(formData.price_per_unit);
    }

    try {
      await api.post('/transactions/', payload);

      // SUCESSO: Invalidar cache
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['history'] });
      await queryClient.invalidateQueries({ queryKey: ['spending'] });
      await queryClient.invalidateQueries({ queryKey: ['evolution'] });

      router.push('/');
      
    } catch (err: any) {
      console.error("Erro no submit:", err);
      const msg = err.response?.data?.detail || "Ocorreu um erro desconhecido.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-lg w-full border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          💸 Nova Transação
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* DESCRIÇÃO E VALOR */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descrição</label>
              <input 
                name="description" required
                value={formData.description} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Ex: Café"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor (€)</label>
              <input 
                name="amount" type="number" step="0.01" required
                value={formData.amount} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* TIPO E DATA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tipo</label>
              <select 
                name="transaction_type_id" 
                value={formData.transaction_type_id} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {types.length === 0 && <option value="">A carregar...</option>}
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data</label>
              <input 
                name="date" type="date" required
                max={new Date().toISOString().split('T')[0]} // BLOQUEIO DE DATA FUTURA
                value={formData.date} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* CONTA E CATEGORIA */}
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Conta</label>
              <select 
                name="account_id" 
                value={formData.account_id} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {accounts.length === 0 && <option value="">A carregar...</option>}
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoria</label>
              <select 
                name="category_id" // CORRIGIDO: Nome do campo
                value={formData.category_id} onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">-- Nenhuma --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* CAMPOS DE INVESTIMENTO (Só aparecem se for Compra/Venda) */}
          {isInvestment && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                📈 Dados do Ativo
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Ticker</label>
                  <input 
                    name="symbol" 
                    value={formData.symbol} onChange={handleChange}
                    className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                    placeholder="AAPL"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Quantidade</label>
                  <input 
                    name="quantity" type="number" step="any"
                    value={formData.quantity} onChange={handleChange}
                    className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0.0"
                  />
                </div>
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Preço/Un. (Op)</label>
                  <input 
                    name="price_per_unit" type="number" step="0.01"
                    value={formData.price_per_unit} onChange={handleChange}
                    className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Auto"
                  />
                </div>
              </div>
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-2 italic">
                Deixa o "Preço/Un" vazio para calcular automaticamente (Total / Qtd).
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit" disabled={loading}
              className="w-full bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'A processar...' : 'Confirmar'}
            </button>

             <button 
              type="button"
              onClick={() => router.back()}
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
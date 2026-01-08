'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSmartShoppingSummary } from '@/services/api';

export default function SmartShoppingWidget() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['smart-shopping-summary', period, page],
    queryFn: () => getSmartShoppingSummary(period, page, 5), // Size 5
    retry: false
  });

  // Reset page when period changes
  const handlePeriodChange = (newPeriod: 'month' | 'year' | 'all') => {
    setPeriod(newPeriod);
    setPage(1);
  };

  // DEBUG
  useEffect(() => {
    if (data) console.log("🔍 SMART SHOPPING DATA:", data);
    if (error) console.error("❌ SMART SHOPPING ERROR:", error);
  }, [data, error]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 animate-pulse h-64 flex items-center justify-center">
        <span className="text-muted font-bold">A calcular poupanças... 🛒</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-2">⚠️</span>
        <h3 className="text-lg font-heading font-bold text-error">Erro ao carregar dados</h3>
        <p className="text-sm text-muted mt-2">Verifica a consola para mais detalhes.</p>
      </div>
    );
  }

  // Helper para texto do período
  const getPeriodLabel = () => {
    switch(period) {
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'all': return 'Todo o Histórico';
    }
  };

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-2">🛒</span>
        <h3 className="text-lg font-heading font-bold text-darkText dark:text-lightText">Sem dados de Smart Shopping</h3>
        <p className="text-sm text-muted mt-2">
          Não há registos para <b>{getPeriodLabel()}</b>.
          <br/>
          Regista despesas com <b>quantidade</b> e <b>unidade</b>.
        </p>
        <div className="mt-4 flex gap-2">
             <button 
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'all' ? 'bg-accent text-primary shadow-sm' : 'bg-secondary dark:bg-gray-700 text-muted'}`}
          >
            Ver Tudo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText flex items-center gap-2">
          🛒 Poupança Inteligente
        </h2>
        <div className="flex bg-secondary dark:bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'month' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Mês
          </button>
          <button 
            onClick={() => handlePeriodChange('year')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'year' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Ano
          </button>
          <button 
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'all' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Tudo
          </button>
        </div>
      </div>

      {/* TOTAL SAVINGS */}
      <div className="mb-6 text-center p-4 bg-accent/5 rounded-xl border border-accent/10">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Poupado ({getPeriodLabel()})</span>
        <div className={`text-3xl font-heading font-bold mt-1 tabular-nums ${data.total_savings >= 0 ? 'text-success' : 'text-error'}`}>
          {data.total_savings >= 0 ? '+' : ''}{data.total_savings.toFixed(2)} €
        </div>
      </div>

      {/* TOP ITEMS LIST (SEM SCROLL) */}
      <div className="flex-1 space-y-3">
        {data.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-secondary/50 dark:bg-gray-800/50 rounded-lg hover:bg-secondary dark:hover:bg-gray-800 transition-colors">
            <div>
              <p className="font-bold text-sm text-darkText dark:text-lightText">{item.item_name}</p>
              <p className="text-xs text-muted">{item.purchase_count} compras</p>
            </div>
            <div className={`font-bold text-sm tabular-nums ${item.total_savings >= 0 ? 'text-success' : 'text-error'}`}>
              {item.total_savings >= 0 ? '+' : ''}{item.total_savings.toFixed(2)} €
            </div>
          </div>
        ))}
      </div>

      {/* PAGINAÇÃO */}
      {/* CORRIGIDO: Optional chaining em todos os acessos */}
      {data && data.pages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary dark:border-gray-700">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="text-xs font-bold text-muted hover:text-darkText dark:hover:text-lightText disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-xs text-muted">Página {data?.page} de {data?.pages}</span>
          <button 
            onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))} 
            disabled={page === data?.pages}
            className="text-xs font-bold text-muted hover:text-darkText dark:hover:text-lightText disabled:opacity-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
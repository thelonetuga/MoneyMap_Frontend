'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSmartShoppingSummary } from '@/services/api';

export default function SmartShoppingWidget() {
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['smart-shopping-summary', period],
    queryFn: () => getSmartShoppingSummary(period),
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 animate-pulse h-64 flex items-center justify-center">
        <span className="text-muted font-bold">A calcular poupanças... 🛒</span>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-2">🛒</span>
        <h3 className="text-lg font-heading font-bold text-darkText dark:text-lightText">Sem dados de Smart Shopping</h3>
        <p className="text-sm text-muted mt-2">Regista despesas com quantidade e unidade para veres a tua poupança.</p>
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
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'month' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Mês
          </button>
          <button 
            onClick={() => setPeriod('year')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'year' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Ano
          </button>
        </div>
      </div>

      {/* TOTAL SAVINGS */}
      <div className="mb-6 text-center p-4 bg-accent/5 rounded-xl border border-accent/10">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Poupado ({period === 'month' ? 'Este Mês' : 'Este Ano'})</span>
        <div className={`text-3xl font-heading font-bold mt-1 tabular-nums ${data.total_savings >= 0 ? 'text-success' : 'text-error'}`}>
          {data.total_savings >= 0 ? '+' : ''}{data.total_savings.toFixed(2)} €
        </div>
      </div>

      {/* TOP ITEMS LIST */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
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
    </div>
  );
}
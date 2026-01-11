'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSmartShoppingSummary } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function SmartShoppingWidget() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('all');
  const [page, setPage] = useState(1);

  const isPremium = user?.role === 'admin' || user?.role === 'premium';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['smart-shopping-summary', period, page],
    queryFn: () => getSmartShoppingSummary(period, page, 5), // Size 5
    retry: false,
    enabled: !!user && isPremium // SÓ EXECUTA SE FOR PREMIUM
  });

  const handlePeriodChange = (newPeriod: 'month' | 'year' | 'all') => {
    setPeriod(newPeriod);
    setPage(1);
  };

  useEffect(() => {
    if (data) console.log("🔍 SMART SHOPPING DATA:", data);
    if (error) console.error("❌ SMART SHOPPING ERROR:", error);
  }, [data, error]);

  // Se não for premium, mostra um estado "fake" ou vazio para ficar bonito atrás do blur
  if (!isPremium) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col h-full opacity-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText flex items-center gap-2">
            🛒 Smart Savings
          </h2>
        </div>
        <div className="mb-6 text-center p-4 bg-accent/5 rounded-xl border border-accent/10">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Saved</span>
          <div className="text-3xl font-heading font-bold mt-1 text-success">+124.50 €</div>
        </div>
        <div className="flex-1 space-y-3">
           <div className="flex justify-between items-center p-3 bg-secondary/50 dark:bg-gray-800/50 rounded-lg">
              <div><p className="font-bold text-sm">Coffee Beans</p><p className="text-xs text-muted">12 purchases</p></div>
              <div className="font-bold text-sm text-success">+15.20 €</div>
           </div>
           <div className="flex justify-between items-center p-3 bg-secondary/50 dark:bg-gray-800/50 rounded-lg">
              <div><p className="font-bold text-sm">Olive Oil</p><p className="text-xs text-muted">4 purchases</p></div>
              <div className="font-bold text-sm text-success">+8.40 €</div>
           </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 animate-pulse h-64 flex items-center justify-center">
        <span className="text-muted font-bold">Calculating savings... 🛒</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-2">⚠️</span>
        <h3 className="text-lg font-heading font-bold text-error">Error loading data</h3>
        <p className="text-sm text-muted mt-2">Check console for details.</p>
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch(period) {
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
    }
  };

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center">
        <span className="text-4xl mb-2">🛒</span>
        <h3 className="text-lg font-heading font-bold text-darkText dark:text-lightText">No Smart Shopping Data</h3>
        <p className="text-sm text-muted mt-2">
          No records for <b>{getPeriodLabel()}</b>.
          <br/>
          Register expenses with <b>quantity</b> and <b>unit</b>.
        </p>
        <div className="mt-4 flex gap-2">
             <button 
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'all' ? 'bg-accent text-primary shadow-sm' : 'bg-secondary dark:bg-gray-700 text-muted'}`}
          >
            View All
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-primary p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText flex items-center gap-2">
          🛒 Smart Savings
        </h2>
        <div className="flex bg-secondary dark:bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'month' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Month
          </button>
          <button 
            onClick={() => handlePeriodChange('year')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'year' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Year
          </button>
          <button 
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === 'all' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            All
          </button>
        </div>
      </div>

      {/* TOTAL SAVINGS */}
      <div className="mb-6 text-center p-4 bg-accent/5 rounded-xl border border-accent/10">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Saved ({getPeriodLabel()})</span>
        <div className={`text-3xl font-heading font-bold mt-1 tabular-nums ${data.total_savings >= 0 ? 'text-success' : 'text-error'}`}>
          {data.total_savings >= 0 ? '+' : ''}{data.total_savings.toFixed(2)} €
        </div>
      </div>

      {/* TOP ITEMS LIST */}
      <div className="flex-1 space-y-3">
        {data.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-secondary/50 dark:bg-gray-800/50 rounded-lg hover:bg-secondary dark:hover:bg-gray-800 transition-colors">
            <div>
              <p className="font-bold text-sm text-darkText dark:text-lightText">{item.item_name}</p>
              <p className="text-xs text-muted">{item.purchase_count} purchases</p>
            </div>
            <div className={`font-bold text-sm tabular-nums ${item.total_savings >= 0 ? 'text-success' : 'text-error'}`}>
              {item.total_savings >= 0 ? '+' : ''}{item.total_savings.toFixed(2)} €
            </div>
          </div>
        ))}
      </div>

      {/* PAGINAÇÃO */}
      {data && data.pages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary dark:border-gray-700">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="text-xs font-bold text-muted hover:text-darkText dark:hover:text-lightText disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted">Page {data?.page} of {data?.pages}</span>
          <button 
            onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))} 
            disabled={page === data?.pages}
            className="text-xs font-bold text-muted hover:text-darkText dark:hover:text-lightText disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
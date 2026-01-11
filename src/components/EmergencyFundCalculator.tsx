'use client';

import { useState, useEffect } from 'react';
import { calculateEmergencyFund, getCategories } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyFundCalculator() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isPremium = user?.role === 'admin' || user?.role === 'premium';

  // Load Categories
  useEffect(() => {
    getCategories()
      .then(data => setCategories(data))
      .catch(err => console.error("Error loading categories", err));
  }, []);

  // Handlers
  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCalculate = async () => {
    if (!isPremium) {
      // Simular resultado fake para o blur
      setResult({
        monthly_essential_expenses: 1250.50,
        total_target: 7503.00,
        months_covered: months,
        considered_history_months: 6
      });
      return;
    }

    if (selectedCategories.length === 0) {
      showNotification('warning', 'Please select at least one category.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await calculateEmergencyFund({
        category_ids: selectedCategories,
        months_to_cover: months
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        showNotification('error', 'This feature is for Premium users only.');
      } else {
        showNotification('error', 'Failed to calculate emergency fund.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* LEFT: CONFIGURATION */}
      <div className="lg:col-span-1 space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-800 h-fit">
        
        {/* 1. Categories */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase mb-3">1. Essential Categories</h3>
          <p className="text-xs text-gray-500 mb-4">Select categories essential for survival (e.g., Rent, Food, Utilities).</p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-5 h-5 text-accent rounded focus:ring-accent"
                />
                <span className="text-sm font-medium text-darkText dark:text-lightText">{cat.name}</span>
              </label>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted italic">No categories found.</p>}
          </div>
        </div>

        {/* 2. Months */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase mb-3">2. Coverage Period</h3>
          <div className="grid grid-cols-3 gap-2">
            {[3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  months === m 
                    ? 'bg-accent text-primary shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Target'}
        </button>

      </div>

      {/* RIGHT: RESULTS */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* RESULT CARDS */}
        {result ? (
          <div className="space-y-6 animate-slide-up">
            
            {/* MAIN TARGET */}
            <div className="bg-gradient-to-br from-accent to-blue-600 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <p className="text-sm font-bold uppercase opacity-80 mb-2">🎯 Total Emergency Fund Goal</p>
              <h2 className="text-5xl md:text-6xl font-heading font-bold mb-4">
                {result.total_target.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </h2>
              <p className="text-sm opacity-90 bg-white/20 inline-block px-4 py-1 rounded-full">
                Covers {result.months_covered} months of essential expenses
              </p>
            </div>

            {/* DETAILS */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-700">
                <p className="text-xs font-bold uppercase text-muted mb-1">📅 Monthly Essential Cost</p>
                <p className="text-2xl font-heading font-bold text-darkText dark:text-lightText">
                  {result.monthly_essential_expenses.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-gray-400 mt-2">Based on your average spending in selected categories.</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">ℹ️</span>
                  <p className="text-sm font-medium text-darkText dark:text-lightText">Analysis Insight</p>
                </div>
                <p className="text-xs text-muted">
                  We analyzed your last <b>{result.considered_history_months} months</b> of history to calculate this average. 
                  {result.monthly_essential_expenses === 0 && (
                    <span className="text-error block mt-1 font-bold">Warning: No expenses found in selected categories.</span>
                  )}
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-4">🚨</div>
            <h3 className="text-lg font-bold text-darkText dark:text-lightText mb-2">Why an Emergency Fund?</h3>
            <p className="text-muted max-w-md">
              Life is unpredictable. Financial experts recommend saving 3-6 months of essential living expenses to cover unexpected events like job loss or medical emergencies.
            </p>
            <p className="text-sm text-accent font-bold mt-4">Select your essential categories to start.</p>
          </div>
        )}

      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CompoundInterestCalculator from '@/components/CompoundInterestCalculator';
import EmergencyFundCalculator from '@/components/EmergencyFundCalculator';
import PremiumLock from '@/components/PremiumLock';

export default function CalculatorPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'compound' | 'emergency'>('compound');

  // Se estiver a carregar ou não houver user, mostra loading
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-primary text-muted">
        Loading...
      </div>
    );
  }

  const isPremium = user.role === 'admin' || user.role === 'premium';
  const tabClass = (tab: string) => `px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'bg-accent text-primary shadow-lg shadow-accent/20' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`;

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-4 md:p-8 transition-colors duration-300 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-darkText dark:text-lightText">Financial Tools 🛠️</h1>
          <p className="text-muted">Powerful calculators to plan your future.</p>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('compound')} className={tabClass('compound')}>
            <span>🧮</span> Compound Interest
          </button>
          <button onClick={() => setActiveTab('emergency')} className={tabClass('emergency')}>
            <span>🚨</span> Emergency Fund
          </button>
        </div>

        {/* CONTENT WITH LOCK */}
        <PremiumLock isLocked={!isPremium}>
          {activeTab === 'compound' ? (
            <CompoundInterestCalculator />
          ) : (
            <EmergencyFundCalculator />
          )}
        </PremiumLock>

      </div>
    </main>
  );
}
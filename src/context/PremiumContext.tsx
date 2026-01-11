'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  openPremiumModal: (featureName?: string) => void;
  closePremiumModal: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState('This feature');
  const { user } = useAuth();

  const openPremiumModal = (featureName: string = 'This feature') => {
    // Se já for premium, não faz nada (segurança extra)
    if (user?.role === 'admin' || user?.role === 'premium') return;
    
    setFeature(featureName);
    setIsOpen(true);
  };

  const closePremiumModal = () => setIsOpen(false);

  return (
    <PremiumContext.Provider value={{ openPremiumModal, closePremiumModal }}>
      {children}

      {/* GLOBAL PREMIUM MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-accent/20 transform transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={closePremiumModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-3xl animate-bounce-slow">
                👑
              </div>
              
              <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                Unlock {feature}
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                This is a <b>Premium</b> feature. Upgrade your plan to access advanced tools like Recurring Transactions, Smart Analysis, and Unlimited Tags.
              </p>
              
              <div className="space-y-3">
                <button disabled className="w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg shadow-glow cursor-not-allowed opacity-80">
                  Upgrade Now (Soon)
                </button>
                <button 
                  onClick={closePremiumModal}
                  className="w-full py-3 rounded-xl text-muted font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PremiumContext.Provider>
  );
};
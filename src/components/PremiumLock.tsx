'use client';

import { usePremium } from '@/context/PremiumContext';

interface PremiumLockProps {
  isLocked: boolean;
  children: React.ReactNode;
  featureName?: string;
  minimal?: boolean; // Mantido para compatibilidade, mas agora o comportamento é uniforme
}

export default function PremiumLock({ isLocked, children, featureName = 'Premium Feature' }: PremiumLockProps) {
  const { openPremiumModal } = usePremium();

  if (!isLocked) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPremiumModal(featureName);
  };

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      {/* CONTEÚDO (Ligeiramente opaco para indicar inativo) */}
      <div className="opacity-60 pointer-events-none select-none transition-opacity group-hover:opacity-40">
        {children}
      </div>

      {/* ÍCONE DE CADEADO (Overlay subtil) */}
      <div className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 p-1.5 rounded-full shadow-sm backdrop-blur-sm">
        <span className="text-xs">🔒</span>
      </div>
      
      {/* Overlay invisível para capturar o clique em toda a área */}
      <div className="absolute inset-0 z-20"></div>
    </div>
  );
}
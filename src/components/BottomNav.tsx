'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Esconder em páginas de auth ou se não estiver logado
  if (loading || !user || ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      active 
        ? 'text-accent' 
        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
    }`;

  const canAccessPremium = user?.role === 'admin' || user?.role === 'premium';

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 md:hidden pb-safe">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        
        {/* 1. DASHBOARD */}
        <Link href="/" className={navItemClass(isActive('/'))}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px]">Dashboard</span>
        </Link>

        {/* 2. TRANSAÇÕES */}
        <Link href="/transactions" className={navItemClass(isActive('/transactions'))}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span className="text-[10px]">Transactions</span>
        </Link>

        {/* 3. ADICIONAR (CENTRAL) */}
        <div className="flex items-center justify-center -mt-6">
          <Link 
            href="/add" 
            className="flex items-center justify-center w-14 h-14 bg-accent text-primary rounded-full shadow-lg shadow-accent/30 hover:scale-105 transition-transform"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </Link>
        </div>

        {/* 4. CALCULADORA (Premium) ou DEFINIÇÕES */}
        {canAccessPremium ? (
          <Link href="/calculator" className={navItemClass(isActive('/calculator'))}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <span className="text-[10px]">Calc</span>
          </Link>
        ) : (
          <Link href="/settings" className={navItemClass(isActive('/settings'))}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             <span className="text-[10px]">Settings</span>
          </Link>
        )}

        {/* 5. PERFIL ou DEFINIÇÕES (Se Calc estiver ativo) */}
        {canAccessPremium ? (
           <Link href="/settings" className={navItemClass(isActive('/settings'))}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[10px]">Settings</span>
           </Link>
        ) : (
           <Link href="/profile" className={navItemClass(isActive('/profile'))}>
              <div className="flex flex-col items-center justify-center w-full h-full space-y-1">
                <div className={`w-6 h-6 rounded-full overflow-hidden border ${isActive('/profile') ? 'border-accent' : 'border-gray-300 dark:border-gray-600'}`}>
                  {user?.profile?.avatar_url ? (
                    <img src={`http://127.0.0.1:8000${user.profile.avatar_url}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px]">👤</div>
                  )}
                </div>
                <span className="text-[10px]">Profile</span>
             </div>
           </Link>
        )}

      </div>
    </div>
  );
}
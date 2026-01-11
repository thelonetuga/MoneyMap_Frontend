'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se não houver user, não mostra a sidebar (ou mostra versão simplificada)
  if (!user) return null;

  const links = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Transactions', href: '/transactions', icon: '💸' },
    { name: 'Calculator', href: '/calculator', icon: '🧮' }, // Sempre visível
    { name: 'Settings', href: '/settings', icon: '⚙️' },
    ...(user?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: '🛡️' }] : []),
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-primary border-r border-secondary dark:border-gray-800 transition-colors duration-300 z-40">
      
      {/* LOGO */}
      <div className="p-6 border-b border-secondary dark:border-gray-800">
        <Link href="/" className="text-2xl font-heading font-bold text-accent flex items-center gap-2 tracking-tight">
          🌍 MoneyMap
        </Link>
      </div>

      {/* ACTION BUTTON */}
      <div className="p-6 pb-2">
        <Link
          href="/add"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-primary font-bold shadow-glow transition-transform active:scale-95"
        >
          <span className="text-lg">+</span> New Transaction
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              isActive(link.href)
                ? 'bg-accent/10 text-accent shadow-sm'
                : 'text-muted hover:bg-secondary dark:hover:bg-gray-800 hover:text-darkText dark:hover:text-lightText'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            {link.name}
          </Link>
        ))}
      </nav>

      {/* FOOTER (Theme + Profile) */}
      <div className="p-4 border-t border-secondary dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        
        {/* THEME TOGGLE */}
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-xs font-bold text-muted uppercase">Appearance</span>
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-muted hover:text-accent transition-colors"
            >
              {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          )}
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer group">
          <Link href="/profile" className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold border border-accent/30">
              {user.profile?.first_name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-darkText dark:text-lightText truncate">
                {user.profile?.first_name || 'User'}
              </p>
              <p className="text-[10px] text-muted truncate">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-2 text-muted hover:text-error transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
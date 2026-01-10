"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Links styling...
  const linkStyle = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-heading font-semibold transition-colors ${
      pathname === path
        ? "bg-accent/10 text-accent" // Ativo
        : "text-muted hover:bg-secondary/50 dark:hover:bg-secondary/10 hover:text-darkText dark:hover:text-lightText" // Inativo
    }`;

  // Esconder navbar em páginas de auth dedicadas (opcional, mas mantemos para limpeza)
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) return null;

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'premium': return 'Premium';
      default: return 'Basic';
    }
  };

  const getRoleColor = (role?: string) => {
    switch(role) {
      case 'admin': return 'text-purple-500';
      case 'premium': return 'text-yellow-500';
      default: return 'text-muted';
    }
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <nav className="bg-white dark:bg-primary border-b border-secondary dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300 shadow-soft">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          
          {/* LOGO (Sempre visível) */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-heading font-bold text-accent flex items-center gap-2 tracking-tight"
            >
              🌍 MoneyMap
            </Link>
          </div>

          {/* MENU CENTRAL (Apenas para Utilizadores Logados) */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className={linkStyle("/")}>
                Dashboard
              </Link>
              <Link href="/transactions" className={linkStyle("/transactions")}>
                Transactions
              </Link>
              <Link href="/settings" className={linkStyle("/settings")}>
                Settings ⚙️
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={
                    linkStyle("/admin") +
                    " text-purple-500 bg-purple-50/20 hover:bg-purple-50/30"
                  }
                >
                  Admin 🛡️
                </Link>
              )}
            </div>
          )}

          {/* LADO DIREITO */}
          <div className="flex items-center gap-4">
            
            {/* THEME TOGGLE (Sempre visível) */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors"
                title={resolvedTheme === "dark" ? "Switch to Light" : "Switch to Dark"}
              >
                {resolvedTheme === "dark" ? "☀️" : "🌙"}
              </button>
            )}

            {/* ESTADO: NÃO LOGADO */}
            {!loading && !user && (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-bold text-muted hover:text-darkText dark:hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-primary text-sm font-bold transition-all shadow-glow">
                  Get Started
                </Link>
              </div>
            )}

            {/* ESTADO: LOGADO */}
            {user && (
              <>
                {/* BOTÃO NOVA TRANSAÇÃO */}
                <Link
                  href="/add"
                  className={`hidden md:flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-heading font-semibold text-primary bg-accent hover:bg-accent/90 transition-transform active:scale-95 shadow-glow`}
                >
                  <span>+</span>
                  <span className="hidden sm:inline">New</span>
                </Link>

                <div className="h-6 w-px bg-secondary dark:bg-gray-700 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  
                  {/* LINK PARA PERFIL */}
                  <Link href="/profile" className="text-right hidden sm:flex flex-col items-end justify-center hover:opacity-80 transition-opacity cursor-pointer">
                    <p className="text-sm font-heading font-semibold text-darkText dark:text-lightText leading-tight">
                      {user?.profile?.first_name || user?.email?.split('@')[0]}
                    </p>
                    <p className={`text-[10px] font-sans font-medium uppercase tracking-wider ${getRoleColor(user?.role || undefined)}`}>
                      {getRoleLabel(user?.role || undefined)}
                    </p>
                  </Link>

                  {/* ÍCONE PERFIL MOBILE */}
                  <Link href="/profile" className="sm:hidden p-2 rounded-lg text-muted hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                    title="Logout"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
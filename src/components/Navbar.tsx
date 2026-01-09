"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { setTheme, resolvedTheme } = useTheme(); // CORRIGIDO: Removido 'theme' não usado
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

  if (["/login", "/register"].includes(pathname)) return null;

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'premium': return 'Premium';
      default: return 'Básico';
    }
  };

  const getRoleColor = (role?: string) => {
    switch(role) {
      case 'admin': return 'text-purple-500';
      case 'premium': return 'text-yellow-500';
      default: return 'text-muted';
    }
  };

  // Toggle function
  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const canToggleTheme = user?.role === 'admin' || user?.role === 'premium';

  return (
    <nav className="bg-white dark:bg-primary border-b border-secondary dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300 shadow-soft">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-heading font-bold text-accent flex items-center gap-2 tracking-tight"
            >
              🌍 MoneyMap
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className={linkStyle("/")}>
              Dashboard
            </Link>
            <Link href="/transactions" className={linkStyle("/transactions")}>
              Transações
            </Link>
            <Link href="/settings" className={linkStyle("/settings")}>
              Definições ⚙️
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

          <div className="flex items-center gap-4">
            {/* THEME TOGGLE (Disponível para todos) */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors"
                title={resolvedTheme === "dark" ? "Mudar para Claro" : "Mudar para Escuro"}
              >
                {resolvedTheme === "dark" ? "☀️" : "🌙"}
              </button>
            )}

            {/* BOTÃO NOVA TRANSAÇÃO */}
            <Link
              href="/add"
              className={`hidden md:flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-heading font-semibold text-primary bg-accent hover:bg-accent/90 transition-transform active:scale-95 shadow-glow`}
            >
              <span>+</span>
              <span className="hidden sm:inline">Nova</span>
            </Link>

            <div className="h-6 w-px bg-secondary dark:bg-gray-700 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              
              {/* LINK PARA PERFIL (NOME E CARGO) */}
              <Link href="/profile" className="text-right hidden sm:flex flex-col items-end justify-center hover:opacity-80 transition-opacity cursor-pointer">
                <p className="text-sm font-heading font-semibold text-darkText dark:text-lightText leading-tight">
                  {loading ? "..." : user?.profile?.first_name || user?.email?.split('@')[0]}
                </p>
                <p className={`text-[10px] font-sans font-medium uppercase tracking-wider ${getRoleColor(user?.role || undefined)}`}>
                  {getRoleLabel(user?.role || undefined)}
                </p>
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
                title="Sair"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
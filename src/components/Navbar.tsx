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

  // Esconder navbar em páginas de auth dedicadas
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) return null;

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
              <div className="flex items-center gap-3">
                
                {/* BOTÃO "GO TO APP" (Visível em Desktop se estiver na Landing Page ou fora do layout principal) */}
                <div className="hidden md:block">
                    <Link 
                        href="/" 
                        className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-bold hover:bg-accent/20 transition-colors"
                    >
                        Go to App 🚀
                    </Link>
                </div>

                {/* ÍCONE PERFIL MOBILE */}
                <div className="md:hidden flex items-center gap-3">
                    <Link href="/profile" className="p-2 rounded-lg text-muted hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
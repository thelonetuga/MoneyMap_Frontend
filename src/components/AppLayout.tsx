'use client';

import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Enquanto carrega, mostra apenas o children (que pode ser um loading state)
  if (loading) return <>{children}</>;

  // Se não estiver logado, mostra layout simples (Navbar + Content)
  // A Navbar já lida com esconder-se em /login e /register
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen">
          {children}
        </div>
      </>
    );
  }

  // LAYOUT LOGADO (Dashboard)
  return (
    <div className="flex min-h-screen bg-secondary dark:bg-primary transition-colors duration-300">
      
      {/* SIDEBAR (Desktop Only) */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* MOBILE NAVBAR (Apenas Mobile) */}
        <div className="md:hidden">
          <Navbar />
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 pb-24 md:pb-8">
          {children}
        </main>

        {/* BOTTOM NAV (Mobile Only) */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
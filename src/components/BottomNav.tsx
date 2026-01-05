"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  if (["/login", "/register"].includes(pathname)) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-primary border-t border-secondary dark:border-gray-800 pb-safe z-50 transition-colors duration-300">
      <div className="flex justify-around items-center h-16 px-2">
        
        {/* DASHBOARD */}
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-accent' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
          </svg>
          <span className="text-[10px] font-medium font-sans">Início</span>
        </Link>

        {/* TRANSAÇÕES */}
        <Link href="/transactions" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/transactions') ? 'text-accent' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-medium font-sans">Extrato</span>
        </Link>

        {/* ADICIONAR (FAB) */}
        <div className="relative -top-5">
          <Link href="/add" className="flex items-center justify-center w-14 h-14 bg-accent rounded-full text-primary shadow-glow hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* DEFINIÇÕES */}
        <Link href="/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/settings') ? 'text-accent' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.389c-.42.18-.813.411-1.18.682l-1.302-.64a1.875 1.875 0 00-2.273.72l-1.648 2.857a1.875 1.875 0 00.658 2.43l1.163.648a8.725 8.725 0 000 1.828l-1.163.648a1.875 1.875 0 00-.658 2.43l1.647 2.857c.484.835 1.528 1.117 2.273.72l1.302-.64c.367.27.76.501 1.18.682l.178 1.572A1.875 1.875 0 0011.077 21.75h1.846c.917 0 1.699-.663 1.85-1.567l.178-1.572c.42-.18.813-.411 1.18-.682l1.302.64a1.875 1.875 0 002.273-.72l1.648-2.857a1.875 1.875 0 00-.658-2.43l-1.163-.648a8.725 8.725 0 000-1.828l1.163-.648a1.875 1.875 0 00.658-2.43l-1.647-2.857a1.875 1.875 0 00-2.273-.72l-1.302.64c-.367-.27-.76-.501-1.18-.682l-.178-1.572a1.875 1.875 0 00-1.85-1.567h-1.846zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-medium font-sans">Definições</span>
        </Link>

      </div>
    </div>
  );
}
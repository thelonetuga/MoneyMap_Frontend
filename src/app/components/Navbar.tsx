'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Função auxiliar para estilizar o link ativo
  const linkStyle = (path: string) => 
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path 
        ? 'bg-blue-100 text-blue-700' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          
          {/* Logo / Nome */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
              🌍 MoneyMap
            </Link>
          </div>

          {/* Links de Navegação */}
          <div className="flex items-center space-x-2">
            <Link href="/" className={linkStyle('/')}>
              Dashboard
            </Link>
            
            <Link href="/transactions" className={linkStyle('/transactions')}>
              Histórico
            </Link>
            
            <Link href="/add" className={`ml-4 px-4 py-2 rounded-lg text-sm font-bold text-white transition-transform active:scale-95 ${
               pathname === '/add' ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}>
              + Nova Transação
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
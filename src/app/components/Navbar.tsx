'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  // --- 1. HOOKS (Sempre no topo, antes de qualquer return) ---
  useEffect(() => {
    // Verificação de segurança dentro do Hook
    // Se estivermos no login, não vale a pena fazer fetch, mas o Hook TEM de existir
    if (['/login', '/register'].includes(pathname)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://127.0.0.1:8000/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Falha auth');
        return res.json();
      })
      .then(data => {
        setUserName(data.profile?.first_name || 'Utilizador');
      })
      .catch(() => {
        // Se o token for inválido, podemos limpar
        // setUserName(null); 
      });
  }, [pathname]); // Adicionei pathname para re-verificar ao mudar de página

  // --- 2. FUNÇÕES AUXILIARES ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const linkStyle = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === path
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  // --- 3. CONDITIONAL RENDERING (O "Early Return" fica AQUI) ---
  // Só agora, depois de todos os hooks, é que podemos decidir não mostrar nada
  if (['/login', '/register'].includes(pathname)) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">

          {/* Logo / Nome */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2 tracking-tight">
              🌍 MoneyMap
            </Link>
          </div>

          {/* Links Centrais */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className={linkStyle('/')}>
              Dashboard
            </Link>

            <Link href="/transactions" className={linkStyle('/transactions')}>
              Histórico
            </Link>

            <Link href="/settings" className={linkStyle('/settings')}>
              Definições ⚙️
            </Link>
          </div>

          {/* Área da Direita: Botão Ação + Perfil */}
          <div className="flex items-center gap-4">

            {/* Botão Nova Transação */}
            <Link href="/add" className={`hidden sm:block px-4 py-2 rounded-lg text-sm font-bold text-white transition-transform active:scale-95 shadow-sm ${pathname === '/add' ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              + Nova Transação
            </Link>

            {/* Separador Vertical */}
            <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            {/* Área de Utilizador */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 font-medium uppercase">Olá,</p>
                <p className="text-sm font-bold text-gray-700 leading-none">{userName || '...'}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                title="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
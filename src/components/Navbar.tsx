"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// 1. IMPORTAR O HOOK
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  // 2. USAR O HOOK (Substitui todo aquele useEffect e fetch manual)
  const { user, logout, loading } = useAuth();

  // Links styling...
  const linkStyle = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  if (["/login", "/register"].includes(pathname)) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-blue-600 flex items-center gap-2 tracking-tight"
            >
              🌍 MoneyMap
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className={linkStyle("/")}>
              Dashboard
            </Link>
            <Link href="/transactions" className={linkStyle("/transactions")}>
              Histórico
            </Link>
            <Link href="/settings" className={linkStyle("/settings")}>
              Definições ⚙️
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={
                  linkStyle("/admin") +
                  " text-purple-600 bg-purple-50 hover:bg-purple-100"
                }
              >
                Admin 🛡️
              </Link>
            )}

            {/* LINK PREMIUM: SÓ APARECE SE TIVERES O ROLE CERTO */}
            {(user?.role === "premium" || user?.role === "admin") && (
              <Link
                href="/imports"
                className="text-amber-600 font-bold px-4 py-2 text-sm"
              >
                Importar ⭐
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/add"
              className={`hidden sm:block px-4 py-2 rounded-lg text-sm font-bold text-white transition-transform active:scale-95 shadow-sm ${
                pathname === "/add"
                  ? "bg-blue-800"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              + Nova Transação
            </Link>

            <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              {/* MOSTRAR AVATAR SE EXISTIR */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 relative">
                {user?.profile?.avatar_url ? (
                  <img
                    src={`http://127.0.0.1:8000${user.profile.avatar_url}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    👤
                  </div>
                )}
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 font-medium uppercase">
                  {user?.role === "premium" ? "Premium 🌟" : "Básico"}
                </p>
                <p className="text-sm font-bold text-gray-700 leading-none">
                  {loading ? "..." : user?.profile?.first_name || user?.email}
                </p>
              </div>

              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
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

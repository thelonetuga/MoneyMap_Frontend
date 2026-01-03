import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav"; // IMPORTADO
import { AuthProvider } from "../context/AuthContext";
import ReactQueryProvider from "../lib/react-query";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoneyMap",
  description: "Gestão Financeira Pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
              <Navbar />
              <div className="pb-20 md:pb-0"> {/* Padding para não esconder conteúdo atrás da BottomNav */}
                {children}
              </div>
              <BottomNav />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
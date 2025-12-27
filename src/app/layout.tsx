import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // <--- Importar a Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoneyMap",
  description: "O seu gestor financeiro pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {/* A Navbar fica aqui, fora do 'children' */}
        <Navbar />
        
        {/* O conteúdo das páginas (page.tsx) é injetado aqui */}
        {children}
      </body>
    </html>
  );
}
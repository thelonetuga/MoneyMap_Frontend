import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. IMPORTAR A NAVBAR
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finance App",
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

        {/* 2. ADICIONAR AQUI, ANTES DOS CHILDREN */}
        <Navbar />

        {children}
      </body>
    </html>
  );
}
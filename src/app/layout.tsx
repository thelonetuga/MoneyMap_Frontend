import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

// 1. IMPORTAR AQUI
import { AuthProvider } from "../context/AuthContext"; 

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
        {/* 2. ENVOLVER TUDO (Navbar e Children) COM O PROVIDER */}
        <AuthProvider>
            <Navbar />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}
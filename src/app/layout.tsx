import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { AuthProvider } from "../context/AuthContext";
import ReactQueryProvider from "../lib/react-query";
import { ThemeProvider } from "../components/ThemeProvider";

// Configuração das Fontes
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-jakarta",
  weight: ["600", "700"],
  display: "swap",
});

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
    <html lang="pt" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-secondary dark:bg-primary text-darkText dark:text-lightText transition-colors duration-300`}>
        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <Navbar />
              <div className="pb-20 md:pb-0 min-h-screen">
                {children}
              </div>
              <BottomNav />
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
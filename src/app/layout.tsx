import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PremiumProvider } from "@/context/PremiumContext";
import ReactQueryProvider from "@/lib/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppLayout from "@/components/AppLayout";

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
      <head>
        <title>MoneyMap</title>
        <Script src="/env-config.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-secondary dark:bg-primary text-darkText dark:text-lightText transition-colors duration-300`}>
        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              <NotificationProvider>
                <PremiumProvider>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </PremiumProvider>
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
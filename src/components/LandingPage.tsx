'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-accent uppercase tracking-wider animate-fade-in">
            🚀 The Ultimate Finance Tracker
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-darkText dark:text-white mb-6 leading-tight animate-slide-up">
            Master Your Money <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">Build Your Future.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto animate-slide-up delay-100">
            Track expenses, plan investments, and simulate your financial freedom with powerful tools designed for modern life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-200">
            <Link href="/register" className="px-8 py-4 rounded-xl bg-accent hover:bg-accent/90 text-primary font-bold text-lg shadow-glow transition-all transform hover:scale-105">
              Start for Free
            </Link>
            <Link href="/login" className="px-8 py-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-darkText dark:text-white font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-6 bg-secondary/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-darkText dark:text-white mb-4">Everything you need</h2>
            <p className="text-gray-500 dark:text-gray-400">From daily tracking to long-term planning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Advanced Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400">Visualize your net worth evolution, spending habits, and investment growth with interactive charts.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🛒</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Smart Shopping</h3>
              <p className="text-gray-500 dark:text-gray-400">Track unit prices (kg/L) automatically to find the best deals and save on groceries.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🧮</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Financial Calculators</h3>
              <p className="text-gray-500 dark:text-gray-400">Simulate compound interest and calculate your emergency fund needs with precision.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🏷️</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Tags & Categories</h3>
              <p className="text-gray-500 dark:text-gray-400">Organize with unlimited subcategories and cross-functional tags for granular control.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Multi-Currency</h3>
              <p className="text-gray-500 dark:text-gray-400">Native support for EUR, USD, GBP, and BRL. Your money, your currency.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🔄</div>
              <h3 className="text-xl font-bold text-darkText dark:text-white mb-3">Automation</h3>
              <p className="text-gray-500 dark:text-gray-400">Set up recurring transactions and auto-categorization rules to save time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-darkText dark:text-white mb-4">Simple Pricing</h2>
            <p className="text-gray-500 dark:text-gray-400">Start for free, upgrade for power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE */}
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col">
              <h3 className="text-2xl font-bold text-darkText dark:text-white mb-2">Basic</h3>
              <div className="text-4xl font-bold text-darkText dark:text-white mb-6">€0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 text-gray-600 dark:text-gray-300 flex-1">
                <li className="flex items-center gap-2">✓ Unlimited Transactions</li>
                <li className="flex items-center gap-2">✓ Basic Analytics</li>
                <li className="flex items-center gap-2">✓ 5 Accounts</li>
                <li className="flex items-center gap-2">✓ Dark Mode</li>
                <li className="flex items-center gap-2">✓ Multi-Currency</li>
              </ul>
              <Link href="/register" className="block w-full py-3 rounded-xl bg-secondary dark:bg-gray-700 text-darkText dark:text-white font-bold text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Join Free
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="p-8 rounded-3xl bg-primary border border-accent/30 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-bl-xl">SOON</div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-6">€3.99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 text-gray-300 flex-1">
                <li className="flex items-center gap-2 text-white"><span className="text-accent">✓</span> Everything in Basic</li>
                <li className="flex items-center gap-2 text-white"><span className="text-accent">✓</span> Financial Calculators 🧮</li>
                <li className="flex items-center gap-2 text-white"><span className="text-accent">✓</span> Smart Shopping Analysis 🛒</li>
                <li className="flex items-center gap-2 text-white"><span className="text-accent">✓</span> Recurring Transactions 🔄</li>
                <li className="flex items-center gap-2 text-white"><span className="text-accent">✓</span> Unlimited Accounts & Tags 🏷️</li>
              </ul>
              <button disabled className="block w-full py-3 rounded-xl bg-gray-700 text-gray-400 font-bold text-center cursor-not-allowed border border-gray-600">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-500 dark:text-gray-600 text-sm border-t border-gray-100 dark:border-gray-800">
        <p>© {new Date().getFullYear()} MoneyMap. All rights reserved.</p>
      </footer>
    </div>
  );
}
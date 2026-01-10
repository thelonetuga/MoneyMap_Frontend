'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getPortfolio, getHistory, getSpending, updateManualPrice } from '@/services/api'; 
import EvolutionChart from '../components/EvolutionChart';
import SmartShoppingWidget from '../components/SmartShoppingWidget';
import LandingPage from '../components/LandingPage';
import { PortfolioPosition } from '@/types/models'; 
import { useAuth } from '@/context/AuthContext';

// Cores: Investimentos (Azuis) vs Despesas (Laranjas/Vermelhos)
const COLORS_INVEST = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const COLORS_SPEND = ['#FF8042', '#FFBB28', '#FF6B6B', '#D94848', '#993333'];

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30d');
  
  // Estado para edição manual de preços
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Verificar autenticação (simples)
  useEffect(() => {
    // Removido redirecionamento forçado para suportar Landing Page
  }, [router]);

  // --- QUERIES (TanStack Query) ---
  
  const { data: portfolio, isLoading: loadingPortfolio, isError: errorPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    enabled: !!user, // Só faz o fetch se houver user
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['history', timeRange],
    queryFn: () => getHistory(timeRange),
    enabled: !!user,
  });

  const { data: spending, isLoading: loadingSpending } = useQuery({
    queryKey: ['spending', timeRange],
    queryFn: () => getSpending(timeRange),
    enabled: !!user,
  });

  // --- LÓGICA DE RENDERIZAÇÃO CONDICIONAL ---
  if (!authLoading && !user) {
    return <LandingPage />;
  }

  // --- FUNÇÃO PARA SALVAR PREÇO MANUAL ---
  const handleSavePrice = async (symbol: string) => {
    if (!editPrice || isNaN(Number(editPrice))) return;
    
    setSavingPrice(true);
    try {
      await updateManualPrice(symbol, Number(editPrice));
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['evolution'] });
      setEditingSymbol(null);
      setEditPrice('');
    } catch (error) {
      console.error("Error saving price:", error);
      alert("Error updating price. Please try again.");
    } finally {
      setSavingPrice(false);
    }
  };

  const startEditing = (symbol: string, currentPrice: number) => {
    setEditingSymbol(symbol);
    setEditPrice(String(currentPrice));
  };

  // Loading State Global
  if (authLoading || (user && loadingPortfolio)) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary dark:bg-primary text-muted font-heading font-bold animate-pulse">
        Loading your empire... 🏰
      </div>
    );
  }

  // Se der erro no portfolio
  if (user && (errorPortfolio || !portfolio)) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary dark:bg-primary text-error font-heading font-bold">
        Error loading data. Please try logging in again.
      </div>
    );
  }

  // --- AGREGAÇÃO DE POSIÇÕES (CORRIGIDO) ---
  const positions = portfolio?.positions || [];
  const aggregatedPositionsMap = positions.reduce((acc, pos) => {
    if (!acc[pos.symbol]) {
      acc[pos.symbol] = { ...pos };
    } else {
      const existing = acc[pos.symbol];
      const totalCostExisting = existing.quantity * existing.avg_buy_price;
      const totalCostNew = pos.quantity * pos.avg_buy_price;
      
      existing.quantity += pos.quantity;
      existing.total_value += pos.total_value;
      existing.profit_loss += pos.profit_loss;
      
      if (existing.quantity > 0) {
        existing.avg_buy_price = (totalCostExisting + totalCostNew) / existing.quantity;
      }
    }
    return acc;
  }, {} as Record<string, PortfolioPosition>);

  const aggregatedPositions = Object.values(aggregatedPositionsMap);

  const chartInvest = aggregatedPositions.map(pos => ({ name: pos.symbol, value: pos.total_value }));
  const totalSpending = spending ? spending.reduce((acc: number, item: any) => acc + item.value, 0) : 0;
  const calculatedTotalInvested = aggregatedPositions.reduce((acc: number, pos: PortfolioPosition) => acc + pos.total_value, 0);
  const calculatedNetWorth = (portfolio?.total_cash ?? 0) + calculatedTotalInvested;

  const getRangeLabel = (range: string) => {
    switch(range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 3 Months';
      case 'ytd': return 'Year to Date (YTD)';
      case '1y': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Period';
    }
  };

  const canViewSmartShopping = user?.role === 'admin' || user?.role === 'premium';

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-4 md:p-8 transition-colors duration-300 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER COM FILTRO DE DATA */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-darkText dark:text-lightText">Financial Dashboard</h1>
          
          <div className="bg-white dark:bg-primary p-1 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex text-xs md:text-sm overflow-x-auto max-w-full">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '3M' },
              { id: 'ytd', label: 'YTD' },
              { id: '1y', label: '1Y' },
              { id: 'all', label: 'All' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTimeRange(option.id)}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap ${
                  timeRange === option.id 
                    ? 'bg-accent text-primary shadow-sm font-bold' 
                    : 'text-muted hover:bg-secondary dark:bg-gray-800 hover:text-darkText dark:hover:text-lightText'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. CARTÕES DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-primary rounded-xl p-6 text-lightText shadow-soft border border-gray-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-accent/20"></div>
            <span className="text-accent text-xs font-bold uppercase tracking-wider">Total Net Worth</span>
            <div className="text-3xl font-heading font-bold mt-1 tabular-nums">{calculatedNetWorth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white dark:bg-primary rounded-xl p-6 border border-secondary dark:border-gray-800 shadow-soft">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">💰 Liquidity (Cash)</span>
            <div className="text-2xl font-heading font-bold text-darkText dark:text-lightText mt-1 tabular-nums">{(portfolio?.total_cash ?? 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white dark:bg-primary rounded-xl p-6 border border-secondary dark:border-gray-800 shadow-soft">
            <span className="text-muted text-xs font-bold uppercase tracking-wider">📈 Total Invested</span>
            <div className="text-2xl font-heading font-bold text-darkText dark:text-lightText mt-1 tabular-nums">{calculatedTotalInvested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>

        {/* 2. LINHA DE GRÁFICOS (Evolução + Despesas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* GRÁFICO DE ÁREA (Evolução) */}
          <div className="lg:col-span-2 bg-white dark:bg-primary p-4 md:p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 min-w-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText">Wealth Evolution</h2>
              <span className="text-xs font-medium text-muted bg-secondary dark:bg-gray-800 px-2 py-1 rounded-lg">{getRangeLabel(timeRange)}</span>
            </div>
            
            <div className="h-64 md:h-72 w-full min-w-0">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center text-muted animate-pulse">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.isArray(history) ? history : []}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00DC82" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00DC82" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94A3B8' }} 
                      tickFormatter={(str) => {
                        if (!str) return '';
                        if (timeRange === 'all' || timeRange === '1y') return str.slice(0, 7);
                        return str.slice(8, 10) + '/' + str.slice(5, 7);
                      }} 
                      stroke="#94A3B8" 
                      minTickGap={30}
                    />
                    <YAxis hide={true} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)' }} 
                      formatter={(value: any) => [Number(value).toFixed(2) + ' €', 'Net Worth']} 
                    />
                    <Area type="monotone" dataKey="value" stroke="#00DC82" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* GRÁFICO DE DESPESAS */}
          <div className="bg-white dark:bg-primary p-4 md:p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 flex flex-col min-w-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText">Expenses</h2>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-muted mb-1">{getRangeLabel(timeRange)}</span>
                <span className="text-xs bg-error/10 text-error font-bold px-2 py-1 rounded-full">
                  Total: {totalSpending.toFixed(0)}€
                </span>
              </div>
            </div>

            {loadingSpending ? (
               <div className="flex-1 flex items-center justify-center text-muted animate-pulse">Loading...</div>
            ) : (spending && spending.length > 0) ? (
              <div className="flex-1 min-h-[250px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spending} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {spending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_SPEND[index % COLORS_SPEND.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94A3B8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted text-sm italic text-center p-4">
                No expenses in this period.<br />
                Try selecting another range! 📅
              </div>
            )}
          </div>
        </div>

        {/* 3. NOVO: GRÁFICO DE EVOLUÇÃO (Longo Prazo) */}
        <div className="mb-8">
          <EvolutionChart />
        </div>

        {/* 4. NOVO: WIDGET SMART SHOPPING (Premium/Admin) */}
        {canViewSmartShopping && (
          <div className="mb-8">
            <SmartShoppingWidget />
          </div>
        )}

        {/* 5. LINHA INFERIOR (Investimentos + Tabela) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* GRÁFICO INVESTIMENTOS */}
          <div className="bg-white dark:bg-primary p-4 md:p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 min-w-0">
            <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText mb-4">Portfolio</h2>
            {chartInvest.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartInvest} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartInvest.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_INVEST[index % COLORS_INVEST.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend wrapperStyle={{ color: '#94A3B8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted text-sm italic">
                No active investments.
              </div>
            )}
          </div>

          {/* TABELA DE POSIÇÕES */}
          <div className="lg:col-span-2 bg-white dark:bg-primary p-4 md:p-6 rounded-xl shadow-soft border border-secondary dark:border-gray-800 overflow-hidden">
            <h2 className="text-lg font-heading font-bold text-darkText dark:text-lightText mb-4">Asset Details</h2>
            
            {/* MOBILE: CARD VIEW */}
            <div className="md:hidden space-y-4">
              {aggregatedPositions.map((pos, index) => (
                <div key={`${pos.symbol}-${index}`} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-accent"></span>
                      <span className="font-bold text-darkText dark:text-lightText">{pos.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-darkText dark:text-lightText">{pos.total_value.toFixed(2)} €</p>
                      <p className={`text-xs font-bold ${pos.profit_loss >= 0 ? 'text-success' : 'text-error'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p>Qty: {pos.quantity}</p>
                      <p>Avg: {pos.avg_buy_price.toFixed(2)} €</p>
                    </div>
                    <div className="text-right">
                      <p>Current: {pos.current_price.toFixed(2)} €</p>
                      {/* EDIT PRICE BUTTON */}
                      <button 
                        onClick={() => startEditing(pos.symbol, pos.current_price)}
                        className="text-accent hover:underline mt-1 block"
                      >
                        Update Price
                      </button>
                    </div>
                  </div>
                  {/* EDIT MODE (Inline for mobile too) */}
                  {editingSymbol === pos.symbol && (
                    <div className="mt-3 flex items-center gap-2 justify-end">
                      <input 
                        type="number" 
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-20 p-1 text-xs border border-accent rounded bg-white dark:bg-gray-800 text-darkText dark:text-lightText"
                        autoFocus
                      />
                      <button onClick={() => handleSavePrice(pos.symbol)} className="text-accent">✓</button>
                      <button onClick={() => setEditingSymbol(null)} className="text-error">✕</button>
                    </div>
                  )}
                </div>
              ))}
              {aggregatedPositions.length === 0 && <div className="text-center text-muted py-4">No assets found.</div>}
            </div>

            {/* DESKTOP: TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="text-xs text-muted uppercase bg-secondary dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg whitespace-nowrap">Asset</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Qty</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Avg Price</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Current Price</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Total Value</th>
                    <th className="px-4 py-3 text-right rounded-r-lg whitespace-nowrap">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedPositions.map((pos, index) => (
                    <tr key={`${pos.symbol}-${index}`} className="border-b border-secondary dark:border-gray-800 last:border-0 hover:bg-secondary/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-darkText dark:text-lightText flex items-center gap-2 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        {pos.symbol}
                      </td>
                      <td className="px-4 py-4 text-right text-muted font-mono tabular-nums whitespace-nowrap">{pos.quantity}</td>
                      <td className="px-4 py-4 text-right text-muted font-mono tabular-nums whitespace-nowrap">{pos.avg_buy_price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      
                      {/* CÉLULA DE PREÇO ATUAL EDITÁVEL */}
                      <td className="px-4 py-4 text-right text-muted font-mono tabular-nums whitespace-nowrap">
                        {editingSymbol === pos.symbol ? (
                          <div className="flex items-center justify-end gap-1">
                            <input 
                              type="number" 
                              value={editPrice} 
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 p-1 text-xs border border-accent rounded focus:outline-none focus:ring-1 focus:ring-accent bg-white dark:bg-gray-800 text-darkText dark:text-lightText"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSavePrice(pos.symbol)}
                              disabled={savingPrice}
                              className="text-accent hover:text-green-400"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => setEditingSymbol(null)}
                              className="text-error hover:text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-center justify-end gap-2 cursor-pointer" onClick={() => startEditing(pos.symbol, pos.current_price)}>
                            <span>{pos.current_price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-xs text-accent">✎</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-darkText dark:text-lightText tabular-nums whitespace-nowrap">{pos.total_value.toFixed(2)} €</td>
                      <td className={`px-4 py-4 text-right font-bold tabular-nums whitespace-nowrap ${pos.profit_loss >= 0 ? 'text-success' : 'text-error'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                  {aggregatedPositions.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted">No investments yet. Go to "New" to start! 🚀</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query'; // IMPORTADO useQueryClient
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getPortfolio, getHistory, getSpending, updateAssetPrices } from '../services/api'; // IMPORTADO updateAssetPrices
import EvolutionChart from '../components/EvolutionChart';
import { PortfolioPosition } from '../types/api';

// Cores: Investimentos (Azuis) vs Despesas (Laranjas/Vermelhos)
const COLORS_INVEST = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const COLORS_SPEND = ['#FF8042', '#FFBB28', '#FF6B6B', '#D94848', '#993333'];

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient(); // Hook do React Query
  const [timeRange, setTimeRange] = useState('30d');
  const [updatingPrices, setUpdatingPrices] = useState(false); // Estado para o botão de refresh

  // Verificar autenticação (simples)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); }
  }, [router]);

  // --- QUERIES (TanStack Query) ---
  
  const { data: portfolio, isLoading: loadingPortfolio, isError: errorPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['history', timeRange],
    queryFn: () => getHistory(timeRange),
  });

  const { data: spending, isLoading: loadingSpending } = useQuery({
    queryKey: ['spending', timeRange],
    queryFn: () => getSpending(timeRange),
  });

  // --- FUNÇÃO PARA ATUALIZAR PREÇOS ---
  const handleUpdatePrices = async () => {
    setUpdatingPrices(true);
    try {
      await updateAssetPrices();
      // Após sucesso, invalida a cache para recarregar os dados novos
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['evolution'] });
    } catch (error) {
      console.error("Erro ao atualizar preços:", error);
      alert("Erro ao atualizar cotações. Tente novamente.");
    } finally {
      setUpdatingPrices(false);
    }
  };

  // Loading State Global
  if (loadingPortfolio) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 font-bold animate-pulse">
        A carregar o seu império... 🏰
      </div>
    );
  }

  // Se der erro no portfolio
  if (errorPortfolio || !portfolio) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500 font-bold">
        Erro ao carregar dados. Tente fazer login novamente.
      </div>
    );
  }

  // --- AGREGAÇÃO DE POSIÇÕES (FRONTEND FIX) ---
  const aggregatedPositions = Object.values(
    portfolio.positions.reduce((acc, pos) => {
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
    }, {} as Record<string, PortfolioPosition>)
  );

  const chartInvest = aggregatedPositions.map(pos => ({ name: pos.symbol, value: pos.total_value }));
  const totalSpending = spending ? spending.reduce((acc, item) => acc + item.value, 0) : 0;
  const calculatedTotalInvested = aggregatedPositions.reduce((acc, pos) => acc + pos.total_value, 0);
  const calculatedNetWorth = portfolio.total_cash + calculatedTotalInvested;

  const getRangeLabel = (range: string) => {
    switch(range) {
      case '7d': return 'Últimos 7 Dias';
      case '30d': return 'Últimos 30 Dias';
      case '90d': return 'Últimos 3 Meses';
      case 'ytd': return 'Este Ano (YTD)';
      case '1y': return 'Último Ano';
      case 'all': return 'Todo o Histórico';
      default: return 'Período';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER COM FILTRO DE DATA E BOTÃO DE REFRESH */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h1>
            
            {/* BOTÃO DE ATUALIZAR COTAÇÕES */}
            <button
              onClick={handleUpdatePrices}
              disabled={updatingPrices}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                updatingPrices 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              }`}
              title="Forçar atualização de preços de mercado"
            >
              <span className={updatingPrices ? 'animate-spin' : ''}>🔄</span>
              {updatingPrices ? 'A atualizar...' : 'Atualizar Cotações'}
            </button>
          </div>
          
          <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex text-sm">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '3M' },
              { id: 'ytd', label: 'YTD' },
              { id: '1y', label: '1A' },
              { id: 'all', label: 'Tudo' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setTimeRange(option.id)}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  timeRange === option.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. CARTÕES DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Património Total</span>
            <div className="text-3xl font-bold mt-1">{calculatedNetWorth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">💰 Liquidez (Bancos)</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{portfolio.total_cash.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">📈 Total Investido</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{calculatedTotalInvested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>

        {/* 2. LINHA DE GRÁFICOS (Evolução + Despesas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* GRÁFICO DE ÁREA (Evolução) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700">Evolução Patrimonial</h2>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{getRangeLabel(timeRange)}</span>
            </div>
            
            <div className="h-72 w-full">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center text-gray-300 animate-pulse">A carregar gráfico...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.isArray(history) ? history : []}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(str) => {
                        if (!str) return '';
                        // Se for "all" ou "1y", mostra o ano/mês. Senão, dia/mês.
                        if (timeRange === 'all' || timeRange === '1y') return str.slice(0, 7);
                        return str.slice(8, 10) + '/' + str.slice(5, 7);
                      }} 
                      stroke="#9ca3af" 
                      minTickGap={30}
                    />
                    <YAxis hide={true} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [Number(value).toFixed(2) + ' €', 'Património']} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* GRÁFICO DE DESPESAS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-700">Despesas</h2>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-gray-400 mb-1">{getRangeLabel(timeRange)}</span>
                <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">
                  Total: {totalSpending.toFixed(0)}€
                </span>
              </div>
            </div>

            {loadingSpending ? (
               <div className="flex-1 flex items-center justify-center text-gray-300 animate-pulse">A carregar...</div>
            ) : (spending && spending.length > 0) ? (
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spending} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {spending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_SPEND[index % COLORS_SPEND.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic text-center p-4">
                Sem despesas neste período.<br />
                Tente selecionar outro intervalo! 📅
              </div>
            )}
          </div>
        </div>

        {/* 3. NOVO: GRÁFICO DE EVOLUÇÃO (Longo Prazo) */}
        <div className="mb-8">
          <EvolutionChart />
        </div>

        {/* 4. LINHA INFERIOR (Investimentos + Tabela) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* GRÁFICO INVESTIMENTOS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Portfólio</h2>
            {chartInvest.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartInvest} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartInvest.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_INVEST[index % COLORS_INVEST.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm italic">
                Sem investimentos ativos.
              </div>
            )}
          </div>

          {/* TABELA DE POSIÇÕES */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Detalhe dos Ativos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Ativo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Preço Médio</th>
                    <th className="px-4 py-3 text-right">Preço Atual</th>
                    <th className="px-4 py-3 text-right">Valor Total</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Lucro/Prejuízo</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedPositions.map((pos, index) => (
                    <tr key={`${pos.symbol}-${index}`} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {pos.symbol}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600 font-mono">{pos.quantity}</td>
                      <td className="px-4 py-4 text-right text-gray-600 font-mono">{pos.avg_buy_price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-4 py-4 text-right text-gray-600 font-mono">{pos.current_price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-4 py-4 text-right font-bold text-gray-800">{pos.total_value.toFixed(2)} €</td>
                      <td className={`px-4 py-4 text-right font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                  {aggregatedPositions.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Ainda não tem investimentos. Vá a "Adicionar" para começar! 🚀</td></tr>
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
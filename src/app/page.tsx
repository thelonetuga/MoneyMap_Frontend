'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api'; // <--- Usar o cliente central
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS_INVEST = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const COLORS_SPEND = ['#FF8042', '#FFBB28', '#FF6B6B', '#D94848', '#993333'];

// --- INTERFACES (Mantive as tuas) ---
interface PortfolioPosition {
  symbol: string;
  total_value: number;
  quantity: number;
  profit_loss: number;
}
interface PortfolioResponse {
  total_net_worth: number;
  total_cash: number;
  total_invested: number;
  positions: PortfolioPosition[];
}
interface SpendingItem {
  name: string;
  value: number;
  [key: string]: any;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [spending, setSpending] = useState<SpendingItem[]>([]);

  useEffect(() => {
    // Não precisamos verificar token manualmente aqui, o api.ts trata disso.
    
    const loadData = async () => {
      try {
        // Promise.allSettled é mais seguro: se um falhar, os outros carregam
        const [portfolioRes, historyRes, spendingRes] = await Promise.allSettled([
          api.get('/portfolio'),
          api.get('/history'), // Nota: Verifica se este endpoint existe no backend!
          api.get('/analytics/spending')
        ]);

        // Processar Portfolio
        if (portfolioRes.status === 'fulfilled') {
          setData(portfolioRes.value.data);
        } else {
           // Fallback se falhar ou endpoint não existir
           setData({ total_net_worth: 0, total_cash: 0, total_invested: 0, positions: [] });
        }

        // Processar Histórico
        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value.data);
        } else {
          setHistory([]);
        }

        // Processar Despesas
        if (spendingRes.status === 'fulfilled') {
          setSpending(spendingRes.value.data);
        } else {
          setSpending([]);
        }

      } catch (error) {
        console.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 font-bold animate-pulse">A carregar o seu império... 🏰</div>;
  }

  // Se não houver dados nenhuns (erro grave de conexão)
  if (!data) return null; 

  const chartInvest = data.positions.map(pos => ({ name: pos.symbol, value: pos.total_value }));
  const totalSpending = spending.reduce((acc, item) => acc + item.value, 0);

  // --- O RESTO DO TEU JSX MANTÉM-SE IGUAL (GRÁFICOS, TABELAS, ETC.) ---
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1>
            <p className="text-gray-500 text-sm">Visão geral financeira</p>
          </div>
        </header>

        {/* 1. CARTÕES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Património Total</span>
            <div className="text-3xl font-bold mt-1">{data.total_net_worth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">💰 Liquidez</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data.total_cash.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">📈 Investido</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data.total_invested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>

        {/* 2. GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Evolução */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Evolução (30 Dias)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(str) => str ? String(str).slice(8, 10) : ''} stroke="#9ca3af" />
                  <YAxis hide={true} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [Number(value).toFixed(2) + ' €', 'Património']} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Despesas */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
             <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-700">Despesas</h2>
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">Total: {totalSpending.toFixed(0)}€</span>
            </div>
            {spending.length > 0 ? (
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spending} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {spending.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_SPEND[index % COLORS_SPEND.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">Sem despesas.</div>
            )}
          </div>
        </div>

        {/* 3. TABELA PORTFOLIO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Detalhe dos Ativos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Ativo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">L/P</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((pos, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium">{pos.symbol}</td>
                      <td className="px-4 py-4 text-right font-mono">{pos.quantity}</td>
                      <td className="px-4 py-4 text-right font-bold">{pos.total_value.toFixed(2)} €</td>
                      <td className={`px-4 py-4 text-right font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                  {data.positions.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sem investimentos.</td></tr>}
                </tbody>
              </table>
            </div>
        </div>

      </div>
    </main>
  );
}
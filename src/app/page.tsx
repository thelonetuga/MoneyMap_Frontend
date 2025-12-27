'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// Cores: Investimentos (Azuis) vs Despesas (Laranjas/Vermelhos)
const COLORS_INVEST = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const COLORS_SPEND = ['#FF8042', '#FFBB28', '#FF6B6B', '#D94848', '#993333'];

// --- INTERFACES ---
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

  // Estados para os dados
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [spending, setSpending] = useState<SpendingItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const headers = { 'Authorization': `Bearer ${token}` };

    // Buscar TUDO em paralelo (Portfolio, Historico e Despesas)
    Promise.all([
      fetch('http://127.0.0.1:8000/portfolio', { headers }).then(res => res.ok ? res.json() : null),
      fetch('http://127.0.0.1:8000/history', { headers }).then(res => res.ok ? res.json() : []),
      fetch('http://127.0.0.1:8000/analytics/spending', { headers }).then(res => res.ok ? res.json() : [])
    ])
      .then(([portfolioData, historyData, spendingData]) => {
        if (!portfolioData) throw new Error("Auth Error"); // Se o portfolio falhar, o token é inválido

        setData(portfolioData);
        setHistory(historyData);
        setSpending(spendingData);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      });

  }, [router]);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 font-bold animate-pulse">A carregar o seu império... 🏰</div>;
  }

  // Preparar dados para o gráfico de Investimentos
  const chartInvest = data.positions.map(pos => ({ name: pos.symbol, value: pos.total_value }));

  // Calcular total de despesas para mostrar no centro do gráfico
  const totalSpending = spending.reduce((acc, item) => acc + item.value, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* CABEÇALHO */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1>
            <p className="text-gray-500 text-sm">Visão geral financeira</p>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-sm text-red-500 hover:text-red-700 font-bold bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            Sair 🚪
          </button>
        </header>

        {/* 1. CARTÕES DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Património Total</span>
            <div className="text-3xl font-bold mt-1">{data.total_net_worth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">💰 Liquidez (Bancos)</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data.total_cash.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">📈 Total Investido</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">{data.total_invested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>

        {/* 2. LINHA DE GRÁFICOS (Evolução + Despesas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* GRÁFICO DE ÁREA (Evolução) - Ocupa 2 colunas */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Evolução Patrimonial (30 Dias)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.isArray(history) ? history : []}>
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

          {/* NOVO: GRÁFICO DE DESPESAS - Ocupa 1 coluna */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-700">Despesas (30d)</h2>
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">
                Total: {totalSpending.toFixed(0)}€
              </span>
            </div>

            {spending.length > 0 ? (
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
                Sem despesas recentes.<br />
                Registe uma para ver o gráfico! 💸
              </div>
            )}
          </div>
        </div>

        {/* 3. LINHA INFERIOR (Investimentos + Tabela) */}
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

          {/* TABELA DE POSIÇÕES (Mais larga agora) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Detalhe dos Ativos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Ativo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Valor Atual</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Lucro/Prejuízo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((pos, index) => (
                    <tr key={`${pos.symbol}-${index}`} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {pos.symbol}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600 font-mono">{pos.quantity}</td>
                      <td className="px-4 py-4 text-right font-bold text-gray-800">{pos.total_value.toFixed(2)} €</td>
                      <td className={`px-4 py-4 text-right font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                  {data.positions.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Ainda não tem investimentos. Vá a "Adicionar" para começar! 🚀</td></tr>
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
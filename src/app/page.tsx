'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pfRes, histRes, spendRes, txRes] = await Promise.all([
          api.get('/portfolio/'),
          api.get('/analytics/history'),
          api.get('/analytics/spending'),
          api.get('/transactions/?limit=5')
        ]);
        setPortfolio(pfRes.data);
        setHistory(histRes.data);
        setSpending(spendRes.data);
        setRecentTx(txRes.data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">A carregar o império... 🏰</div>;
  if (!portfolio) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8"><h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1></header>

        {/* CARTÕES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg"><span className="text-xs font-bold uppercase">Património</span><div className="text-3xl font-bold">{portfolio.total_net_worth.toFixed(2)} €</div></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm"><span className="text-xs font-bold text-gray-400 uppercase">Liquidez</span><div className="text-2xl font-bold">{portfolio.total_cash.toFixed(2)} €</div></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm"><span className="text-xs font-bold text-gray-400 uppercase">Investido</span><div className="text-2xl font-bold">{portfolio.total_invested.toFixed(2)} €</div></div>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Evolução */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm h-80">
                <h2 className="font-bold text-gray-700 mb-4">Evolução (30 Dias)</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                        <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                        <XAxis dataKey="date" tickFormatter={(t) => t.slice(8,10)} stroke="#ccc" tick={{fontSize: 10}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Despesas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm h-80">
                <h2 className="font-bold text-gray-700 mb-4">Despesas</h2>
                {spending.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={spending} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {spending.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-gray-400">Sem dados.</div>}
            </div>
        </div>

        {/* ÚLTIMOS MOVIMENTOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-bold text-gray-700 mb-4">Últimos Movimentos</h2>
            {recentTx.map((tx: any) => (
                <div key={tx.id} className="flex justify-between py-3 border-b last:border-0 border-gray-50">
                    <div>
                        <p className="font-bold text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-400">{tx.category?.name} • {tx.account?.name}</p>
                    </div>
                    <span className={`font-bold ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>{tx.amount.toFixed(2)} €</span>
                </div>
            ))}
        </div>
      </div>
    </main>
  );
}
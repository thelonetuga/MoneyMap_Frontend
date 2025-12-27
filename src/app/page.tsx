'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';

// Cores do gráfico
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_value: number;
  profit_loss: number;
}

interface PortfolioResponse {
  total_net_worth: number;
  total_cash: number;
  total_invested: number;
  positions: PortfolioPosition[];
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar se temos Token
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { 
      'Authorization': `Bearer ${token}` 
    };

    // 2. Buscar Dados
    Promise.all([
      // Endpoint de Portfolio (Correto)
      fetch('http://127.0.0.1:8000/portfolio', { headers }).then(res => {
        if (res.status === 401) throw new Error('Unauthorized');
        return res.json();
      }),
      // --- CORREÇÃO AQUI ---
      // Endpoint de Histórico (Atualizado: removemos o /users/1/)
      fetch('http://127.0.0.1:8000/history', { headers }).then(res => {
        if (res.status === 401) throw new Error('Unauthorized');
        return res.json();
      })
    ])
    .then(([portfolioData, historyData]) => {
      setData(portfolioData);
      setHistory(historyData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro de autenticação ou rede:", err);
      // Se falhar a autenticação, manda para o login
      localStorage.removeItem('token');
      router.push('/login');
    });

  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <p className="text-xl font-bold text-gray-400">A carregar o seu império... 🏰</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico de Pizza
  const chartData = data.positions.map(pos => ({
    name: pos.symbol,
    value: pos.total_value
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO COM 3 CARTÕES */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-sm text-red-500 hover:text-red-700 font-bold">
              Sair 🚪
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. PATRIMÓNIO TOTAL */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
              <div className="flex flex-col">
                <span className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Património Total</span>
                <span className="text-3xl font-bold">
                  {data.total_net_worth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>

            {/* 2. CONTAS BANCÁRIAS */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                🏦 Bancos & Liquidez
              </span>
              <span className="text-2xl font-bold text-gray-800">
                {data.total_cash.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

            {/* 3. INVESTIMENTOS */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                📈 Investimentos
              </span>
              <span className="text-2xl font-bold text-gray-800">
                {data.total_invested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

          </div>
        </header>

        {/* GRÁFICO DE EVOLUÇÃO (ÁREA) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Evolução Patrimonial (30 Dias)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* Proteção contra dados vazios */}
              <AreaChart data={Array.isArray(history) ? history : []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12}} 
                  tickFormatter={(str) => str ? String(str).slice(8, 10) : ''}
                  stroke="#9ca3af"
                />
                
                <YAxis hide={true} domain={['auto', 'auto']} />
                
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [Number(value).toFixed(2) + ' €', 'Património']}
                />
                
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECÇÃO INFERIOR: GRÁFICO PIZZA + TABELA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* GRÁFICO PIZZA */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Alocação de Ativos</h2>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* TABELA DE POSIÇÕES */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h2 className="text-lg font-bold mb-4 text-gray-700">As suas Posições</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Lucro/Prejuízo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((pos, index) => (
                    // Chave única composta
                    <tr key={`${pos.symbol}-${index}`} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{pos.symbol}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{pos.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{pos.total_value.toFixed(2)} €</td>
                      <td className={`px-4 py-3 text-right font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                  {data.positions.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-400">Sem investimentos ativos.</td></tr>
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
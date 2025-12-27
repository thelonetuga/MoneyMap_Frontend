'use client'; // Necessário porque agora usamos interatividade (gráficos)

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- INTERFACES ---
interface PortfolioPosition {
  symbol: string;
  quantity: number;
  current_price: number;
  total_value: number;
  profit_loss: number;
}

interface PortfolioResponse {
  total_portfolio_value: number;
  positions: PortfolioPosition[];
}

// --- CORES DO GRÁFICO ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Home() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar dados ao Backend
    fetch('http://127.0.0.1:8000/users/1/portfolio')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div className="p-10 text-center">A carregar o seu império... ⏳</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Erro ao carregar dados.</div>;

  // Preparar dados para o gráfico (apenas Symbol e Total Value)
  const chartData = data.positions.map(pos => ({
    name: pos.symbol,
    value: pos.total_value
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">

        {/* CABEÇALHO */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1>
            <p className="text-gray-500">Visão geral do património</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 text-right">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Saldo Total</p>
            <p className="text-3xl font-bold text-green-600">
              {data.total_portfolio_value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </header>

        {/* GRELHA PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* COLUNA DA ESQUERDA: GRÁFICO */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Alocação de Ativos</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => value !== undefined ? value.toFixed(2) + ' €' : 'N/A'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COLUNA DA DIREITA: TABELA DETALHADA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">As suas Posições</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <tr>
                    <th className="p-4 font-semibold">Ativo</th>
                    <th className="p-4 font-semibold text-right">Qtd</th>
                    <th className="p-4 font-semibold text-right">Preço</th>
                    <th className="p-4 font-semibold text-right">Valor Total</th>
                    <th className="p-4 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {data.positions.map((pos) => (
                    <tr key={pos.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{pos.symbol}</td>
                      <td className="p-4 text-right text-gray-600">{pos.quantity}</td>
                      <td className="p-4 text-right text-gray-600">{pos.current_price.toFixed(2)} €</td>
                      <td className="p-4 text-right font-bold text-gray-900">{pos.total_value.toFixed(2)} €</td>
                      <td className={`p-4 text-right font-medium ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
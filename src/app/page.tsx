'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- CORES ---
const COLORS_SPEND = ['#FF8042', '#FFBB28', '#FF6B6B', '#D94848', '#993333', '#8884d8'];
const COLORS_INVEST = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- INTERFACES ---
interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  category?: { name: string };
  transaction_type: { name: string };
}

interface PortfolioPosition {
  symbol: string;
  total_value: number;
  quantity: number;
  profit_loss: number;
  current_price: number;
}

interface PortfolioResponse {
  total_net_worth: number;
  total_cash: number;
  total_invested: number;
  positions: PortfolioPosition[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  
  // Dados da API
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);

  // Dados Calculados para Gráficos
  const [expensesChartData, setExpensesChartData] = useState<any[]>([]);
  const [investChartData, setInvestChartData] = useState<any[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar Portfolio e Transações (Limit 50 para ter dados para o gráfico)
        const [portfolioRes, txRes] = await Promise.all([
          api.get('/portfolio/'),
          api.get('/transactions/?limit=50')
        ]);

        const pfData: PortfolioResponse = portfolioRes.data;
        const txData: Transaction[] = txRes.data;

        setPortfolio(pfData);
        setRecentTx(txData.slice(0, 5)); // Guardar apenas as 5 mais recentes para a lista

        // --- 1. PREPARAR GRÁFICO DE DESPESAS 💸 ---
        const expenses = txData.filter(t => {
            const isNegative = ['Despesa', 'Expense', 'Saída'].some(k => t.transaction_type?.name.includes(k));
            return isNegative || t.amount < 0; 
        });

        const categoryMap: Record<string, number> = {};
        let totalExp = 0;

        expenses.forEach(t => {
            const catName = t.category?.name || 'Sem Categoria';
            const val = Math.abs(t.amount);
            categoryMap[catName] = (categoryMap[catName] || 0) + val;
            totalExp += val;
        });

        const expChart = Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key]
        })).sort((a, b) => b.value - a.value);

        setExpensesChartData(expChart);
        setTotalSpending(totalExp);

        // --- 2. PREPARAR GRÁFICO DE INVESTIMENTOS 📈 ---
        // Se tiver ativos, usa os ativos. Se não, mostra só Cash.
        let invChart = pfData.positions.map(p => ({
            name: p.symbol,
            value: p.total_value
        }));

        // Opcional: Adicionar o "Cash" ao gráfico para ver a alocação total
        if (pfData.total_cash > 0) {
            invChart.push({ name: 'Liquidez (Cash)', value: pfData.total_cash });
        }
        
        // Ordenar por valor
        invChart.sort((a, b) => b.value - a.value);
        setInvestChartData(invChart);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400 font-bold animate-pulse">A carregar o império... 🏰</div>;
  if (!portfolio) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MoneyMap 🌍</h1>
          <p className="text-gray-500 text-sm">Painel de Controlo Financeiro</p>
        </header>

        {/* 1. CARTÕES DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Património Líquido</span>
            <div className="text-3xl font-bold mt-1">
                {portfolio.total_net_worth.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">💰 Disponível</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">
                {portfolio.total_cash.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">📈 Investido</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">
                {portfolio.total_invested.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>

        {/* 2. ÁREA DE GRÁFICOS (LADO A LADO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* GRÁFICO ESQUERDA: DESPESAS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-700">Despesas (Últimos 50 mov.)</h2>
              <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">Total: {totalSpending.toFixed(0)}€</span>
            </div>
            {expensesChartData.length > 0 ? (
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {expensesChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_SPEND[index % COLORS_SPEND.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 italic">Sem despesas recentes.</div>
            )}
          </div>

          {/* GRÁFICO DIREITA: INVESTIMENTOS (VOLTOU! 🎉) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
             <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-700">Alocação de Portfólio</h2>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Investido: {portfolio.total_invested.toFixed(0)}€</span>
            </div>
            {investChartData.length > 0 ? (
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={investChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {investChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_INVEST[index % COLORS_INVEST.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toFixed(2) + ' €'} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 italic">Ainda sem investimentos.</div>
            )}
          </div>
        </div>

        {/* 3. ÁREA INFERIOR: MOVIMENTOS E TABELA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUNA ESQUERDA: LISTA MOVIMENTOS */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-700 mb-4">Últimos Movimentos</h2>
                <div className="space-y-4">
                {recentTx.map(tx => {
                    const isExpense = ['Despesa', 'Expense', 'Saída'].some(t => tx.transaction_type?.name.includes(t)) || tx.amount < 0;
                    return (
                    <div key={tx.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isExpense ? 'bg-red-50' : 'bg-green-50'}`}>
                            {isExpense ? '💸' : '💰'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-gray-800 text-sm truncate w-32">{tx.description}</p>
                            <p className="text-[10px] text-gray-400 uppercase">
                                {tx.category?.name || 'Geral'}
                            </p>
                        </div>
                        </div>
                        <span className={`font-bold text-sm ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                        {isExpense ? '-' : '+'}{Math.abs(tx.amount).toFixed(2)}€
                        </span>
                    </div>
                    );
                })}
                {recentTx.length === 0 && <p className="text-gray-400 text-sm italic">Nada a mostrar.</p>}
                </div>
            </div>

            {/* COLUNA DIREITA (LARGURA DUPLA): TABELA INVESTIMENTOS */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-lg font-bold text-gray-700 mb-4">As tuas Posições</h2>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Ativo</th>
                        <th className="px-4 py-3 text-right">Qtd</th>
                        <th className="px-4 py-3 text-right">Preço Atual</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Lucro/Prej.</th>
                    </tr>
                    </thead>
                    <tbody>
                    {portfolio.positions.map((pos, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-blue-900">{pos.symbol}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{pos.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{pos.current_price.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">{pos.total_value.toFixed(2)} €</td>
                        <td className={`px-4 py-3 text-right font-bold ${pos.profit_loss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {pos.profit_loss > 0 ? '+' : ''}{pos.profit_loss.toFixed(2)} €
                        </td>
                        </tr>
                    ))}
                    {portfolio.positions.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Ainda não tens investimentos. Vai a "Adicionar" e compra o teu primeiro ativo! 🚀</td></tr>
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
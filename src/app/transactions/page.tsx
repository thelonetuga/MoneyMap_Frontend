'use client';

import { useEffect, useState } from 'react';

// Tipagem (deve bater certo com o TransactionResponse do Python)
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  transaction_type: { name: string; is_investment: boolean };
  sub_category?: { name: string };
  asset?: { symbol: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/users/1/transactions/')
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Histórico de Movimentos 📜</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-500 text-sm uppercase">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria / Ativo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center">A carregar...</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{tx.date}</td>
                  <td className="p-4 font-medium text-gray-900">{tx.description}</td>
                  <td className="p-4 text-gray-600">
                    {/* Se for investimento mostra o Símbolo, se for despesa mostra a Subcategoria */}
                    {tx.asset ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                        {tx.asset.symbol}
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tx.sub_category?.name || '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{tx.transaction_type.name}</td>
                  <td className={`p-4 text-right font-bold ${
                    ['Despesa', 'Levantamento', 'Compra Investimento'].some(t => tx.transaction_type.name.includes(t)) 
                    ? 'text-red-600' 
                    : 'text-green-600'
                  }`}>
                    {tx.amount.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';

// Tipagem baseada no teu Backend
interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    category?: { name: string };
    transaction_type: { name: string };
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            // Axios converte JSON automaticamente em .data
            const response = await api.get('/transactions/');
            setTransactions(response.data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">A carregar movimentos... ⏳</div>;

    return (
        <main className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Histórico de Movimentos</h1>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-gray-400 font-medium">
                                        Ainda não há movimentos. Importe um ficheiro ou adicione manualmente!
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => {
                                    // Detetar se é despesa para pintar de vermelho
                                    const isExpense = ['Despesa', 'Expense', 'Saída'].some(t => tx.transaction_type?.name.includes(t)) || tx.amount < 0;
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString('pt-PT')}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-900 font-bold">
                                                {tx.description}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                                                    {tx.category?.name || 'Geral'}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-6 text-sm font-bold text-right ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                                                {isExpense ? '-' : '+'}{Math.abs(tx.amount).toFixed(2)} €
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
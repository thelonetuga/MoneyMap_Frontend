'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getTransactions } from '../../services/api';
import { TransactionQueryParams } from '../../types/api';

export default function TransactionsPage() {
  const router = useRouter();
  
  // Estados de Filtro e Paginação
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TransactionQueryParams['sort_by']>('date_desc');
  
  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); }
  }, [router]);

  // Query de Transações
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page, sortBy],
    queryFn: () => getTransactions({ page, size: 20, sort_by: sortBy }),
    placeholderData: (previousData) => previousData, // Mantém dados antigos enquanto carrega novos (UX melhor)
  });

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse font-bold">A carregar transações... 🧾</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">
        Erro ao carregar transações.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Extrato de Transações</h1>
          
          <div className="flex gap-2">
            {/* Filtro de Ordenação */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="date_desc">Mais Recentes</option>
              <option value="date_asc">Mais Antigas</option>
              <option value="amount_desc">Maior Valor</option>
              <option value="amount_asc">Menor Valor</option>
            </select>

            <button 
              onClick={() => router.push('/add')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + Nova
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Conta</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((tx) => (
                  <tr key={tx.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {tx.description}
                      {tx.symbol && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                          {tx.symbol}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.category?.name || tx.sub_category?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {tx.account.name}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      // Lógica simples: se for "Receita" ou "Venda" é verde, senão vermelho (simplificação)
                      // O ideal seria ter um campo is_expense no tipo
                      tx.transaction_type.name.toLowerCase().includes('receita') || tx.transaction_type.name.toLowerCase().includes('venda') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tx.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINAÇÃO */}
          <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-700">
              Página <span className="font-semibold text-gray-900">{data?.page}</span> de <span className="font-semibold text-gray-900">{data?.pages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPage(p => (data && p < data.pages ? p + 1 : p))}
                disabled={!data || page >= data.pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
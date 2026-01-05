'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getTransactions } from '../../services/api';
import { TransactionQueryParams, TransactionResponse } from '../../types/models';
import api from '@/services/api';
import EditTransactionModal from '@/components/EditTransactionModal';

export default function TransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Estados de Filtro e Paginação
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TransactionQueryParams['sort_by']>('date_desc');
  
  // Estados de Edição
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | null>(null);

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); }
  }, [router]);

  // Query de Transações
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page, sortBy],
    queryFn: () => getTransactions({ page, size: 20, sort_by: sortBy }),
    placeholderData: (previousData) => previousData,
  });

  // Handlers de Seleção
  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map(tx => tx.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Handlers de Ações
  const handleBulkDelete = async () => {
    if (!confirm(`Tem a certeza que deseja apagar ${selectedIds.length} transações?`)) return;
    
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/transactions/${id}`)));
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setSelectedIds([]);
      alert('Transações apagadas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar algumas transações.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    if (!confirm('Tem a certeza que deseja apagar esta transação?')) return;

    try {
      await api.delete(`/transactions/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar transação.');
    }
  };

  const openEditModal = (tx: TransactionResponse) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const openBulkEditModal = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setSelectedIds([]);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse font-bold">A carregar transações... 🧾</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-red-500">
        Erro ao carregar transações.
      </div>
    );
  }

  return (
    <>
      <EditTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        transactionIds={editingTx ? [editingTx.id] : selectedIds}
        initialData={editingTx}
      />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Extrato de Transações</h1>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="date_desc">Mais Recentes</option>
                <option value="date_asc">Mais Antigas</option>
                <option value="amount_desc">Maior Valor</option>
                <option value="amount_asc">Menor Valor</option>
              </select>
              <button onClick={() => router.push('/add')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">+ Nova</button>
            </div>
          </div>

          {/* BARRA DE AÇÕES EM MASSA */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl mb-4 flex justify-between items-center animate-fade-in">
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium ml-2">{selectedIds.length} selecionadas</span>
              <div className="flex gap-2">
                <button onClick={openBulkEditModal} className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">✏️ Editar</button>
                <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">{isBulkDeleting ? 'A apagar...' : '🗑️ Apagar'}</button>
                <button onClick={() => setSelectedIds([])} className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              </div>
            </div>
          )}

          {/* TABELA */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-4 w-4"><input type="checkbox" checked={(data?.items?.length ?? 0) > 0 && selectedIds.length === (data?.items?.length ?? 0)} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" /></th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Conta</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((tx) => (
                    <tr key={tx.id} className={`border-b dark:border-gray-700 transition-colors ${selectedIds.includes(tx.id) ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <td className="p-4 w-4"><input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => toggleSelectOne(tx.id)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" /></td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{tx.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{tx.description}{tx.symbol && (<span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-0.5 rounded">{tx.symbol}</span>)}</td>
                      <td className="px-6 py-4">{tx.category?.name || tx.sub_category?.name || '-'}</td>
                      <td className="px-6 py-4">{tx.account.name}</td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.transaction_type.name.toLowerCase().includes('receita') || tx.transaction_type.name.toLowerCase().includes('venda') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        <button onClick={() => openEditModal(tx)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1" title="Editar">✏️</button>
                        <button onClick={() => handleDeleteOne(tx.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1" title="Apagar">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (<tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">Nenhuma transação encontrada.</td></tr>)}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <span className="text-sm text-gray-700 dark:text-gray-300">Página <span className="font-semibold text-gray-900 dark:text-white">{data?.page}</span> de <span className="font-semibold text-gray-900 dark:text-white">{data?.pages}</span></span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                <button onClick={() => setPage(p => (data && p < data.pages ? p + 1 : p))} disabled={!data || page >= data.pages} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Próxima</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
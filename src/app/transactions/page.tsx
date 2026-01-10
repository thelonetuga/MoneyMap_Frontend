'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getTransactions } from '@/services/api';
import { TransactionQueryParams, TransactionResponse } from '@/types/models';
import api from '@/services/api';
import EditTransactionModal from '@/components/EditTransactionModal';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function TransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Estados de Filtro e Paginação
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TransactionQueryParams['sort_by']>('date_desc');
  
  // NOVOS FILTROS
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados de Edição
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | null>(null);

  // Estados de Confirmação (Modal)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); }
  }, [router]);

  // Query de Categorias e Tipos
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories/').then(res => res.data) });
  const { data: types } = useQuery({ queryKey: ['types'], queryFn: () => api.get('/lookups/transaction-types/').then(res => res.data) });

  // Query de Transações
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page, sortBy, filterCategory, filterType, startDate, endDate],
    queryFn: () => getTransactions({ 
      page, 
      size: 20, 
      sort_by: sortBy,
      category_id: filterCategory ? Number(filterCategory) : undefined,
      transaction_type_id: filterType ? Number(filterType) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    }),
    placeholderData: (previousData) => previousData,
  });

  // Reset Filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

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

  // Handlers de Ações (Com Modal)
  const handleBulkDeleteClick = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Transactions?',
      message: `Are you sure you want to delete ${selectedIds.length} transactions? This action is irreversible.`,
      action: executeBulkDelete
    });
  };

  const executeBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/transactions/${id}/`)));
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert('Error deleting transactions.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteOneClick = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction?',
      action: () => executeDeleteOne(id)
    });
  };

  const executeDeleteOne = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}/`);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting transaction.');
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
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 animate-pulse font-bold">Loading transactions... 🧾</div>;
  }

  if (isError) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-red-500">Error loading transactions.</div>;
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

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        isDanger={true}
      />

      <main className="min-h-screen bg-secondary dark:bg-primary p-4 md:p-8 transition-colors duration-300 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-heading font-bold text-darkText dark:text-lightText">Transactions</h1>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                🔍 Filters
              </button>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>

              <button 
                onClick={() => router.push('/add')} 
                className="bg-accent hover:bg-accent/90 text-primary font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-glow whitespace-nowrap"
              >
                + New
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS (COLLAPSIBLE) */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
              {/* Categoria */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                <select 
                  value={filterCategory} 
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white outline-none"
                >
                  <option value="">All</option>
                  {Array.isArray(categories) && categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Type</label>
                <select 
                  value={filterType} 
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white outline-none"
                >
                  <option value="">All</option>
                  {Array.isArray(types) && types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Data Início */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">From</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white outline-none"
                />
              </div>

              {/* Data Fim */}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">To</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white outline-none"
                />
              </div>

              {/* Botão Limpar */}
              <div className="col-span-1 flex items-end">
                <button 
                  onClick={clearFilters}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* BARRA DE AÇÕES EM MASSA */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-3 rounded-xl mb-4 flex justify-between items-center animate-fade-in overflow-x-auto">
              <span className="text-sm text-blue-800 dark:text-blue-200 font-medium ml-2 whitespace-nowrap">{selectedIds.length} selected</span>
              <div className="flex gap-2">
                <button onClick={openBulkEditModal} className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">✏️ Edit</button>
                <button onClick={handleBulkDeleteClick} disabled={isBulkDeleting} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap">{isBulkDeleting ? 'Deleting...' : '🗑️ Delete'}</button>
                <button onClick={() => setSelectedIds([])} className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cancel</button>
              </div>
            </div>
          )}

          {/* --- MOBILE: CARD VIEW (Visível apenas em mobile) --- */}
          <div className="md:hidden space-y-4">
            {data?.items.map((tx) => (
              <div key={tx.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${selectedIds.includes(tx.id) ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => toggleSelectOne(tx.id)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{tx.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date} • {tx.account.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.transaction_type.name.toLowerCase().includes('receita') || tx.transaction_type.name.toLowerCase().includes('venda') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </p>
                    {tx.symbol && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">{tx.symbol}</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tx.category?.name || '-'}
                    {tx.sub_category && <span className="opacity-70"> › {tx.sub_category.name}</span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => openEditModal(tx)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">✏️</button>
                    <button onClick={() => handleDeleteOneClick(tx.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
            {data?.items.length === 0 && <div className="text-center text-gray-400 py-8">No transactions found.</div>}
          </div>

          {/* --- DESKTOP: TABLE VIEW (Escondido em mobile) --- */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 min-w-[800px]">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-4 w-4"><input type="checkbox" checked={(data?.items?.length ?? 0) > 0 && selectedIds.length === (data?.items?.length ?? 0)} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" /></th>
                    <th className="px-6 py-3 whitespace-nowrap">Date</th>
                    <th className="px-6 py-3 whitespace-nowrap">Description</th>
                    <th className="px-6 py-3 whitespace-nowrap">Category</th>
                    <th className="px-6 py-3 whitespace-nowrap">Account</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">Amount</th>
                    <th className="px-6 py-3 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((tx) => (
                    <tr key={tx.id} className={`border-b dark:border-gray-700 transition-colors ${selectedIds.includes(tx.id) ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <td className="p-4 w-4"><input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => toggleSelectOne(tx.id)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" /></td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{tx.description}{tx.symbol && (<span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-0.5 rounded">{tx.symbol}</span>)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.category?.name || '-'}
                        {tx.sub_category && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 block">
                            ↳ {tx.sub_category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.account.name}</td>
                      <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${tx.transaction_type.name.toLowerCase().includes('receita') || tx.transaction_type.name.toLowerCase().includes('venda') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(tx)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1" title="Edit">✏️</button>
                        <button onClick={() => handleDeleteOneClick(tx.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (<tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">No transactions found.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINAÇÃO */}
          <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
            <span className="text-sm text-gray-700 dark:text-gray-300">Page <span className="font-semibold text-gray-900 dark:text-white">{data?.page}</span> of <span className="font-semibold text-gray-900 dark:text-white">{data?.pages}</span></span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
              <button onClick={() => setPage(p => (data && p < data.pages ? p + 1 : p))} disabled={!data || page >= data.pages} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
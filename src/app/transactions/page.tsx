'use client';

import { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback
import { useRouter } from 'next/navigation';

// --- CONFIGURAÇÃO ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// --- INTERFACES ---
interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    account_id: number;
    transaction_type_id: number;
    sub_category_id?: number | null;
    asset_id?: number | null;
    quantity?: number | null;
    transaction_type: { name: string; is_investment: boolean };
    sub_category?: { name: string; category_id: number };
    asset?: { symbol: string };
}

interface Category {
    id: number;
    name: string;
    sub_categories: { id: number; name: string }[];
}

export default function TransactionsPage() {
    const router = useRouter();

    // Estados de Dados
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Estados de Paginação e Filtros (NOVO)
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10); // 10 itens por página
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // Valor real usado no fetch
    const [hasMore, setHasMore] = useState(true); // Para saber se desativamos o botão "Seguinte"

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Formatador
    const currencyFormatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

    // 1. EFEITO DE DEBOUNCE (Para a pesquisa não disparar a cada tecla)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Resetar para página 1 ao pesquisar
        }, 500); // Espera 500ms após parar de escrever
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 2. FUNÇÃO DE FETCH CENTRALIZADA
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Calcular o 'skip' com base na página
        const skip = (page - 1) * pageSize;
        
        // Construir URL com parâmetros
        const query = new URLSearchParams({
            skip: skip.toString(),
            limit: pageSize.toString()
        });
        
        if (debouncedSearch) {
            query.append('search', debouncedSearch);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/transactions?${query.toString()}`, { headers });
            
            if (res.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }
            
            if (!res.ok) throw new Error('Erro ao carregar dados');

            const data = await res.json();
            setTransactions(data);
            
            // Lógica simples: se recebemos menos itens que o limite, chegámos ao fim
            setHasMore(data.length === pageSize);

        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, router]);

    // Carregar Categorias (apenas uma vez)
    useEffect(() => {
        const fetchCategories = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/categories`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                if (res.ok) setCategories(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchCategories();
    }, []);

    // Carregar Transações sempre que a página ou pesquisa mudam
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);


    // --- DELETE ---
    const handleDelete = async (id: number) => {
        if (!confirm('Tem a certeza que deseja eliminar?')) return;
        setIsDeleting(id);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Recarregar a página atual para garantir consistência
                fetchTransactions(); 
            } else {
                alert("Não foi possível eliminar.");
            }
        } catch (error) {
            alert("Erro de conexão.");
        } finally {
            setIsDeleting(null);
        }
    };

    // --- UPDATE ---
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;
        setIsSaving(true);
        const token = localStorage.getItem('token');

        const payload = {
            date: editingTx.date,
            description: editingTx.description,
            amount: Number(editingTx.amount),
            account_id: Number(editingTx.account_id),
            transaction_type_id: Number(editingTx.transaction_type_id),
            sub_category_id: editingTx.sub_category_id ? Number(editingTx.sub_category_id) : null,
            asset_id: editingTx.asset_id ? Number(editingTx.asset_id) : null,
            quantity: editingTx.quantity ? Number(editingTx.quantity) : null,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${editingTx.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setEditingTx(null);
                fetchTransactions(); // Atualiza a lista
            } else {
                const err = await res.json();
                alert(`Erro: ${JSON.stringify(err.detail)}`);
            }
        } catch (error) {
            alert("Erro de rede.");
        } finally {
            setIsSaving(false);
        }
    };

    // Styles
    const inputClass = "w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 shadow-sm";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <main className="min-h-screen bg-gray-50 p-6 sm:p-8 text-gray-800 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Movimentos</h1>
                        <p className="text-gray-500 mt-1">Gerencie o seu histórico financeiro.</p>
                    </div>
                    
                    {/* BARRA DE PESQUISA (NOVO) */}
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Pesquisar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white shadow-sm"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
                    <div className="overflow-x-auto flex-grow">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="p-5">Data</th>
                                    <th className="p-5">Descrição</th>
                                    <th className="p-5">Categoria / Ativo</th>
                                    <th className="p-5 text-right">Valor</th>
                                    <th className="p-5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse"><td colSpan={5} className="p-5"><div className="h-4 bg-gray-100 rounded w-full"></div></td></tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium">Nenhum movimento encontrado.</td></tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const isExpense = ['Despesa', 'Compra', 'Saída'].some(t => tx.transaction_type.name.includes(t));
                                        return (
                                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="p-5 text-gray-500 font-medium">{new Date(tx.date).toLocaleDateString('pt-PT')}</td>
                                                <td className="p-5 font-semibold text-gray-900">{tx.description}</td>
                                                <td className="p-5 text-gray-600">
                                                    {tx.asset ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {tx.asset.symbol}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                            {tx.sub_category?.name || 'Geral'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`p-5 text-right font-bold ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {currencyFormatter.format(tx.amount)}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingTx(tx)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg">✏️</button>
                                                        <button onClick={() => handleDelete(tx.id)} disabled={isDeleting === tx.id} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">{isDeleting === tx.id ? '⏳' : '🗑️'}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINAÇÃO (NOVO) */}
                    <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm font-medium text-gray-600">
                            Página {page}
                        </span>
                        <button 
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Seguinte →
                        </button>
                    </div>
                </div>

                {/* MODAL EDIT (MANTIDO IGUAL, SÓ O FORMULÁRIO) */}
                {editingTx && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Editar Transação</h2>
                                <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6 space-y-5">
                                {/* Campos mantidos iguais ao teu original, para brevidade */}
                                <div><label className={labelClass}>Descrição</label><input required type="text" value={editingTx.description} onChange={e => setEditingTx({ ...editingTx, description: e.target.value })} className={inputClass} /></div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className={labelClass}>Data</label><input required type="date" value={editingTx.date} onChange={e => setEditingTx({ ...editingTx, date: e.target.value })} className={inputClass} /></div>
                                    <div><label className={labelClass}>Valor (€)</label><input required type="number" step="0.01" value={editingTx.amount} onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })} className={inputClass} /></div>
                                </div>
                                {!editingTx.asset && (
                                    <div>
                                        <label className={labelClass}>Categoria</label>
                                        <select value={editingTx.sub_category_id || ''} onChange={e => setEditingTx({ ...editingTx, sub_category_id: Number(e.target.value) })} className={inputClass}>
                                            <option value="" disabled>Selecione...</option>
                                            {categories.map(cat => (
                                                <optgroup key={cat.id} label={cat.name}>
                                                    {cat.sub_categories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                                    <button type="button" onClick={() => setEditingTx(null)} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70">{isSaving ? '...' : 'Guardar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
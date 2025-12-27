'use client';

import { useEffect, useState } from 'react';
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
    sub_category_id?: number | null; // Aceitar null explicitamente
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

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null); // ID da tx a ser apagada

    // Formatador de Moeda PT-PT
    const currencyFormatter = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
    });

    // --- FETCH INICIAL ---
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                const [txRes, catRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/transactions`, { headers }),
                    fetch(`${API_BASE_URL}/categories`, { headers })
                ]);

                if (txRes.status === 401 || catRes.status === 401) throw new Error('Unauthorized');
                if (!txRes.ok || !catRes.ok) throw new Error('Erro ao carregar dados');

                setTransactions(await txRes.json());
                setCategories(await catRes.json());
            } catch (error) {
                console.error("Erro de autenticação ou rede:", error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // --- DELETE ---
    const handleDelete = async (id: number) => {
        if (!confirm('Tem a certeza que deseja eliminar? Esta ação é irreversível.')) return;

        setIsDeleting(id);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setTransactions(prev => prev.filter(tx => tx.id !== id));
            } else {
                alert("Não foi possível eliminar a transação.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            setIsDeleting(null);
        }
    };

    // --- UPDATE PROTEGIDO ---
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;

        // --- DIAGNÓSTICO DE ERRO ---
        // Se este log mostrar "undefined", o problema está no fetch inicial (ver passo 2 abaixo)
        console.log("A tentar guardar. Type ID:", editingTx.transaction_type_id);

        // Verificação de Segurança: O ID do tipo é obrigatório
        if (!editingTx.transaction_type_id) {
            alert("Erro Interno: O ID do tipo de transação está em falta. Recarregue a página.");
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem('token');

        const payload = {
            date: editingTx.date,
            description: editingTx.description,
            amount: Number(editingTx.amount),
            account_id: Number(editingTx.account_id),

            // GARANTIA: Se chegámos aqui, isto é um número válido
            transaction_type_id: Number(editingTx.transaction_type_id),

            // Tratamento de opcionais (envia null se estiver vazio)
            sub_category_id: editingTx.sub_category_id ? Number(editingTx.sub_category_id) : null,
            asset_id: editingTx.asset_id ? Number(editingTx.asset_id) : null,
            quantity: editingTx.quantity ? Number(editingTx.quantity) : null,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${editingTx.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingTx(null);
            } else {
                const errorData = await res.json();
                console.error("Backend Error Detalhado:", errorData);
                // Mostra o erro exato no ecrã para facilitar
                alert(`Erro ao guardar: ${JSON.stringify(errorData.detail)}`);
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Erro de rede.");
        } finally {
            setIsSaving(false);
        }
    };

    // Styles
    const inputClass = "w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 shadow-sm";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <main className="min-h-screen bg-gray-50 p-6 sm:p-8 text-gray-800 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Movimentos</h1>
                        <p className="text-gray-500 mt-1">Gerencie o seu histórico financeiro.</p>
                    </div>
                    {/* Placeholder para botão de "Nova Transação" se necessário */}
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
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
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500 animate-pulse">A carregar movimentos...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Sem movimentos registados.</td></tr>
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
                                                        <button
                                                            onClick={() => setEditingTx(tx)}
                                                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tx.id)}
                                                            disabled={isDeleting === tx.id}
                                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Eliminar"
                                                        >
                                                            {isDeleting === tx.id ? '⏳' : '🗑️'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- MODAL DE EDIÇÃO --- */}
                {editingTx && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Editar Transação</h2>
                                <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-5">
                                <div>
                                    <label className={labelClass}>Descrição</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingTx.description}
                                        onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
                                        className={inputClass}
                                        placeholder="Ex: Compras Supermercado"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Data</label>
                                        <input
                                            required
                                            type="date"
                                            value={editingTx.date}
                                            onChange={e => setEditingTx({ ...editingTx, date: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Valor (€)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={editingTx.amount}
                                            onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {!editingTx.asset && (
                                    <div>
                                        <label className={labelClass}>Categoria</label>
                                        <div className="relative">
                                            <select
                                                value={editingTx.sub_category_id || ''}
                                                onChange={e => setEditingTx({ ...editingTx, sub_category_id: Number(e.target.value) })}
                                                className={`${inputClass} appearance-none cursor-pointer`}
                                            >
                                                <option value="" disabled>Selecione uma categoria</option>
                                                {categories.map(cat => (
                                                    <optgroup key={cat.id} label={cat.name}>
                                                        {cat.sub_categories.map(sub => (
                                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTx(null)}
                                        className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                                A guardar...
                                            </>
                                        ) : 'Guardar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
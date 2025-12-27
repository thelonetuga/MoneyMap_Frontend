'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    account_id: number;
    transaction_type_id: number;
    sub_category_id?: number;
    asset_id?: number;
    quantity?: number;
    transaction_type: { name: string; is_investment: boolean };
    sub_category?: { name: string; category_id: number };
    asset?: { symbol: string };
}

interface Category { id: number; name: string; sub_categories: { id: number, name: string }[] }

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [saving, setSaving] = useState(false);

    // --- FETCH PROTEGIDO ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const headers = { 'Authorization': `Bearer ${token}` };

        Promise.all([
            fetch('http://127.0.0.1:8000/transactions', { headers }), // NOVA URL (SEM ID)
            fetch('http://127.0.0.1:8000/categories', { headers })    // NOVA URL (SEM ID)
        ])
            .then(async ([txRes, catRes]) => {
                if (txRes.status === 401 || catRes.status === 401) throw new Error('Unauthorized');
                setTransactions(await txRes.json());
                setCategories(await catRes.json());
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    // --- DELETE PROTEGIDO ---
    const handleDelete = async (id: number) => {
        if (!confirm('Tem a certeza? O saldo será revertido.')) return;
        const token = localStorage.getItem('token');

        await fetch(`http://127.0.0.1:8000/transactions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        setTransactions(prev => prev.filter(tx => tx.id !== id));
    };

    // --- UPDATE PROTEGIDO ---
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;
        setSaving(true);
        const token = localStorage.getItem('token');

        const payload = {
            date: editingTx.date,
            description: editingTx.description,
            amount: Number(editingTx.amount),
            account_id: editingTx.account_id,
            transaction_type_id: editingTx.transaction_type_id,
            sub_category_id: editingTx.sub_category_id || null,
            asset_id: editingTx.asset_id || null,
            quantity: editingTx.quantity || null,
        };

        try {
            const res = await fetch(`http://127.0.0.1:8000/transactions/${editingTx.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingTx(null);
            } else {
                alert("Erro de permissão.");
            }
        } finally { setSaving(false); }
    };

    // Styles
    const inputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900";

    return (
        <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-blue-900">Histórico de Movimentos 📜</h1>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-500 text-sm uppercase">
                            <tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Categoria / Ativo</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? <tr><td colSpan={5} className="p-4 text-center">A carregar...</td></tr> :
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 group">
                                        <td className="p-4 text-gray-500 w-32">{tx.date}</td>
                                        <td className="p-4 font-medium text-gray-900">{tx.description}</td>
                                        <td className="p-4 text-gray-600">
                                            {tx.asset ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{tx.asset.symbol}</span> :
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tx.sub_category?.name || '-'}</span>}
                                        </td>
                                        <td className={`p-4 text-right font-bold w-32 ${['Despesa', 'Compra'].some(t => tx.transaction_type.name.includes(t)) ? 'text-red-600' : 'text-green-600'}`}>{tx.amount.toFixed(2)} €</td>
                                        <td className="p-4 text-center w-24">
                                            <button onClick={() => setEditingTx(tx)} className="text-gray-400 hover:text-blue-600 mr-2">✏️</button>
                                            <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-600">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {editingTx && (
                    <div className="fixed inset-0 bg-gray-900/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Editar Transação ✏️</h2><button onClick={() => setEditingTx(null)}>✕</button></div>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <input required type="text" value={editingTx.description} onChange={e => setEditingTx({ ...editingTx, description: e.target.value })} className={inputClass} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="date" value={editingTx.date} onChange={e => setEditingTx({ ...editingTx, date: e.target.value })} className={inputClass} />
                                    <input required type="number" step="0.01" value={editingTx.amount} onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })} className={inputClass} />
                                </div>
                                {!editingTx.asset && (
                                    <select value={editingTx.sub_category_id || ''} onChange={e => setEditingTx({ ...editingTx, sub_category_id: Number(e.target.value) })} className={inputClass}>
                                        {categories.map(cat => (<optgroup key={cat.id} label={cat.name}>{cat.sub_categories.map(sub => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}</optgroup>))}
                                    </select>
                                )}
                                <div className="flex justify-end gap-3 mt-4"><button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold">Guardar</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
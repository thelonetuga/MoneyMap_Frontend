'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface SubCategory { id: number; name: string; }
interface Category { id: number; name: string; subcategories: SubCategory[]; }
interface Account { id: number; name: string; }

export default function AddTransactionPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    // Form
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [typeId, setTypeId] = useState('1'); 
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subCategoryId, setSubCategoryId] = useState('');
    
    const [loading, setLoading] = useState(true);

    const availableSubCategories = categories.find(c => c.id === parseInt(categoryId))?.subcategories || [];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, catRes] = await Promise.all([api.get('/accounts/'), api.get('/categories/')]);
                setAccounts(accRes.data);
                setCategories(catRes.data);
                if (accRes.data.length > 0) setAccountId(accRes.data[0].id.toString());
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Se for despesa (tipo 1), converter para negativo se o user meteu positivo
            let finalAmount = parseFloat(amount);
            if (typeId === '1' && finalAmount > 0) finalAmount = -finalAmount;

            const payload: any = {
                description,
                amount: finalAmount,
                date,
                transaction_type_id: parseInt(typeId),
                account_id: parseInt(accountId),
                category_id: categoryId ? parseInt(categoryId) : null,
                sub_category_id: subCategoryId ? parseInt(subCategoryId) : null, // Backend usa este nome no schema de create
            };

            if (typeId === '3') { // Investimento
                payload.symbol = symbol;
                payload.quantity = parseFloat(quantity);
            }

            await api.post('/transactions/', payload);
            router.push('/');
        } catch (err) { alert('Erro ao criar transação.'); setLoading(false); }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium";

    if (loading) return <div className="p-10 text-center">A carregar...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Nova Transação</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <select value={typeId} onChange={e => setTypeId(e.target.value)} className={inputClass}>
                            <option value="1">📉 Despesa</option><option value="2">📈 Receita</option><option value="3">🏦 Investimento</option>
                        </select>
                        <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputClass} placeholder="Valor" />
                    </div>

                    {typeId === '3' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
                            <input placeholder="Símbolo (AAPL)" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className={inputClass} />
                            <input type="number" placeholder="Qtd" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} />
                        </div>
                    )}

                    <input required value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="Descrição" />

                    <div className="grid grid-cols-2 gap-4">
                        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }} className={inputClass}>
                            <option value="">- Categoria -</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} className={inputClass} disabled={availableSubCategories.length === 0}>
                            <option value="">- Sub -</option>
                            {availableSubCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputClass}>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Guardar</button>
                </form>
            </div>
        </main>
    );
}
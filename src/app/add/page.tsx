'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface SubCategory {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    // CORREÇÃO: subcategories
    subcategories: SubCategory[]; 
}

interface Account {
    id: number;
    name: string;
}

export default function AddTransactionPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
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
    const [error, setError] = useState('');

    // CORREÇÃO: Aceder a .subcategories
    const availableSubCategories = categories.find(c => c.id === parseInt(categoryId))?.subcategories || [];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, catRes] = await Promise.all([
                    api.get('/accounts/'),
                    api.get('/categories/')
                ]);
                setAccounts(accRes.data);
                setCategories(catRes.data);
                
                if (accRes.data.length > 0) setAccountId(accRes.data[0].id.toString());
                if (catRes.data.length > 0) setCategoryId(catRes.data[0].id.toString());
                setSubCategoryId('');
                
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar dados.');
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!accountId) { setError('Selecione uma conta.'); setLoading(false); return; }

        try {
            const payload: any = {
                description,
                amount: parseFloat(amount),
                date,
                transaction_type_id: parseInt(typeId),
                account_id: parseInt(accountId),
                category_id: categoryId ? parseInt(categoryId) : null,
                sub_category_id: subCategoryId ? parseInt(subCategoryId) : null,
            };

            if (typeId === '3') {
                if (!symbol || !quantity) {
                    setError('Indique o Símbolo e a Quantidade.');
                    setLoading(false); return;
                }
                payload.symbol = symbol;
                payload.quantity = parseFloat(quantity);
            }

            await api.post('/transactions/', payload);
            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError('Erro ao criar transação.');
        } finally { setLoading(false); }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2 ml-1";

    if (loading) return <div className="p-10 text-center text-gray-400">A carregar...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Nova Transação</h1>
                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select value={typeId} onChange={e => setTypeId(e.target.value)} className={inputClass}>
                                <option value="1">📉 Despesa</option>
                                <option value="2">📈 Receita</option>
                                <option value="3">🏦 Investimento</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Valor (€)</label>
                            <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    {typeId === '3' && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Símbolo</label><input placeholder="AAPL" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className={inputClass} /></div>
                                <div><label className={labelClass}>Qtd</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} /></div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Descrição</label>
                        <input required value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Categoria</label>
                            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }} className={inputClass}>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Subcategoria</label>
                            <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} className={inputClass} disabled={availableSubCategories.length === 0}>
                                <option value="">- Nenhuma -</option>
                                {availableSubCategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className={labelClass}>Conta</label>
                            <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputClass}>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Guardar</button>
                </form>
            </div>
        </main>
    );
}
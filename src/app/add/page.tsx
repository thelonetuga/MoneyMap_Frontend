'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Account { id: number; name: string; }
interface Type { id: number; name: string; is_investment: boolean; }
interface Asset { id: number; symbol: string; name: string; }
interface SubCategory { id: number; name: string; }
interface Category { id: number; name: string; sub_categories: SubCategory[]; }

export default function AddTransactionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<{ accounts: Account[], types: Type[], categories: Category[], assets: Asset[] }>({
        accounts: [], types: [], categories: [], assets: []
    });

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '', amount: '', account_id: '', transaction_type_id: '',
        category_id: '', sub_category_id: '', asset_id: '', quantity: '', price_per_unit: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };

        Promise.all([
            fetch('http://127.0.0.1:8000/accounts', { headers }),
            fetch('http://127.0.0.1:8000/lookups/transaction-types'),
            fetch('http://127.0.0.1:8000/categories', { headers }),
            fetch('http://127.0.0.1:8000/assets/')
        ]).then(async ([acc, typ, cat, ass]) => {
            if (acc.status === 401) throw new Error("Unauthorized");
            setData({
                accounts: await acc.json(),
                types: await typ.json(),
                categories: await cat.json(),
                assets: await ass.json()
            });
            setLoading(false);
        }).catch(() => router.push('/login'));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');

        const selectedType = data.types.find(t => t.id === Number(formData.transaction_type_id));
        const isInvestment = selectedType?.is_investment;

        const payload: any = {
            date: formData.date, description: formData.description, amount: Number(formData.amount),
            account_id: Number(formData.account_id), transaction_type_id: Number(formData.transaction_type_id),
        };

        if (isInvestment) {
            payload.asset_id = Number(formData.asset_id);
            payload.quantity = Number(formData.quantity);
            payload.price_per_unit = formData.price_per_unit ? Number(formData.price_per_unit) : (Number(formData.amount) / Number(formData.quantity));
        } else {
            payload.sub_category_id = Number(formData.sub_category_id);
        }

        await fetch('http://127.0.0.1:8000/transactions/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        router.push('/transactions');
        router.refresh();
    };

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    if (loading) return <div className="flex h-screen items-center justify-center">A carregar...</div>;

    const isInv = data.types.find(t => t.id === Number(formData.transaction_type_id))?.is_investment;
    const cats = data.categories.find(c => c.id === Number(formData.category_id))?.sub_categories || [];
    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium";

    return (
        <main className="min-h-screen bg-gray-50/50 p-6 flex justify-center pt-12">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">Nova Transação 💸</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <input required name="description" placeholder="Descrição" className={`md:col-span-2 ${inputClass}`} onChange={handleChange} />
                        <input required name="amount" type="number" step="0.01" placeholder="Valor (€)" className={inputClass} onChange={handleChange} />
                        <input required name="date" type="date" value={formData.date} className={inputClass} onChange={handleChange} />
                        <select required name="account_id" className={inputClass} onChange={handleChange}><option value="">Conta...</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                        <select required name="transaction_type_id" className={inputClass} onChange={handleChange}><option value="">Tipo...</option>{data.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    </div>

                    {isInv ? (
                        <div className="p-6 bg-blue-50 rounded-2xl grid md:grid-cols-2 gap-6">
                            <select required name="asset_id" className={`md:col-span-2 ${inputClass}`} onChange={handleChange}><option value="">Ativo...</option>{data.assets.map(a => <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>)}</select>
                            <input required name="quantity" type="number" placeholder="Quantidade" className={inputClass} onChange={handleChange} />
                            <input name="price_per_unit" type="number" placeholder="Preço/Unidade (Opcional)" className={inputClass} onChange={handleChange} />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <select required={!isInv} name="category_id" className={inputClass} onChange={handleChange}><option value="">Categoria...</option>{data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                            <select required={!isInv} name="sub_category_id" className={inputClass} disabled={!formData.category_id} onChange={handleChange}><option value="">Sub-Categoria...</option>{cats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                    )}
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black">{submitting ? 'A guardar...' : 'Guardar'}</button>
                </form>
            </div>
        </main>
    );
}
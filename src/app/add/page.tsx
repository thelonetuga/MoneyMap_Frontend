'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface Category {
    id: number;
    name: string;
}

interface Account {
    id: number;
    name: string;
}

export default function AddTransactionPage() {
    const router = useRouter();
    
    // Estados para os Dropdowns
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    // Estados do Formulário
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [typeId, setTypeId] = useState('1'); // 1=Despesa, 2=Receita (Default: Despesa)
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Carregar Contas e Categorias em paralelo
                const [accRes, catRes] = await Promise.all([
                    api.get('/accounts/'),
                    api.get('/categories/')
                ]);

                setAccounts(accRes.data);
                setCategories(catRes.data);
                
                // Selecionar a primeira conta por defeito se existir
                if (accRes.data.length > 0) setAccountId(accRes.data[0].id.toString());
                // Selecionar a primeira categoria se existir
                if (catRes.data.length > 0) setCategoryId(catRes.data[0].id.toString());

            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setError('Não foi possível carregar as contas ou categorias.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/transactions/', {
                description,
                amount: parseFloat(amount),
                date,
                transaction_type_id: parseInt(typeId),
                account_id: parseInt(accountId),
                category_id: parseInt(categoryId),
                // sub_category_id: null // Pode ser adicionado futuramente
            });

            // Sucesso! Voltar ao Dashboard
            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError('Erro ao criar transação. Verifique os dados.');
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2 ml-1";

    if (loading && accounts.length === 0) return <div className="p-10 text-center text-gray-500">A carregar dados... ⏳</div>;

    return (
        <main className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
                
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Nova Transação</h1>
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 font-bold text-sm">Cancel</button>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Linha 1: Tipo e Valor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select 
                                value={typeId} 
                                onChange={e => setTypeId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="1">📉 Despesa</option>
                                <option value="2">📈 Receita</option>
                                <option value="3">🏦 Investimento</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Valor (€)</label>
                            <input 
                                required
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className={labelClass}>Descrição</label>
                        <input 
                            required
                            type="text" 
                            placeholder="Ex: Supermercado, Salário..." 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Linha 2: Categoria e Conta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Categoria</label>
                            <select 
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className={inputClass}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Conta</label>
                            <select 
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className={inputClass}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Data */}
                    <div>
                        <label className={labelClass}>Data</label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-4 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'A guardar...' : 'Guardar Transação ✅'}
                    </button>
                </form>
            </div>
        </main>
    );
}
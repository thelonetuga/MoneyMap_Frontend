'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

// --- INTERFACES ---
interface SubCategory {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    sub_categories: SubCategory[]; // Backend devolve isto aninhado
}

interface Account {
    id: number;
    name: string;
    current_balance: number;
    account_type: { name: string };
}

export default function SettingsPage() {
    // --- ESTADOS ---
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'categories'>('accounts');

    // Perfil
    const [firstName, setFirstName] = useState('');
    const [currency, setCurrency] = useState('EUR');

    // Contas
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [newAccName, setNewAccName] = useState('');
    const [newAccBalance, setNewAccBalance] = useState('');
    const [newAccType, setNewAccType] = useState('1'); // 1=Banco, 2=Corretora

    // Categorias
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newSubName, setNewSubName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null); // Para abrir acordeão

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [userRes, accRes, catRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/accounts/'),
                api.get('/categories/')
            ]);

            // Perfil
            if (userRes.data.profile) {
                setFirstName(userRes.data.profile.first_name);
                setCurrency(userRes.data.profile.preferred_currency);
            }
            // Contas
            setAccounts(accRes.data);
            // Categorias
            setCategories(catRes.data);

        } catch (err) {
            console.error("Erro ao carregar definições:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS: PERFIL ---
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/users/me', { first_name: firstName, preferred_currency: currency });
            alert('Perfil atualizado! ✅');
        } catch (err) { alert('Erro ao guardar perfil ❌'); }
    };

    // --- HANDLERS: CONTAS ---
    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccName) return;
        try {
            const res = await api.post('/accounts/', {
                name: newAccName,
                account_type_id: parseInt(newAccType),
                current_balance: parseFloat(newAccBalance) || 0
            });
            setAccounts([...accounts, res.data]);
            setNewAccName('');
            setNewAccBalance('');
        } catch (err) { alert('Erro ao criar conta ❌'); }
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Tem a certeza? Apagar uma conta apaga todas as transações dela!')) return;
        try {
            // Nota: O backend precisa de suportar DELETE /accounts/{id}
            // Se não suportar, vai dar erro 405.
            await api.delete(`/accounts/${id}`); 
            setAccounts(accounts.filter(a => a.id !== id));
        } catch (err) { alert('Erro ao apagar conta (verifique se tem permissão) ❌'); }
    };

    // --- HANDLERS: CATEGORIAS ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName) return;
        try {
            const res = await api.post('/categories/', { name: newCatName });
            // O backend devolve a categoria criada (sub_categories virá vazio ou null)
            const newCat = { ...res.data, sub_categories: [] }; 
            setCategories([...categories, newCat]);
            setNewCatName('');
        } catch (err) { alert('Erro ao criar categoria ❌'); }
    };

    const handleCreateSubCategory = async (catId: number) => {
        if (!newSubName) return;
        try {
            const res = await api.post('/categories/subcategories', {
                name: newSubName,
                category_id: catId
            });
            
            // Atualizar estado local
            setCategories(categories.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, sub_categories: [...(cat.sub_categories || []), res.data] };
                }
                return cat;
            }));
            setNewSubName('');
        } catch (err) { alert('Erro ao criar subcategoria ❌'); }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Apagar categoria?')) return;
        try {
            // Nota: Backend precisa de DELETE /categories/{id}
            await api.delete(`/categories/${id}`); 
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) { alert('Não foi possível apagar.'); }
    };

    // --- UI HELPERS ---
    const tabClass = (tab: string) => 
        `px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-white text-gray-500 hover:bg-gray-50'}`;

    const inputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium";

    if (loading) return <div className="p-10 text-center text-gray-400">A carregar definições... ⚙️</div>;

    return (
        <main className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Centro de Controlo 🛠️</h1>

            {/* TAB SELECTOR */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>🏦 Contas</button>
                <button onClick={() => setActiveTab('categories')} className={tabClass('categories')}>🏷️ Categorias</button>
                <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>👤 Perfil</button>
            </div>

            {/* --- TAB: CONTAS --- */}
            {activeTab === 'accounts' && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Lista */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-700">As Minhas Contas</h2>
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">{acc.name}</p>
                                    <p className="text-sm text-gray-500">{acc.account_type?.name || 'Conta'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${acc.current_balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {acc.current_balance.toFixed(2)} €
                                    </p>
                                    {/* Botão Apagar (Comentado se não tiveres DELETE implementado no backend ainda) */}
                                    {/* <button onClick={() => handleDeleteAccount(acc.id)} className="text-xs text-red-400 hover:underline">Apagar</button> */}
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && <p className="text-gray-400 italic">Nenhuma conta criada.</p>}
                    </div>

                    {/* Criar Nova */}
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 h-fit">
                        <h2 className="text-xl font-bold text-blue-600 mb-6">+ Nova Conta</h2>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome</label>
                                <input placeholder="Ex: Banco BPI" value={newAccName} onChange={e => setNewAccName(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                                <select value={newAccType} onChange={e => setNewAccType(e.target.value)} className={inputClass}>
                                    <option value="1">🏦 Conta Bancária</option>
                                    <option value="2">📈 Investimento</option>
                                    <option value="3">💵 Carteira / Dinheiro</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Saldo Inicial</label>
                                <input type="number" placeholder="0.00" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} className={inputClass} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Criar Conta</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- TAB: CATEGORIAS --- */}
            {activeTab === 'categories' && (
                <div className="grid md:grid-cols-2 gap-8">
                     {/* Lista */}
                     <div className="space-y-3">
                        <h2 className="text-xl font-bold text-gray-700">Estrutura de Despesas</h2>
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Cabeçalho da Categoria */}
                                <div 
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                                >
                                    <span className="font-bold text-gray-800">{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{cat.sub_categories?.length || 0} sub</span>
                                        <span className="text-gray-300">{selectedCatId === cat.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Subcategorias (Expansível) */}
                                {selectedCatId === cat.id && (
                                    <div className="bg-gray-50 p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {cat.sub_categories?.map(sub => (
                                                <span key={sub.id} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                                                    {sub.name}
                                                </span>
                                            ))}
                                            {(!cat.sub_categories || cat.sub_categories.length === 0) && <span className="text-sm text-gray-400 italic">Sem subcategorias</span>}
                                        </div>
                                        
                                        {/* Adicionar Subcategoria */}
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="Nova subcategoria..." 
                                                value={newSubName} 
                                                onChange={e => setNewSubName(e.target.value)}
                                                className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                            />
                                            <button 
                                                onClick={() => handleCreateSubCategory(cat.id)}
                                                className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-black"
                                            >
                                                +
                                            </button>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                                             <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-500 hover:underline">Apagar Categoria</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Criar Nova Categoria */}
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 h-fit sticky top-24">
                        <h2 className="text-xl font-bold text-blue-600 mb-6">+ Nova Categoria</h2>
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                            <input 
                                placeholder="Nome da Categoria (ex: Casa)" 
                                value={newCatName} 
                                onChange={e => setNewCatName(e.target.value)} 
                                className={inputClass} 
                            />
                            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                                +
                            </button>
                        </form>
                        <p className="mt-4 text-sm text-gray-500">
                            Crie categorias gerais aqui (ex: Alimentação, Transportes) e adicione as específicas (ex: Restaurantes, Uber) clicando na lista à esquerda.
                        </p>
                    </div>
                </div>
            )}

            {/* --- TAB: PERFIL --- */}
            {activeTab === 'profile' && (
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                     <h2 className="text-xl font-bold text-gray-700 mb-6">Editar Perfil</h2>
                     <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome de Exibição</label>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Moeda Principal</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">Dólar ($)</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Guardar Alterações</button>
                    </form>
                </div>
            )}
        </main>
    );
}
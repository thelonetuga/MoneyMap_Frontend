'use client';

import { useState, useEffect } from 'react';
import api, { deleteAccount, getRules, createRule, deleteRule, exportTransactions, Rule } from '@/services/api';
import { useAuth } from '@/context/AuthContext'; // Importar useAuth

// --- INTERFACES ---
interface SubCategory {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    subcategories: SubCategory[];
}

interface Account {
    id: number;
    name: string;
    current_balance: number;
    account_type: { name: string };
}

export default function SettingsPage() {
    const { user } = useAuth(); // Obter o utilizador do contexto
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'categories' | 'rules' | 'data'>('accounts');

    // Estados Globais
    const [firstName, setFirstName] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    
    // Inputs Contas/Categorias
    const [newAccName, setNewAccName] = useState('');
    const [newAccBalance, setNewAccBalance] = useState('');
    const [newAccType, setNewAccType] = useState('1');
    const [newCatName, setNewCatName] = useState('');
    const [newSubName, setNewSubName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

    // Inputs Regras
    const [newRulePattern, setNewRulePattern] = useState('');
    const [newRuleCatId, setNewRuleCatId] = useState('');

    // Import/Export State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importAccount, setImportAccount] = useState<string>('');
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [importLoading, setImportLoading] = useState(false);

    const canAccessPremium = user?.role === 'admin' || user?.role === 'premium';

    useEffect(() => { loadAllData(); }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [userRes, accRes, catRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/accounts/'),
                api.get('/categories/')
            ]);

            if (userRes.data.profile) {
                setFirstName(userRes.data.profile.first_name);
                setCurrency(userRes.data.profile.preferred_currency);
            }
            setAccounts(accRes.data);
            setCategories(catRes.data);
            if (accRes.data.length > 0) setImportAccount(String(accRes.data[0].id));
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    // Carregar regras apenas quando a tab é aberta
    useEffect(() => {
        if (activeTab === 'rules' && canAccessPremium) {
            getRules().then(setRules).catch(console.error);
        }
    }, [activeTab, canAccessPremium]);

    // --- HANDLERS ---

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/users/me', { first_name: firstName, preferred_currency: currency });
            alert('Perfil atualizado! ✅');
        } catch (err) { alert('Erro ao guardar perfil.'); }
    };

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
            setNewAccName(''); setNewAccBalance('');
        } catch (err) { alert('Erro ao criar conta.'); }
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Tem a certeza que deseja apagar esta conta? Todas as transações associadas serão perdidas.')) return;
        try {
            await deleteAccount(id);
            setAccounts(accounts.filter(acc => acc.id !== id));
        } catch (err) { 
            console.error(err);
            alert('Erro ao apagar conta. Verifique se existem dependências.'); 
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName) return;
        try {
            const res = await api.post('/categories/', { name: newCatName });
            setCategories([...categories, { ...res.data, subcategories: [] }]);
            setNewCatName('');
        } catch (err) { alert('Erro ao criar categoria.'); }
    };

    const handleCreateSubCategory = async (catId: number) => {
        if (!newSubName) return;
        try {
            const res = await api.post('/categories/subcategories', { name: newSubName, category_id: catId });
            setCategories(categories.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, subcategories: [...(cat.subcategories || []), res.data] };
                }
                return cat;
            }));
            setNewSubName('');
        } catch (err) { alert('Erro ao criar subcategoria.'); }
    };

    const handleDeleteSubCategory = async (subId: number, catId: number) => {
        if (!confirm('Apagar subcategoria?')) return;
        try {
            await api.delete(`/categories/subcategories/${subId}`);
            setCategories(categories.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, subcategories: cat.subcategories.filter(s => s.id !== subId) };
                }
                return cat;
            }));
        } catch (err) { alert('Não é possível apagar: esta subcategoria tem transações associadas.'); }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Apagar categoria?')) return;
        try {
            await api.delete(`/categories/${id}`); 
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) { alert('Erro: Verifique se a categoria tem transações.'); }
    };

    // --- REGRAS ---
    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRulePattern || !newRuleCatId) return;
        try {
            const newRule = await createRule(newRulePattern, Number(newRuleCatId));
            // Enriquecer com nome da categoria para display
            const catName = categories.find(c => c.id === Number(newRuleCatId))?.name;
            setRules([...rules, { ...newRule, category_name: catName }]);
            setNewRulePattern('');
            setNewRuleCatId('');
        } catch (err) { alert('Erro ao criar regra.'); }
    };

    const handleDeleteRule = async (id: number) => {
        try {
            await deleteRule(id);
            setRules(rules.filter(r => r.id !== id));
        } catch (err) { alert('Erro ao apagar regra.'); }
    };

    // --- IMPORT / EXPORT ---
    const handleDownloadTemplate = () => {
        const headers = "date,description,amount,category";
        
        // Gerar linhas de exemplo com categorias reais do utilizador
        let csvContent = "data:text/csv;charset=utf-8," + headers + "\n";
        
        // Adicionar exemplos genéricos
        csvContent += "2024-01-01,Exemplo Despesa,-10.50,Alimentação\n";
        
        // Adicionar exemplos com as categorias do utilizador (se existirem)
        if (categories.length > 0) {
            categories.slice(0, 5).forEach(cat => {
                csvContent += `2024-01-01,Exemplo ${cat.name},-20.00,${cat.name}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_importacao.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile || !importAccount) return;

        setImportLoading(true);
        setImportStatus(null);

        const formData = new FormData();
        formData.append('file', importFile);
        
        try {
            const res = await api.post(`/imports/upload?account_id=${importAccount}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportStatus({ type: 'success', msg: `Sucesso! ${res.data.added} transações importadas.` });
            setImportFile(null); 
        } catch (err: any) {
            console.error(err);
            setImportStatus({ type: 'error', msg: err.response?.data?.detail || 'Erro ao importar ficheiro.' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportTransactions();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `moneymap_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) { alert('Erro ao exportar dados.'); }
    };

    // --- UI ---
    const tabClass = (tab: string) => `px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`;
    const inputClass = "w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium dark:text-white";

    if (loading) return <div className="p-10 text-center text-gray-400">A carregar... ⚙️</div>;

    return (
        <main className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Centro de Controlo 🛠️</h1>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>🏦 Contas</button>
                <button onClick={() => setActiveTab('categories')} className={tabClass('categories')}>🏷️ Categorias</button>
                {canAccessPremium && <button onClick={() => setActiveTab('rules')} className={tabClass('rules')}>🤖 Regras</button>}
                {canAccessPremium && <button onClick={() => setActiveTab('data')} className={tabClass('data')}>💾 Dados</button>}
                <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>👤 Perfil</button>
            </div>

            {/* TAB CONTAS */}
            {activeTab === 'accounts' && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                                <div><p className="font-bold text-gray-800 dark:text-white">{acc.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{acc.account_type?.name}</p></div>
                                <div className="flex items-center gap-4">
                                    <p className={`font-bold ${acc.current_balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{acc.current_balance.toFixed(2)} €</p>
                                    <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Apagar Conta">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && <p className="text-gray-400 italic text-center">Sem contas criadas.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-blue-600 mb-6">+ Nova Conta</h2>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <input placeholder="Nome" value={newAccName} onChange={e => setNewAccName(e.target.value)} className={inputClass} />
                            <select value={newAccType} onChange={e => setNewAccType(e.target.value)} className={inputClass}>
                                <option value="1">🏦 Conta Bancária</option><option value="2">📈 Investimento</option><option value="3">💵 Carteira</option>
                            </select>
                            <input type="number" placeholder="Saldo Inicial" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} className={inputClass} />
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Criar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB CATEGORIAS */}
            {activeTab === 'categories' && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}>
                                    <span className="font-bold text-gray-800 dark:text-white">{cat.name}</span>
                                    <span className="text-xs text-gray-400">{cat.subcategories?.length || 0} sub ▼</span>
                                </div>
                                {selectedCatId === cat.id && (
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {cat.subcategories?.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 group">
                                                    {sub.name}
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSubCategory(sub.id, cat.id); }} className="ml-1 text-gray-300 hover:text-red-500 font-bold px-1 rounded-full">×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input placeholder="Nova sub..." value={newSubName} onChange={e => setNewSubName(e.target.value)} className={`flex-1 p-2 rounded-lg text-sm outline-none ${inputClass}`} />
                                            <button onClick={() => handleCreateSubCategory(cat.id)} className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm font-bold rounded-lg">+</button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right"><button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-500 hover:underline">Apagar Categoria</button></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-24">
                        <h2 className="text-xl font-bold text-blue-600 mb-6">+ Nova Categoria</h2>
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                            <input placeholder="Nome" value={newCatName} onChange={e => setNewCatName(e.target.value)} className={inputClass} />
                            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">+</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB REGRAS (NOVO) */}
            {activeTab === 'rules' && canAccessPremium && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Se contiver:</p>
                                    <p className="font-bold text-gray-800 dark:text-white">"{rule.pattern}"</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg">
                                        ➜ {rule.category_name || categories.find(c => c.id === rule.category_id)?.name || 'Categoria'}
                                    </span>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-300 hover:text-red-500">×</button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && <p className="text-gray-400 italic text-center">Sem regras de automação.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-blue-600 mb-6">Nova Regra 🤖</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Categoriza automaticamente transações importadas.</p>
                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <input placeholder="Texto a procurar (ex: Uber)" value={newRulePattern} onChange={e => setNewRulePattern(e.target.value)} className={inputClass} />
                            <select value={newRuleCatId} onChange={e => setNewRuleCatId(e.target.value)} className={inputClass}>
                                <option value="">Selecionar Categoria...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Criar Regra</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB DADOS (IMPORT/EXPORT) */}
            {activeTab === 'data' && canAccessPremium && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* IMPORTAR */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-700 dark:text-white">Importar Extrato 📂</h2>
                            <button onClick={handleDownloadTemplate} className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                                📥 Baixar Template
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Carregue ficheiros .CSV ou .XLSX.</p>

                        <form onSubmit={handleImportUpload} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Para a Conta</label>
                                <select value={importAccount} onChange={(e) => setImportAccount(e.target.value)} className={inputClass}>
                                    {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                                <input type="file" accept=".csv, .xlsx" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="space-y-2">
                                    <span className="text-4xl">📄</span>
                                    <p className="font-medium text-gray-600 dark:text-gray-300">{importFile ? importFile.name : "Arraste ou clique"}</p>
                                </div>
                            </div>

                            {importStatus && (
                                <div className={`p-4 rounded-xl text-sm font-bold text-center ${importStatus.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {importStatus.msg}
                                </div>
                            )}

                            <button type="submit" disabled={!importFile || importLoading || !importAccount} className={`w-full py-4 rounded-2xl text-white font-bold transition-all ${!importFile || importLoading ? 'bg-gray-300 dark:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>
                                {importLoading ? 'A processar...' : 'Importar Agora'}
                            </button>
                        </form>
                    </div>

                    {/* EXPORTAR */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">Exportar Dados 📤</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Faça backup de todas as suas transações.</p>
                        
                        <button onClick={handleExport} className="w-full py-4 bg-gray-800 dark:bg-gray-700 text-white font-bold rounded-2xl hover:bg-black dark:hover:bg-gray-600 transition-all shadow-lg flex items-center justify-center gap-2">
                            <span>Descarregar CSV</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB PERFIL */}
            {activeTab === 'profile' && (
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                     <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-6">Editar Perfil</h2>
                     <form onSubmit={handleSaveProfile} className="space-y-4">
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="Nome" />
                        <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}><option value="EUR">Euro (€)</option><option value="USD">Dólar ($)</option></select>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Guardar</button>
                    </form>
                </div>
            )}
        </main>
    );
}
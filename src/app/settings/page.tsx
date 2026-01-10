'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { deleteAccount, getRules, createRule, deleteRule, exportTransactions, updateAccountBalance, getTags, createTag, deleteTag, getRecurringTransactions, deleteRecurringTransaction } from '@/services/api';
import { Tag, RecurringTransaction, Rule } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';

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
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true); // Usado para o estado local de carregamento de dados
    const [activeTab, setActiveTab] = useState<'accounts' | 'categories' | 'tags' | 'recurring' | 'rules' | 'data'>('accounts');

    // Estados Globais
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    
    // Inputs Contas/Categorias
    const [newAccName, setNewAccName] = useState('');
    const [newAccBalance, setNewAccBalance] = useState('');
    const [newAccType, setNewAccType] = useState('1');
    const [newCatName, setNewCatName] = useState('');
    const [newSubName, setNewSubName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

    // Inputs Tags
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#00DC82');

    // Estado de Edição de Saldo
    const [editingBalanceId, setEditingBalanceId] = useState<number | null>(null);
    const [editBalanceValue, setEditBalanceValue] = useState('');

    // Inputs Regras
    const [newRulePattern, setNewRulePattern] = useState('');
    const [newRuleCatId, setNewRuleCatId] = useState('');

    // Import/Export State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importAccount, setImportAccount] = useState<string>('');
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [importLoading, setImportLoading] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => void;
    }>({ isOpen: false, title: '', message: '', action: () => {} });

    // PROTEÇÃO DE ROTA
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const canAccessPremium = user?.role === 'admin' || user?.role === 'premium';

    useEffect(() => { 
        if (user) loadAllData(); 
    }, [user]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [accRes, catRes] = await Promise.all([
                api.get('/accounts/'),
                api.get('/categories/')
            ]);

            setAccounts(accRes.data);
            setCategories(catRes.data);
            if (accRes.data.length > 0) setImportAccount(String(accRes.data[0].id));
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    // Carregar dados específicos da tab
    useEffect(() => {
        if (!canAccessPremium || !user) return;
        
        if (activeTab === 'rules') {
            getRules().then(data => setRules(data)).catch(console.error);
        } else if (activeTab === 'tags') {
            getTags().then(data => setTags(data)).catch(console.error);
        } else if (activeTab === 'recurring') {
            getRecurringTransactions().then(data => setRecurring(data)).catch(console.error);
        }
    }, [activeTab, canAccessPremium, user]);

    // --- HANDLERS ---

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
        } catch (err) { alert('Error creating account.'); }
    };

    const handleDeleteAccountClick = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Account?',
            message: 'Are you sure you want to delete this account? All associated transactions will be lost.',
            action: () => executeDeleteAccount(id)
        });
    };

    const executeDeleteAccount = async (id: number) => {
        try {
            await deleteAccount(id);
            setAccounts(accounts.filter(acc => acc.id !== id));
        } catch (err) { 
            console.error(err);
            alert('Error deleting account. Check for dependencies.'); 
        }
    };

    const startEditingBalance = (acc: Account) => {
        setEditingBalanceId(acc.id);
        setEditBalanceValue(String(acc.current_balance));
    };

    const saveNewBalance = async (id: number) => {
        if (!editBalanceValue || isNaN(Number(editBalanceValue))) return;
        try {
            await updateAccountBalance(id, Number(editBalanceValue));
            setAccounts(accounts.map(acc => acc.id === id ? { ...acc, current_balance: Number(editBalanceValue) } : acc));
            setEditingBalanceId(null);
            alert('Balance adjusted successfully! An adjustment transaction was created.');
        } catch (err) { console.error(err); alert('Error updating balance.'); }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName) return;
        try {
            const res = await api.post('/categories/', { name: newCatName });
            setCategories([...categories, { ...res.data, subcategories: [] }]);
            setNewCatName('');
        } catch (err) { alert('Error creating category.'); }
    };

    const handleCreateSubCategory = async (catId: number) => {
        if (!newSubName) return;
        try {
            const res = await api.post('/categories/subcategories/', { name: newSubName, category_id: catId });
            setCategories(categories.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, subcategories: [...(cat.subcategories || []), res.data] };
                }
                return cat;
            }));
            setNewSubName('');
        } catch (err) { alert('Error creating subcategory.'); }
    };

    const handleDeleteSubCategoryClick = (subId: number, catId: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Subcategory?',
            message: 'Are you sure you want to delete this subcategory?',
            action: () => executeDeleteSubCategory(subId, catId)
        });
    };

    const executeDeleteSubCategory = async (subId: number, catId: number) => {
        try {
            await api.delete(`/categories/subcategories/${subId}/`);
            setCategories(categories.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, subcategories: cat.subcategories.filter(s => s.id !== subId) };
                }
                return cat;
            }));
        } catch (err) { alert('Cannot delete: this subcategory has associated transactions.'); }
    };

    const handleDeleteCategoryClick = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Category?',
            message: 'Are you sure you want to delete this category? If it has transactions, the action will be blocked.',
            action: () => executeDeleteCategory(id)
        });
    };

    const executeDeleteCategory = async (id: number) => {
        try {
            await api.delete(`/categories/${id}/`); 
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) { alert('Error: Check if the category has transactions.'); }
    };

    // --- TAGS ---
    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName) return;
        try {
            const newTag = await createTag(newTagName, newTagColor);
            setTags([...tags, newTag]);
            setNewTagName('');
        } catch (err) { alert('Error creating tag.'); }
    };

    const handleDeleteTagClick = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Tag?',
            message: 'Are you sure you want to delete this tag?',
            action: () => executeDeleteTag(id)
        });
    };

    const executeDeleteTag = async (id: number) => {
        try {
            await deleteTag(id);
            setTags(tags.filter(t => t.id !== id));
        } catch (err) { alert('Error deleting tag.'); }
    };

    // --- RECURRING ---
    const handleDeleteRecurringClick = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancel Recurring Transaction?',
            message: 'This will stop the automatic creation of future transactions. Existing transactions will not be affected.',
            action: () => executeDeleteRecurring(id)
        });
    };

    const executeDeleteRecurring = async (id: number) => {
        try {
            await deleteRecurringTransaction(id);
            setRecurring(recurring.filter(r => r.id !== id));
        } catch (err) { alert('Error cancelling recurrence.'); }
    };

    // --- RULES ---
    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRulePattern || !newRuleCatId) return;
        try {
            const newRule = await createRule(newRulePattern, Number(newRuleCatId));
            const catName = categories.find(c => c.id === Number(newRuleCatId))?.name;
            setRules([...rules, { ...newRule, category_name: catName }]);
            setNewRulePattern('');
            setNewRuleCatId('');
        } catch (err) { alert('Error creating rule.'); }
    };

    const handleDeleteRuleClick = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Rule?',
            message: 'Are you sure you want to delete this automation rule?',
            action: () => executeDeleteRule(id)
        });
    };

    const executeDeleteRule = async (id: number) => {
        try {
            await deleteRule(id);
            setRules(rules.filter(r => r.id !== id));
        } catch (err) { alert('Error deleting rule.'); }
    };

    // --- IMPORT / EXPORT ---
    const handleDownloadTemplate = () => {
        const headers = "date,description,amount,category";
        let csvContent = "data:text/csv;charset=utf-8," + headers + "\n";
        csvContent += "2024-01-01,Example Expense,-10.50,Food\n";
        if (categories.length > 0) {
            categories.slice(0, 5).forEach(cat => {
                csvContent += `2024-01-01,Example ${cat.name},-20.00,${cat.name}\n`;
            });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "import_template.csv");
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
            const res = await api.post(`/imports/upload/?account_id=${importAccount}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportStatus({ type: 'success', msg: `Success! ${res.data.added} transactions imported.` });
            setImportFile(null); 
        } catch (err: any) {
            console.error(err);
            setImportStatus({ type: 'error', msg: err.response?.data?.detail || 'Error importing file.' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportTransactions();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `moneymap_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) { alert('Error exporting data.'); }
    };

    // --- UI ---
    const tabClass = (tab: string) => `px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-accent text-primary shadow-lg shadow-accent/20' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`;
    const inputClass = "w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent font-medium dark:text-white";
    const buttonClass = "w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow";

    // Se estiver a carregar auth ou não houver user, mostra loading ou nada (o useEffect redireciona)
    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
    
    // Se estiver a carregar dados iniciais
    if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading data... ⚙️</div>;

    return (
        <main className="max-w-5xl mx-auto p-6">
            
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                isDanger={true}
            />

            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Control Center 🛠️</h1>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab('accounts')} className={tabClass('accounts')}>🏦 Accounts</button>
                <button onClick={() => setActiveTab('categories')} className={tabClass('categories')}>🏷️ Categories</button>
                {canAccessPremium && <button onClick={() => setActiveTab('tags')} className={tabClass('tags')}>🏷️ Tags</button>}
                {canAccessPremium && <button onClick={() => setActiveTab('recurring')} className={tabClass('recurring')}>🔄 Recurring</button>}
                {canAccessPremium && <button onClick={() => setActiveTab('rules')} className={tabClass('rules')}>🤖 Rules</button>}
                {canAccessPremium && <button onClick={() => setActiveTab('data')} className={tabClass('data')}>💾 Data</button>}
            </div>

            {/* TAB ACCOUNTS */}
            {activeTab === 'accounts' && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                                <div><p className="font-bold text-gray-800 dark:text-white">{acc.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{acc.account_type?.name}</p></div>
                                <div className="flex items-center gap-4">
                                    {editingBalanceId === acc.id ? (
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.01" value={editBalanceValue} onChange={(e) => setEditBalanceValue(e.target.value)} className="w-24 p-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 text-darkText dark:text-lightText outline-none" autoFocus />
                                            <button onClick={() => saveNewBalance(acc.id)} className="text-green-500 hover:text-green-600 font-bold">✓</button>
                                            <button onClick={() => setEditingBalanceId(null)} className="text-red-500 hover:text-red-600 font-bold">✕</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group/balance cursor-pointer" onClick={() => startEditingBalance(acc)}>
                                            <p className={`font-bold ${acc.current_balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{acc.current_balance.toFixed(2)} €</p>
                                            <span className="opacity-0 group-hover/balance:opacity-100 text-xs text-gray-400">✎</span>
                                        </div>
                                    )}
                                    <button onClick={() => handleDeleteAccountClick(acc.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Account">🗑️</button>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && <p className="text-gray-400 italic text-center">No accounts created.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-accent mb-6">+ New Account</h2>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <input placeholder="Name" value={newAccName} onChange={e => setNewAccName(e.target.value)} className={inputClass} />
                            <select value={newAccType} onChange={e => setNewAccType(e.target.value)} className={inputClass}>
                                <option value="1">🏦 Bank Account</option><option value="2">📈 Investment</option><option value="3">💵 Wallet</option>
                            </select>
                            <input type="number" placeholder="Initial Balance" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} className={inputClass} />
                            <button type="submit" className={buttonClass}>Create</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB CATEGORIES */}
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
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSubCategoryClick(sub.id, cat.id); }} className="ml-1 text-gray-300 hover:text-red-500 font-bold px-1 rounded-full">×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input placeholder="New sub..." value={newSubName} onChange={e => setNewSubName(e.target.value)} className={`flex-1 p-2 rounded-lg text-sm outline-none ${inputClass}`} />
                                            <button onClick={() => handleCreateSubCategory(cat.id)} className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600">+</button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right"><button onClick={() => handleDeleteCategoryClick(cat.id)} className="text-xs text-red-500 hover:underline">Delete Category</button></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit sticky top-24">
                        <h2 className="text-xl font-bold text-accent mb-6">+ New Category</h2>
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                            <input placeholder="Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className={inputClass} />
                            <button type="submit" className="px-6 py-3 bg-accent text-primary font-bold rounded-xl hover:bg-accent/90">+</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB TAGS */}
            {activeTab === 'tags' && canAccessPremium && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        {tags.map(tag => (
                            <div key={tag.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                    <p className="font-bold text-gray-800 dark:text-white">{tag.name}</p>
                                </div>
                                <button onClick={() => handleDeleteTagClick(tag.id)} className="text-gray-300 hover:text-red-500">×</button>
                            </div>
                        ))}
                        {tags.length === 0 && <p className="text-gray-400 italic text-center">No tags created.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-accent mb-6">+ New Tag</h2>
                        <form onSubmit={handleCreateTag} className="space-y-4">
                            <input placeholder="Name (e.g. Vacation)" value={newTagName} onChange={e => setNewTagName(e.target.value)} className={inputClass} />
                            <div className="flex items-center gap-2">
                                <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="h-12 w-12 rounded cursor-pointer border-none" />
                                <span className="text-sm text-muted">Tag Color</span>
                            </div>
                            <button type="submit" className={buttonClass}>Create Tag</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB RECURRING */}
            {activeTab === 'recurring' && canAccessPremium && (
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            ℹ️ Here you can manage your automatic transactions. To create a new one, use the <b>"Recurring"</b> option when adding a transaction.
                        </p>
                    </div>
                    
                    <div className="grid gap-4">
                        {recurring.map(rec => (
                            <div key={rec.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 dark:text-white">{rec.description}</p>
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-muted uppercase">{rec.frequency === 'monthly' ? 'Monthly' : rec.frequency === 'weekly' ? 'Weekly' : rec.frequency === 'yearly' ? 'Yearly' : 'Daily'}</span>
                                    </div>
                                    <p className="text-sm text-muted">{rec.amount.toFixed(2)} € • Next: {rec.next_date}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteRecurringClick(rec.id)} 
                                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ))}
                        {recurring.length === 0 && <p className="text-gray-400 italic text-center py-8">No active recurring transactions.</p>}
                    </div>
                </div>
            )}

            {/* TAB RULES */}
            {activeTab === 'rules' && canAccessPremium && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">If contains:</p>
                                    <p className="font-bold text-gray-800 dark:text-white">"{rule.pattern}"</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg">
                                        ➜ {rule.category_name || categories.find(c => c.id === rule.category_id)?.name || 'Category'}
                                    </span>
                                    <button onClick={() => handleDeleteRuleClick(rule.id)} className="text-gray-300 hover:text-red-500">×</button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && <p className="text-gray-400 italic text-center">No automation rules.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-accent mb-6">New Rule 🤖</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Automatically categorize imported transactions.</p>
                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <input placeholder="Text to match (e.g. Uber)" value={newRulePattern} onChange={e => setNewRulePattern(e.target.value)} className={inputClass} />
                            <select value={newRuleCatId} onChange={e => setNewRuleCatId(e.target.value)} className={inputClass}>
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="submit" className={buttonClass}>Create Rule</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB DADOS (IMPORT/EXPORT) */}
            {activeTab === 'data' && canAccessPremium && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* IMPORT */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-700 dark:text-white">Import Statement 📂</h2>
                            <button onClick={handleDownloadTemplate} className="text-accent dark:text-accent text-xs font-bold hover:underline bg-accent/10 px-3 py-1 rounded-full">
                                📥 Download Template
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Upload .CSV or .XLSX files.</p>

                        <form onSubmit={handleImportUpload} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">To Account</label>
                                <select value={importAccount} onChange={(e) => setImportAccount(e.target.value)} className={inputClass}>
                                    {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                                <input type="file" accept=".csv, .xlsx" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="space-y-2">
                                    <span className="text-4xl">📄</span>
                                    <p className="font-medium text-gray-600 dark:text-gray-300">{importFile ? importFile.name : "Drag or click"}</p>
                                </div>
                            </div>

                            {importStatus && (
                                <div className={`p-4 rounded-xl text-sm font-bold text-center ${importStatus.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {importStatus.msg}
                                </div>
                            )}

                            <button type="submit" disabled={!importFile || importLoading || !importAccount} className={`w-full py-4 rounded-2xl text-primary font-bold transition-all ${!importFile || importLoading ? 'bg-gray-300 dark:bg-gray-700' : 'bg-accent hover:bg-accent/90 shadow-lg'}`}>
                                {importLoading ? 'Processing...' : 'Import Now'}
                            </button>
                        </form>
                    </div>

                    {/* EXPORT */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">Export Data 📤</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Backup all your transactions.</p>
                        
                        <button onClick={handleExport} className="w-full py-4 bg-gray-800 dark:bg-gray-700 text-white font-bold rounded-2xl hover:bg-black dark:hover:bg-gray-600 transition-all shadow-lg flex items-center justify-center gap-2">
                            <span>Download CSV</span>
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import api, { createTransaction, transferFunds, getSmartShoppingAnalysis, getTags, createRecurringTransaction } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { SmartShoppingAnalysis, Tag } from '@/types/models';
import Link from 'next/link';
import PremiumLock from '@/components/PremiumLock';

interface Option {
  id: number;
  name: string;
}

interface AccountOption {
  id: number;
  name: string;
  current_balance?: number;
  account_type?: {
    id: number;
    name: string;
  };
}

interface TypeOption {
  id: number;
  name: string;
  is_investment: boolean;
}

interface Category extends Option {
  subcategories?: Option[];
}

const UNITS = [
  { value: 'un', label: 'Unit (un)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (l)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'm', label: 'Meter (m)' },
  { value: 'pack', label: 'Pack' },
];

export default function AddTransaction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true); // Iniciar como true
  const [error, setError] = useState('');
  
  // MODE: 'transaction' or 'transfer'
  const [mode, setMode] = useState<'transaction' | 'transfer'>('transaction');

  // Dropdowns
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form Transaction
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    transaction_type_id: '',
    category_id: '',
    sub_category_id: '',
    symbol: '',
    quantity: '',
    measurement_unit: 'un',
    price_per_unit: '',
    // Recurring
    is_recurring: false,
    frequency: 'monthly',
    // Tags
    tag_ids: [] as number[]
  });

  // Form Transfer
  const [transferData, setTransferData] = useState({
    source_account_id: '',
    destination_account_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Transfer'
  });

  // Smart Shopping State
  const [analysis, setAnalysis] = useState<SmartShoppingAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [typesRes, accountsRes, catsRes] = await Promise.all([
          api.get('/lookups/transaction-types/'),
          api.get('/accounts/'),
          api.get('/categories/')
        ]);

        setTypes(typesRes.data);
        setAccounts(accountsRes.data);
        setCategories(catsRes.data);

        // Load Tags separately if premium
        try {
            const tagsData = await getTags();
            setTags(tagsData);
        } catch (e) {
            // Ignore if not premium
        }

        // Defaults Transaction
        if (typesRes.data.length > 0) setFormData(prev => ({ ...prev, transaction_type_id: String(typesRes.data[0].id) }));
        if (accountsRes.data.length > 0) setFormData(prev => ({ ...prev, account_id: String(accountsRes.data[0].id) }));
        
        // Defaults Transfer
        if (accountsRes.data.length > 0) {
            setTransferData(prev => ({ ...prev, source_account_id: String(accountsRes.data[0].id) }));
        }

      } catch (err) {
        setError("Could not load data. Check connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTER LOGIC (Transaction) ---
  const selectedAccount = accounts.find(a => a.id === Number(formData.account_id));
  const isInvestmentAccount = selectedAccount?.account_type?.name.toLowerCase().includes('investimento');

  const filteredTypes = types.filter(t => {
    if (isInvestmentAccount) return t.is_investment;
    return !t.is_investment;
  });

  useEffect(() => {
    if (mode === 'transaction' && filteredTypes.length > 0) {
      const currentTypeValid = filteredTypes.find(t => t.id === Number(formData.transaction_type_id));
      if (!currentTypeValid) {
        setFormData(prev => ({ ...prev, transaction_type_id: String(filteredTypes[0].id) }));
      }
    }
  }, [formData.account_id, filteredTypes, mode]);

  const formatTypeName = (name: string) => name.replace(' de Ativo', '').replace(' de Ações', '');

  // --- UI LOGIC (Transaction) ---
  const selectedType = types.find(t => t.id === Number(formData.transaction_type_id));
  const isInvestmentType = selectedType?.is_investment || false;
  const isExpense = selectedType?.name.toLowerCase().includes('despesa') || selectedType?.name.toLowerCase().includes('expense');
  const canUseSmartShopping = (user?.role === 'admin' || user?.role === 'premium') && isExpense;
  const canUsePremiumFeatures = user?.role === 'admin' || user?.role === 'premium';
  
  const availableSubCategories = categories.find(c => c.id === Number(formData.category_id))?.subcategories || [];
  const calculatedUnitPrice = (formData.amount && formData.quantity) ? (Math.abs(Number(formData.amount)) / Number(formData.quantity)).toFixed(2) : null;

  // Handlers
  const handleAnalysis = async () => {
    if (!formData.description || !formData.amount || !formData.quantity) {
      setError('Fill Description, Amount and Quantity to analyze.');
      return;
    }
    setAnalysisLoading(true);
    setAnalysis(null);
    setError('');
    try {
      const unitPrice = Math.abs(Number(formData.amount)) / Number(formData.quantity);
      const data = await getSmartShoppingAnalysis(formData.description, unitPrice, formData.measurement_unit);
      setAnalysis(data);
    } catch (err) {
      setError('Could not analyze price.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => {
      const newTags = prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId];
      return { ...prev, tag_ids: newTags };
    });
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.account_id) { setError('Please select an Account.'); setLoading(false); return; }
    
    const payload: any = {
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      account_id: Number(formData.account_id),
      transaction_type_id: Number(formData.transaction_type_id),
      tag_ids: formData.tag_ids
    };

    if (formData.category_id) payload.category_id = Number(formData.category_id);
    if (formData.sub_category_id) payload.sub_category_id = Number(formData.sub_category_id);
    
    if (isInvestmentType) {
      if (!formData.symbol || !formData.quantity) { setError('For investments, fill Ticker and Quantity.'); setLoading(false); return; }
      payload.symbol = String(formData.symbol).toUpperCase(); 
      payload.quantity = Number(formData.quantity);
      if (formData.price_per_unit) payload.price_per_unit = Number(formData.price_per_unit);
    } else if (canUseSmartShopping && formData.quantity) {
      payload.quantity = Number(formData.quantity);
      payload.measurement_unit = formData.measurement_unit;
    }

    try {
      if (formData.is_recurring && canUsePremiumFeatures) {
        await createRecurringTransaction({
          ...payload,
          frequency: formData.frequency,
          start_date: formData.date
        });
      } else {
        await createTransaction(payload);
      }
      finishSubmit();
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred.");
      setLoading(false);
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!transferData.source_account_id || !transferData.destination_account_id || !transferData.amount) {
      setError('Fill all required fields.');
      setLoading(false);
      return;
    }
    if (transferData.source_account_id === transferData.destination_account_id) {
      setError('Source and Destination accounts cannot be the same.');
      setLoading(false);
      return;
    }

    try {
      await transferFunds({
        source_account_id: Number(transferData.source_account_id),
        destination_account_id: Number(transferData.destination_account_id),
        amount: Number(transferData.amount),
        date: transferData.date,
        description: transferData.description
      });
      finishSubmit();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Transfer error.");
      setLoading(false);
    }
  };

  const finishSubmit = async () => {
    await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    await queryClient.invalidateQueries({ queryKey: ['evolution'] });
    await queryClient.invalidateQueries({ queryKey: ['history'] });
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (mode === 'transaction') {
      if (name === 'category_id') {
        setFormData(prev => ({ ...prev, category_id: value, sub_category_id: '' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setTransferData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- VERIFICAÇÃO DE SETUP ---
  if (!loading && (accounts.length === 0 || categories.length === 0)) {
    return (
      <main className="min-h-screen bg-secondary dark:bg-primary p-6 flex items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-primary p-8 rounded-xl shadow-soft max-w-lg w-full border border-secondary dark:border-gray-800 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            ⚠️
          </div>
          <h1 className="text-2xl font-heading font-bold text-darkText dark:text-lightText mb-2">Setup Required</h1>
          <p className="text-muted mb-6">
            Before creating a transaction, you need to set up your <b>Accounts</b> and <b>Categories</b>.
          </p>
          <Link href="/settings" className="block w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow">
            Go to Settings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary dark:bg-primary p-6 flex items-center justify-center transition-colors duration-300">
      <div className="bg-white dark:bg-primary p-8 rounded-xl shadow-soft max-w-lg w-full border border-secondary dark:border-gray-800">
        
        {/* TABS DE MODO */}
        <div className="flex mb-6 bg-secondary dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setMode('transaction')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'transaction' ? 'bg-white dark:bg-gray-700 text-accent shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            New Transaction
          </button>
          <button
            onClick={() => setMode('transfer')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'transfer' ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm' : 'text-muted hover:text-darkText dark:hover:text-lightText'}`}
          >
            Transfer
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* FORMULÁRIO DE TRANSAÇÃO */}
        {mode === 'transaction' && (
          <form onSubmit={handleSubmitTransaction} className="space-y-4 animate-fade-in">
            {/* 1. CONTA */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Account *</label>
              <select name="account_id" required value={formData.account_id} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent">
                {accounts.length === 0 && <option value="">Loading...</option>}
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* 2. DESCRIÇÃO E VALOR */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Description</label>
                <input name="description" required value={formData.description} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent" placeholder="Ex: Coffee" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Amount (€)</label>
                <input name="amount" type="number" step="0.01" required value={formData.amount} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent font-mono" placeholder="0.00" />
              </div>
            </div>

            {/* 3. TIPO E DATA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Type</label>
                <select name="transaction_type_id" value={formData.transaction_type_id} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent">
                  {filteredTypes.map(t => <option key={t.id} value={t.id}>{formatTypeName(t.name)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Date</label>
                <input name="date" type="date" required max={new Date().toISOString().split('T')[0]} value={formData.date} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>

            {/* 4. CATEGORIA E SUBCATEGORIA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent">
                  <option value="">-- None --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Subcategory</label>
                <select name="sub_category_id" value={formData.sub_category_id} onChange={handleChange} disabled={!availableSubCategories.length} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">-- None --</option>
                  {availableSubCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
              </div>
            </div>

            {/* TAGS (Premium) */}
            <PremiumLock isLocked={!canUsePremiumFeatures} minimal={true}>
              <div className="mt-4">
                <label className="block text-xs font-bold text-muted uppercase mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        formData.tag_ids.includes(tag.id)
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-transparent text-muted border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ 
                        backgroundColor: formData.tag_ids.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: formData.tag_ids.includes(tag.id) ? tag.color : undefined
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-muted italic">No tags available.</p>}
                </div>
              </div>
            </PremiumLock>

            {/* RECURRING (Premium) */}
            <div className="mt-4">
              <PremiumLock isLocked={!canUsePremiumFeatures} minimal={true}>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_recurring} 
                        onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-blue-800 dark:text-blue-200">Repeat this transaction?</span>
                    </label>
                  </div>
                  
                  {formData.is_recurring && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-blue-600 dark:text-blue-300 uppercase mb-1">Frequency</label>
                      <select 
                        value={formData.frequency} 
                        onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg text-sm outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>
              </PremiumLock>
            </div>

            {/* SMART SHOPPING */}
            {canUseSmartShopping && !isInvestmentType && (
              <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20 space-y-3">
                <h3 className="text-sm font-heading font-bold text-accent flex items-center gap-2">🛒 Smart Shopping</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">Unit</label>
                    <select name="measurement_unit" value={formData.measurement_unit} onChange={handleChange} className="w-full p-2 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none">
                      {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">Quantity</label>
                    <input name="quantity" type="number" step="any" value={formData.quantity} onChange={handleChange} className="w-full p-2 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" placeholder="Ex: 2" />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAnalysis} disabled={analysisLoading} className="w-full py-2 bg-accent text-primary font-bold rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50">
                      {analysisLoading ? '...' : 'Analyze'}
                    </button>
                  </div>
                </div>
                {calculatedUnitPrice && (
                  <div className="text-xs text-center font-mono text-muted">
                    Implied Price: <span className="font-bold text-darkText dark:text-lightText">{calculatedUnitPrice} € / {formData.measurement_unit}</span>
                  </div>
                )}
                {analysis && (
                  <div className={`text-sm font-medium p-2 rounded-lg text-center ${analysis.savings > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {analysis.savings > 0 ? `Great! You saved ${analysis.savings.toFixed(2)}€/${formData.measurement_unit} vs average.` : `Attention! You paid ${Math.abs(analysis.savings).toFixed(2)}€/${formData.measurement_unit} more than average.`}
                  </div>
                )}
              </div>
            )}

            {/* INVESTMENT */}
            {isInvestmentType && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">📈 Asset Data</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Ticker</label><input name="symbol" value={formData.symbol} onChange={handleChange} className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-sm uppercase" placeholder="AAPL" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Quantity</label><input name="quantity" type="number" step="any" value={formData.quantity} onChange={handleChange} className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-sm" placeholder="0.0" /></div>
                  <div className="col-span-1"><label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Price/Un. (Op)</label><input name="price_per_unit" type="number" step="0.01" value={formData.price_per_unit} onChange={handleChange} className="w-full p-2 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-sm" placeholder="Auto" /></div>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-primary font-heading font-bold py-3.5 rounded-xl transition-all shadow-glow disabled:opacity-50">
                {loading ? 'Processing...' : (formData.is_recurring ? 'Create Recurring' : 'Confirm')}
              </button>
              <button type="button" onClick={() => router.back()} className="w-full bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-muted font-medium py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE TRANSFERÊNCIA */}
        {mode === 'transfer' && (
          <form onSubmit={handleSubmitTransfer} className="space-y-4 animate-fade-in">
            {/* ORIGEM */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">From (Source)</label>
              <select name="source_account_id" required value={transferData.source_account_id} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={String(acc.id) === transferData.destination_account_id}>
                    {acc.name} ({acc.current_balance?.toFixed(2)} €)
                  </option>
                ))}
              </select>
            </div>

            {/* DESTINO */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">To (Destination)</label>
              <select name="destination_account_id" required value={transferData.destination_account_id} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={String(acc.id) === transferData.source_account_id}>
                    {acc.name} ({acc.current_balance?.toFixed(2)} €)
                  </option>
                ))}
              </select>
            </div>

            {/* VALOR E DATA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Amount (€)</label>
                <input name="amount" type="number" step="0.01" required value={transferData.amount} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1">Date</label>
                <input name="date" type="date" required value={transferData.date} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Description</label>
              <input name="description" value={transferData.description} onChange={handleChange} className="w-full p-3 bg-secondary dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Reason" />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold py-3.5 rounded-xl transition-all shadow-glow disabled:opacity-50">{loading ? 'Processing...' : 'Confirm Transfer'}</button>
              <button type="button" onClick={() => router.back()} className="w-full bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-muted font-medium py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </form>
        )}

      </div>
    </main>
  );
}
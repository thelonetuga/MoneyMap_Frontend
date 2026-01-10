'use client';

import { useState, useEffect } from 'react';
import api, { getTags } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Tag } from '@/types/models';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transactionIds: number[]; // If > 1, it's bulk edit
  initialData?: any; // For individual edit
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

export default function EditTransactionModal({ isOpen, onClose, onSave, transactionIds, initialData }: ModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Form State
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  // Smart Shopping State
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('un');

  const isBulk = transactionIds.length > 1;
  const canUsePremiumFeatures = user?.role === 'admin' || user?.role === 'premium';

  // Load Data
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [catRes, accRes] = await Promise.all([
            api.get('/categories/'),
            api.get('/accounts/')
          ]);
          setCategories(catRes.data);
          setAccounts(accRes.data);

          if (canUsePremiumFeatures) {
            const tagsData = await getTags();
            setTags(tagsData);
          }
        } catch (err) {
          console.error("Error loading modal data:", err);
        }
      };
      loadData();
      
      if (!isBulk && initialData) {
        setDescription(initialData.description);
        setCategoryId(initialData.category?.id || '');
        setAccountId(initialData.account?.id || '');
        
        setQuantity(initialData.quantity || '');
        setUnit(initialData.measurement_unit || 'un');
        
        if (initialData.tags) {
          setSelectedTagIds(initialData.tags.map((t: Tag) => t.id));
        } else {
          setSelectedTagIds([]);
        }
      } else {
        setDescription('');
        setCategoryId('');
        setAccountId('');
        setQuantity('');
        setUnit('un');
        setSelectedTagIds([]);
      }
    }
  }, [isOpen, isBulk, initialData, canUsePremiumFeatures]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isBulk) {
      if (!accountId) {
        alert('Account is required.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload: any = {};
      if (description) payload.description = description;
      
      if (categoryId) {
        payload.category_id = Number(categoryId);
      } else if (!isBulk) {
        payload.category_id = null;
      }

      if (accountId) payload.account_id = Number(accountId);
      
      if (canUsePremiumFeatures) {
        if (quantity) payload.quantity = Number(quantity);
        if (unit) payload.measurement_unit = unit;
        payload.tag_ids = selectedTagIds;
      }

      await Promise.all(transactionIds.map(id => api.patch(`/transactions/${id}/`, payload)));
      
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating transactions.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft w-full max-w-md p-6 border border-secondary dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-heading font-bold text-darkText dark:text-lightText mb-4">
          {isBulk ? `Edit ${transactionIds.length} Transactions` : 'Edit Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Description</label>
            <input 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
              placeholder={isBulk ? "Keep original (leave empty)" : "Description"}
            />
          </div>

          {/* ACCOUNT */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Account *</label>
            <select 
              value={accountId} 
              onChange={e => setAccountId(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
            >
              <option value="">{isBulk ? "Keep original" : "Select..."}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Category</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
            >
              <option value="">{isBulk ? "Keep original" : "-- None --"}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* TAGS (Premium) */}
          {canUsePremiumFeatures && tags.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      selectedTagIds.includes(tag.id)
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-transparent text-muted border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ 
                      backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent',
                      borderColor: selectedTagIds.includes(tag.id) ? tag.color : undefined
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SMART SHOPPING (Premium/Admin) */}
          {canUsePremiumFeatures && (
            <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
              <h3 className="text-xs font-bold text-accent uppercase mb-2 flex items-center gap-1">
                🛒 Smart Shopping
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Quantity</label>
                  <input 
                    type="number"
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full p-2 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-darkText dark:text-lightText"
                    placeholder="Ex: 1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Unit</label>
                  <select 
                    value={unit} 
                    onChange={e => setUnit(e.target.value)}
                    className="w-full p-2 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-darkText dark:text-lightText outline-none"
                  >
                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-secondary dark:bg-gray-700 text-muted font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
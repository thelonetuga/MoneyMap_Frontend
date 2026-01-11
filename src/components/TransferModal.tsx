'use client';

import { useState, useEffect } from 'react';
import api, { transferFunds } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Form State
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Transfer');

  // Load Accounts
  useEffect(() => {
    if (isOpen) {
      api.get('/accounts/').then(res => setAccounts(res.data)).catch(console.error);
      // Reset form
      setSourceId('');
      setDestId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('Transfer');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!sourceId || !destId || !amount) {
      showNotification('warning', 'Please fill all required fields.');
      setLoading(false);
      return;
    }

    if (sourceId === destId) {
      showNotification('warning', 'Source and Destination accounts cannot be the same.');
      setLoading(false);
      return;
    }

    if (Number(amount) <= 0) {
      showNotification('warning', 'Amount must be positive.');
      setLoading(false);
      return;
    }

    try {
      await transferFunds({
        source_account_id: Number(sourceId),
        destination_account_id: Number(destId),
        amount: Number(amount),
        date,
        description
      });
      
      showNotification('success', 'Transfer successful! 💸');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.response?.data?.detail || 'Error processing transfer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft w-full max-w-md p-6 border border-secondary dark:border-gray-700">
        <h2 className="text-xl font-heading font-bold text-darkText dark:text-lightText mb-6 flex items-center gap-2">
          💸 Transfer Funds
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SOURCE */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">From (Source)</label>
            <select 
              value={sourceId} 
              onChange={e => setSourceId(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
              required
            >
              <option value="">Select account...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={String(acc.id) === destId}>
                  {acc.name} ({acc.current_balance.toFixed(2)} €)
                </option>
              ))}
            </select>
          </div>

          {/* DESTINATION */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">To (Destination)</label>
            <select 
              value={destId} 
              onChange={e => setDestId(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
              required
            >
              <option value="">Select account...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={String(acc.id) === sourceId}>
                  {acc.name} ({acc.current_balance.toFixed(2)} €)
                </option>
              ))}
            </select>
          </div>

          {/* AMOUNT & DATE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Amount (€)</label>
              <input 
                type="number" 
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText font-mono"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
                required
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Description</label>
            <input 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 bg-secondary dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-accent text-darkText dark:text-lightText"
              placeholder="Reason"
            />
          </div>

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
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
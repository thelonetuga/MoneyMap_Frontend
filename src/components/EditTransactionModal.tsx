'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transactionIds: number[]; // Se > 1, é bulk edit
  initialData?: any; // Para edição individual
}

export default function EditTransactionModal({ isOpen, onClose, onSave, transactionIds, initialData }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form State
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const isBulk = transactionIds.length > 1;

  // Carregar Categorias
  useEffect(() => {
    if (isOpen) {
      api.get('/categories/').then(res => setCategories(res.data)).catch(console.error);
      
      // Se for individual, preencher dados
      if (!isBulk && initialData) {
        setDescription(initialData.description);
        setCategoryId(initialData.category?.id || '');
        setSubCategoryId(initialData.sub_category?.id || '');
      } else {
        // Reset para bulk
        setDescription('');
        setCategoryId('');
        setSubCategoryId('');
      }
    }
  }, [isOpen, isBulk, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {};
      if (description) payload.description = description;
      if (categoryId) payload.category_id = Number(categoryId);
      if (subCategoryId) payload.sub_category_id = Number(subCategoryId);

      // Loop para atualizar todas as transações selecionadas
      await Promise.all(transactionIds.map(id => api.patch(`/transactions/${id}`, payload)));
      
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar transações.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {isBulk ? `Editar ${transactionIds.length} Transações` : 'Editar Transação'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descrição</label>
            <input 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={isBulk ? "Manter original (deixe vazio)" : "Descrição"}
            />
          </div>

          {/* CATEGORIA */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoria</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="">{isBulk ? "Manter original" : "Selecionar..."}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
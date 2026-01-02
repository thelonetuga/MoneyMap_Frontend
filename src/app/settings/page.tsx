'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Category {
    id: number;
    name: string;
}

export default function SettingsPage() {
    // Estados Perfil
    const [firstName, setFirstName] = useState('');
    const [currency, setCurrency] = useState('EUR');
    
    // Estados Categorias
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [userRes, catRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/categories/')
            ]);
            
            if (userRes.data.profile) {
                setFirstName(userRes.data.profile.first_name);
                setCurrency(userRes.data.profile.preferred_currency);
            }
            setCategories(catRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/me', {
                first_name: firstName,
                preferred_currency: currency
            });
            setMsg('Perfil atualizado! ✅');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('Erro ao guardar perfil. ❌');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const res = await api.post('/categories/', { name: newCategory });
            setCategories([...categories, res.data]); // Adiciona à lista local
            setNewCategory('');
        } catch (err) {
            alert('Erro ao criar categoria');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Tem a certeza? Isto pode afetar transações antigas.')) return;
        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            alert('Não foi possível apagar (pode ter transações associadas).');
        }
    };

    const inputClass = "w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2";

    return (
        <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-8">
            
            {/* COLUNA ESQUERDA: PERFIL */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Definições ⚙️</h1>
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <h2 className="text-xl font-bold text-blue-600 mb-6">Perfil</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div>
                            <label className={labelClass}>Nome</label>
                            <input 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)}
                                className={inputClass} 
                            />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Moeda</label>
                            <select 
                                value={currency} 
                                onChange={e => setCurrency(e.target.value)}
                                className={inputClass}
                            >
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">Dólar ($)</option>
                            </select>
                        </div>

                        {msg && <p className="text-center font-bold text-green-600 animate-pulse">{msg}</p>}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            {loading ? 'A guardar...' : 'Guardar Alterações'}
                        </button>
                    </form>
                </div>
            </div>

            {/* COLUNA DIREITA: CATEGORIAS */}
            <div className="md:mt-20"> {/* Margem para alinhar visualmente com o título */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-blue-600 mb-6">Gestão de Categorias</h2>
                    
                    {/* Formulário Adicionar */}
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                        <input 
                            placeholder="Nova Categoria..."
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900"
                        >
                            +
                        </button>
                    </form>

                    {/* Lista */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <span className="font-bold text-gray-700">{cat.name}</span>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="text-gray-400 hover:text-red-500 p-2"
                                    title="Apagar"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && <p className="text-gray-400 text-center text-sm">Sem categorias.</p>}
                    </div>
                </div>
            </div>

        </main>
    );
}
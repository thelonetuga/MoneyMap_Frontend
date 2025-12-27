'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// --- INTERFACES ---
interface UserProfile {
    first_name: string;
    last_name: string;
    preferred_currency: string;
}

interface SubCategory {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    sub_categories: SubCategory[];
}

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'profile' | 'categories'>('profile');
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE DADOS ---
    const [profile, setProfile] = useState<UserProfile>({ first_name: '', last_name: '', preferred_currency: 'EUR' });
    const [categories, setCategories] = useState<Category[]>([]);

    // Estados para Criar Nova Categoria
    const [newSubName, setNewSubName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

    // --- 1. CARREGAR DADOS INICIAIS ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const headers = { 'Authorization': `Bearer ${token}` };

        Promise.all([
            fetch('http://127.0.0.1:8000/users/me', { headers }), // Busca dados do user + perfil
            fetch('http://127.0.0.1:8000/categories', { headers }) // Busca categorias
        ])
            .then(async ([userRes, catRes]) => {
                if (userRes.ok) {
                    const userData = await userRes.json();
                    // Se o utilizador já tiver perfil, preenchemos o formulário
                    if (userData.profile) {
                        setProfile({
                            first_name: userData.profile.first_name || '',
                            last_name: userData.profile.last_name || '',
                            preferred_currency: userData.profile.preferred_currency || 'EUR'
                        });
                    }
                }

                if (catRes.ok) {
                    setCategories(await catRes.json());
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    // --- 2. GUARDAR PERFIL ---
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://127.0.0.1:8000/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });

            if (res.ok) {
                alert("Perfil atualizado! (Pode precisar de fazer refresh para atualizar a Navbar)");
                window.location.reload(); // Força refresh para atualizar o nome na Navbar
            } else {
                alert("Erro ao guardar perfil.");
            }
        } catch (error) {
            alert("Erro de conexão.");
        }
    };

    // --- 3. ADICIONAR SUBCATEGORIA ---
    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCatId || !newSubName) return;

        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://127.0.0.1:8000/subcategories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newSubName, category_id: selectedCatId })
            });

            if (res.ok) {
                const newSub = await res.json();

                // Atualizar a lista localmente para aparecer de imediato
                setCategories(prev => prev.map(cat => {
                    if (cat.id === selectedCatId) {
                        return { ...cat, sub_categories: [...cat.sub_categories, newSub] };
                    }
                    return cat;
                }));

                setNewSubName(''); // Limpar input
            } else {
                alert("Erro ao criar categoria.");
            }
        } catch (error) {
            alert("Erro de conexão.");
        }
    };

    // --- 4. APAGAR SUBCATEGORIA ---
    const handleDeleteSub = async (id: number, catId: number) => {
        if (!confirm("Tem a certeza? Se tiver transações nesta categoria, não será possível apagar.")) return;

        const token = localStorage.getItem('token');

        const res = await fetch(`http://127.0.0.1:8000/subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            // Remover da lista localmente
            setCategories(prev => prev.map(cat => {
                if (cat.id === catId) {
                    return { ...cat, sub_categories: cat.sub_categories.filter(s => s.id !== id) };
                }
                return cat;
            }));
        } else {
            const err = await res.json();
            alert(err.detail || "Não foi possível apagar.");
        }
    };

    // Estilos comuns
    const inputClass = "w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all";
    const btnClass = "px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-shadow shadow-sm";

    if (loading) return <div className="p-10 text-center text-gray-500">A carregar definições...</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Definições ⚙️</h1>

                {/* --- NAVEGAÇÃO ENTRE TABS --- */}
                <div className="flex border-b border-gray-200 mb-8 gap-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 font-semibold transition-colors border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Perfil Pessoal
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-3 font-semibold transition-colors border-b-2 ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Gerir Categorias
                    </button>
                </div>

                {/* --- TAB: PERFIL --- */}
                {activeTab === 'profile' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Editar Dados</h2>
                        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Nome Próprio</label>
                                    <input required type="text" value={profile.first_name} onChange={e => setProfile({ ...profile, first_name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Apelido</label>
                                    <input type="text" value={profile.last_name} onChange={e => setProfile({ ...profile, last_name: e.target.value })} className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Moeda Preferida</label>
                                <select value={profile.preferred_currency} onChange={e => setProfile({ ...profile, preferred_currency: e.target.value })} className={inputClass}>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">Dólar ($)</option>
                                    <option value="GBP">Libra (£)</option>
                                </select>
                            </div>

                            <button type="submit" className={btnClass}>Guardar Alterações</button>
                        </form>
                    </div>
                )}

                {/* --- TAB: CATEGORIAS --- */}
                {activeTab === 'categories' && (
                    <div className="space-y-8 animate-in fade-in duration-300">

                        {/* Formulário de Adição */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <h2 className="text-lg font-bold text-blue-900 mb-4">Adicionar Nova Categoria</h2>
                            <form onSubmit={handleAddSubCategory} className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Grupo Principal</label>
                                    <select
                                        value={selectedCatId || ''}
                                        onChange={e => setSelectedCatId(Number(e.target.value))}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Selecione um grupo...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Nome da Subcategoria</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Internet, Ginásio..."
                                        value={newSubName}
                                        onChange={e => setNewSubName(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <button type="submit" className={`${btnClass} w-full md:w-auto`}>Adicionar +</button>
                            </form>
                        </div>

                        {/* Lista de Categorias */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 font-bold text-gray-700">
                                        {cat.name}
                                    </div>
                                    <div className="p-5 flex-1">
                                        {cat.sub_categories.length === 0 ? (
                                            <p className="text-gray-400 text-sm italic">Sem subcategorias definidas.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {cat.sub_categories.map(sub => (
                                                    <div key={sub.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-sm border border-gray-200 group hover:border-red-200 hover:bg-red-50 transition-colors">
                                                        {sub.name}
                                                        <button
                                                            onClick={() => handleDeleteSub(sub.id, cat.id)}
                                                            className="text-gray-300 hover:text-red-500 font-bold px-1 transition-colors"
                                                            title="Apagar"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
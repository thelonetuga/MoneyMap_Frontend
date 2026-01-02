'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Account {
    id: number;
    name: string;
}

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // 1. Carregar Contas ao iniciar a página
    useEffect(() => {
        api.get('/accounts/')
           .then(res => {
               setAccounts(res.data);
               if (res.data.length > 0) setSelectedAccount(res.data[0].id.toString());
           })
           .catch(err => console.error("Erro contas", err))
           .finally(() => setPageLoading(false));
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedAccount) return;

        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Agora usamos a conta selecionada!
            const res = await api.post(`/imports/upload?account_id=${selectedAccount}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setStatus({ 
                type: 'success', 
                msg: `Sucesso! ${res.data.added} transações importadas.` 
            });
            setFile(null); 
            
        } catch (err: any) {
            console.error(err);
            setStatus({ 
                type: 'error', 
                msg: err.response?.data?.detail || 'Erro ao importar ficheiro.' 
            });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="p-10 text-center text-gray-400">A preparar importador... ⏳</div>;

    return (
        <main className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg border border-gray-100 p-10">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Importar Extrato 📂</h1>
                <p className="text-gray-500 mb-8 text-sm">Suporta ficheiros .CSV e .XLSX</p>

                <form onSubmit={handleUpload} className="space-y-6">
                    
                    {/* SELEÇÃO DE CONTA (NOVO) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Para a Conta</label>
                        <select 
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        {accounts.length === 0 && <p className="text-red-500 text-xs mt-1">Crie uma conta primeiro!</p>}
                    </div>

                    {/* ÁREA DE DROP */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            accept=".csv, .xlsx" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2">
                            <span className="text-4xl">📄</span>
                            <p className="font-medium text-gray-600">
                                {file ? file.name : "Arraste ou clique para selecionar"}
                            </p>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-xl text-sm font-bold text-center ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {status.msg}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={!file || loading || !selectedAccount}
                        className={`w-full py-4 rounded-2xl text-white font-bold transition-all ${!file || loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
                    >
                        {loading ? 'A processar...' : 'Importar Agora'}
                    </button>
                </form>
            </div>
        </main>
    );
}
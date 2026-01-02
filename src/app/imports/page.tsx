'use client';

import { useState } from 'react';
import api from '@/services/api';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        
        // IMPORTANTE: Tens de ter um ID de conta. 
        // Para simplificar o MVP, vamos assumir que o user quer importar para a conta ID 1
        // Num futuro próximo, deves fazer um dropdown para escolher a conta.
        const accountId = 1; 

        try {
            const res = await api.post(`/imports/upload?account_id=${accountId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setStatus({ 
                type: 'success', 
                msg: `Sucesso! ${res.data.added} transações importadas.` 
            });
            setFile(null); // Limpar input
            
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

    return (
        <main className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg border border-gray-100 p-10">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Importar Extrato 📂</h1>
                <p className="text-gray-500 mb-8 text-sm">Suporta ficheiros .CSV e .XLSX</p>

                <form onSubmit={handleUpload} className="space-y-6">
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
                        disabled={!file || loading}
                        className={`w-full py-4 rounded-2xl text-white font-bold transition-all ${!file || loading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
                    >
                        {loading ? 'A processar...' : 'Importar Agora'}
                    </button>
                </form>
            </div>
        </main>
    );
}
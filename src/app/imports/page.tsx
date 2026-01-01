'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Account {
    id: number;
    name: string;
}

export default function ImportPage() {
    const router = useRouter();
    
    // Estados
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ message: string; added: number; errors: number } | null>(null);

    // 1. Carregar Contas ao iniciar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        fetch('http://127.0.0.1:8000/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAccounts(data))
        .catch(console.error);
    }, [router]);

    // 2. Lógica de Drag & Drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        // Aceitar CSV ou Excel. (Alguns browsers têm tipos MIME diferentes para CSV, por isso validamos a extensão também)
        if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
            setFile(file);
            setResult(null);
        } else {
            alert("Formato inválido. Por favor carregue ficheiros .csv ou .xlsx");
        }
    };

    // 3. Enviar para a API
    const handleUpload = async () => {
        if (!file || !selectedAccountId) return;

        setUploading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Nota: O endpoint espera ?account_id=... na query string
            const res = await fetch(`http://127.0.0.1:8000/imports/upload?account_id=${selectedAccountId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setFile(null); // Limpar após sucesso
            } else {
                const err = await res.json();
                alert(`Erro: ${err.detail}`);
            }
        } catch (error) {
            alert("Erro de conexão.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-800">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Importar Extrato 📥</h1>
                <p className="text-gray-500 mb-8">Carregue os seus ficheiros CSV ou Excel para atualizar as contas.</p>

                {/* RESULTADO (Sucesso) */}
                {result && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex flex-col gap-1 animate-in fade-in slide-in-from-top-4">
                        <span className="font-bold text-lg">✅ {result.message}</span>
                        <span>Foram adicionados <span className="font-bold">{result.added}</span> novos movimentos.</span>
                        {result.errors > 0 && <span className="text-red-600 text-sm">Atenção: {result.errors} linhas foram ignoradas por erro.</span>}
                        <button onClick={() => router.push('/transactions')} className="mt-2 text-sm font-bold underline hover:text-green-900 w-fit">Ver Movimentos →</button>
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                    
                    {/* 1. SELECIONAR CONTA */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Para que conta vai importar?</label>
                        <select 
                            value={selectedAccountId} 
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="" disabled>Selecione uma conta...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. ÁREA DE DRAG & DROP */}
                    <div 
                        onDragEnter={handleDrag} 
                        onDragLeave={handleDrag} 
                        onDragOver={handleDrag} 
                        onDrop={handleDrop}
                        className={`
                            relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-2xl transition-all duration-300
                            ${dragActive ? 'border-blue-500 bg-blue-50 scale-105 shadow-inner' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                        `}
                    >
                        <input 
                            type="file" 
                            accept=".csv, .xlsx"
                            onChange={handleChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {file ? (
                            <div className="text-center animate-in zoom-in duration-300">
                                <div className="text-5xl mb-2">📄</div>
                                <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                <p className="text-xs text-blue-500 mt-2 font-bold">Clique para mudar</p>
                            </div>
                        ) : (
                            <div className="text-center pointer-events-none">
                                <div className="text-5xl mb-4 text-gray-300">☁️</div>
                                <p className="font-bold text-gray-600">Arraste o ficheiro para aqui</p>
                                <p className="text-sm text-gray-400 mt-1">ou clique para selecionar (CSV, Excel)</p>
                            </div>
                        )}
                    </div>

                    {/* 3. BOTÃO DE AÇÃO */}
                    <button 
                        onClick={handleUpload}
                        disabled={!file || !selectedAccountId || uploading}
                        className={`
                            w-full mt-6 py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:-translate-y-1
                            ${!file || !selectedAccountId ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'}
                        `}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                A processar...
                            </span>
                        ) : 'Importar Movimentos 🚀'}
                    </button>

                </div>
            </div>
        </main>
    );
}
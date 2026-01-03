"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category?: { name: string };
  subcategory?: { name: string }; // Agora suportamos subcategorias
  account: { name: string };
  transaction_type: { name: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      // Vamos buscar as últimas 100
      const res = await api.get("/transactions/?limit=100");
      setTransactions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Tem a certeza que quer apagar esta transação? O saldo da conta será revertido."
      )
    )
      return;

    try {
      await api.delete(`/transactions/${id}`);
      // Remover da lista visualmente
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      alert("Erro ao apagar transação.");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">
        A carregar histórico... ⏳
      </div>
    );

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Histórico de Transações 📜
      </h1>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-500 uppercase">Data</th>
                <th className="p-4 font-bold text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="p-4 font-bold text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="p-4 font-bold text-gray-500 uppercase">Conta</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-right">
                  Valor
                </th>
                <th className="p-4 font-bold text-gray-500 uppercase text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => {
                const isExpense =
                  ["Despesa", "Expense", "Saída"].some((k) =>
                    t.transaction_type.name.includes(k)
                  ) || t.amount < 0;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {t.description}
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="block">
                        {t.category?.name || "Geral"}
                      </span>
                      {t.subcategory && (
                        <span className="text-xs text-gray-400">
                          {t.subcategory.name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">
                      {t.account?.name || "Conta Apagada"}
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${
                        isExpense ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {isExpense ? "" : "+"}
                      {t.amount.toFixed(2)} €
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-300 hover:text-red-600 transition-colors p-2"
                        title="Apagar Transação"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-gray-400 italic"
                  >
                    Sem transações registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

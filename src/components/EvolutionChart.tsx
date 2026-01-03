'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getEvolution } from '../services/api';

export default function EvolutionChart() {
  const [period, setPeriod] = useState('year'); // 'year', 'quarter', 'month'
  const [chartType, setChartType] = useState<'mixed' | 'lines'>('mixed'); // 'mixed' (Barras+Linha) ou 'lines' (Só Linhas)

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', period],
    queryFn: () => getEvolution(period),
  });

  if (isLoading) {
    return (
      <div className="h-96 w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">A carregar evolução... 📊</div>
      </div>
    );
  }

  if (!evolution || evolution.length === 0) {
    return (
      <div className="h-96 w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        <div className="text-gray-400 mb-4">Sem dados de evolução disponíveis.</div>
        <div className="flex gap-2">
            {['year', 'quarter', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${
                  period === p ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p === 'year' ? 'Anual' : p === 'quarter' ? 'Trimestral' : 'Mensal'}
              </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-700">Análise de Longo Prazo</h2>
          {/* Seletor de Tipo de Gráfico */}
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setChartType('mixed')}
              className={`px-2 py-1 text-xs rounded transition-all ${chartType === 'mixed' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              title="Misto (Barras + Linha)"
            >
              📊 Misto
            </button>
            <button
              onClick={() => setChartType('lines')}
              className={`px-2 py-1 text-xs rounded transition-all ${chartType === 'lines' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              title="Linhas (Eixo Duplo)"
            >
              📈 Linhas
            </button>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'year', label: 'Anual' },
            { id: 'quarter', label: 'Trimestral' },
            { id: 'month', label: 'Mensal' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setPeriod(option.id)}
              className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium ${
                period === option.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'mixed' ? (
            <ComposedChart data={evolution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="period" scale="point" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => {
                  // Mapeamento explícito para garantir que o nome correto é mostrado
                  let label = name;
                  if (name === 'net_worth') label = 'Património';
                  else if (name === 'liquid_cash') label = 'Liquidez';
                  else if (name === 'income') label = 'Receitas';
                  else if (name === 'expenses') label = 'Despesas';
                  
                  return [`${value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`, label];
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar yAxisId="left" dataKey="income" name="Receitas" fill="#4ade80" barSize={20} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="expenses" name="Despesas" fill="#f87171" barSize={20} radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="net_worth" name="Património" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              {/* NOVA LINHA: Liquidez */}
              <Line yAxisId="left" type="monotone" dataKey="liquid_cash" name="Liquidez" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#0ea5e9' }} />
            </ComposedChart>
          ) : (
            <LineChart data={evolution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="period" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              
              {/* Eixo Primário (Esquerda): Património e Liquidez */}
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#2563eb' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Património', angle: -90, position: 'insideLeft', fill: '#2563eb', fontSize: 10 }}
              />

              {/* Eixo Secundário (Direita): Receitas e Despesas */}
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Fluxo de Caixa', angle: 90, position: 'insideRight', fill: '#6b7280', fontSize: 10 }}
              />

              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => {
                  // Mapeamento explícito para garantir que o nome correto é mostrado
                  let label = name;
                  if (name === 'net_worth') label = 'Património';
                  else if (name === 'liquid_cash') label = 'Liquidez';
                  else if (name === 'income') label = 'Receitas';
                  else if (name === 'expenses') label = 'Despesas';

                  return [`${value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`, label];
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {/* Linhas associadas aos eixos corretos */}
              <Line yAxisId="right" type="monotone" dataKey="income" name="Receitas" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="expenses" name="Despesas" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="left" type="monotone" dataKey="net_worth" name="Património" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
              {/* NOVA LINHA: Liquidez */}
              <Line yAxisId="left" type="monotone" dataKey="liquid_cash" name="Liquidez" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#0ea5e9' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
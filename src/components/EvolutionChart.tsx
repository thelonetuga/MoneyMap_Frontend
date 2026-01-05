'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes'; // IMPORTADO
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getEvolution } from '../services/api';

type Preset = '6M' | 'YTD' | '1Y' | 'ALL';

export default function EvolutionChart() {
  const [activePreset, setActivePreset] = useState<Preset>('ALL');
  const { resolvedTheme } = useTheme(); // Hook do tema
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Deriva o time_range e o period a partir do preset selecionado
  const { timeRange, period } = useMemo(() => {
    switch (activePreset) {
      case '6M': return { timeRange: '6M', period: 'month' };
      case 'YTD': return { timeRange: 'YTD', period: 'month' };
      case '1Y': return { timeRange: '1Y', period: 'month' };
      case 'ALL':
      default:
        return { timeRange: 'all', period: 'year' };
    }
  }, [activePreset]);

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', period, timeRange],
    queryFn: () => getEvolution(period, timeRange),
  });

  // Cores dinâmicas
  const isDark = mounted && resolvedTheme === 'dark';
  const gridColor = isDark ? '#374151' : '#f3f4f6'; // gray-700 vs gray-100
  const axisColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 vs gray-500
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 vs white
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937'; // gray-100 vs gray-800

  if (isLoading) {
    return (
      <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">A carregar evolução... 📊</div>
      </div>
    );
  }

  if (!evolution || evolution.length === 0) {
    return (
      <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
        <div className="text-gray-400 mb-4">Sem dados de evolução disponíveis.</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-gray-700 dark:text-white whitespace-nowrap">Análise de Longo Prazo</h2>
        
        {/* SELETOR UNIFICADO DE PRESETS */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0">
          {[
            { id: '6M', label: '6M' },
            { id: 'YTD', label: 'YTD' },
            { id: '1Y', label: '1A' },
            { id: 'ALL', label: 'Tudo' },
          ].map((option) => (
            <button 
              key={option.id} 
              onClick={() => setActivePreset(option.id as Preset)} 
              className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium whitespace-nowrap ${
                activePreset === option.id 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Adicionado min-w-0 para evitar erro do Recharts em containers flex/grid */}
      <div className="h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="period" 
              padding={{ left: 30, right: 30 }} 
              tick={{ fontSize: 12, fill: axisColor }} 
              axisLine={false} 
              tickLine={false} 
            />
            
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#2563eb' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Património', angle: -90, position: 'insideLeft', fill: '#2563eb', fontSize: 10 }}
            />

            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12, fill: axisColor }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Fluxo de Caixa', angle: 90, position: 'insideRight', fill: axisColor, fontSize: 10 }}
            />

            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: tooltipBg,
                color: tooltipText
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText, fontWeight: 'bold', marginBottom: '0.5rem' }}
              formatter={(value: any, name: any) => {
                let label = String(name);
                if (name === 'net_worth') label = 'Património';
                else if (name === 'liquid_cash') label = 'Liquidez';
                else if (name === 'income') label = 'Receitas';
                else if (name === 'expenses') label = 'Despesas';
                return [`${Number(value).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`, label];
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: axisColor }} />
            
            <Line yAxisId="right" type="monotone" dataKey="income" name="Receitas" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" name="Despesas" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="net_worth" name="Património" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
            <Line yAxisId="left" type="monotone" dataKey="liquid_cash" name="Liquidez" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#0ea5e9' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
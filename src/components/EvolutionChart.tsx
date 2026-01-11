'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
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
import { getEvolution } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

type Preset = '6M' | 'YTD' | '1Y' | 'ALL';

export default function EvolutionChart() {
  const [activePreset, setActivePreset] = useState<Preset>('ALL');
  const { resolvedTheme } = useTheme();
  const { formatCurrency } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const isDark = mounted && resolvedTheme === 'dark';
  const gridColor = isDark ? '#374151' : '#f3f4f6';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937';

  if (isLoading) {
    return (
      <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading evolution... 📊</div>
      </div>
    );
  }

  if (!evolution || evolution.length === 0) {
    return (
      <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
        <div className="text-gray-400 mb-4">No evolution data available.</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-gray-700 dark:text-white whitespace-nowrap">Long Term Analysis</h2>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0 overflow-x-auto max-w-full">
          {[
            { id: '6M', label: '6M' },
            { id: 'YTD', label: 'YTD' },
            { id: '1Y', label: '1Y' },
            { id: 'ALL', label: 'All' },
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

      <div className="h-80 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolution} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              padding={{ left: 20, right: 20 }} 
              tick={{ fontSize: 10, fill: axisColor }} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={50} // Mais espaço entre datas
            />
            
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#2563eb' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={40}
            />

            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 10, fill: axisColor }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={40}
            />

            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: tooltipBg,
                color: tooltipText,
                fontSize: '12px'
              }}
              itemStyle={{ color: tooltipText }}
              labelStyle={{ color: tooltipText, fontWeight: 'bold', marginBottom: '0.5rem' }}
              formatter={(value: any, name: any) => {
                let label = String(name);
                if (name === 'net_worth') label = 'Net Worth';
                else if (name === 'liquid_cash') label = 'Liquidity';
                else if (name === 'income') label = 'Income';
                else if (name === 'expenses') label = 'Expenses';
                return [formatCurrency(Number(value)), label];
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: axisColor }} />
            
            <Line yAxisId="right" type="monotone" dataKey="income" name="Income" stroke="#4ade80" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="left" type="monotone" dataKey="net_worth" name="Net Worth" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line yAxisId="left" type="monotone" dataKey="liquid_cash" name="Liquidity" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
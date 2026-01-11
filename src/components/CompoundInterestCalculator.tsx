'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { calculateCompoundInterest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

export default function CompoundInterestCalculator() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // State
  const [initial, setInitial] = useState<number>(1000);
  const [monthly, setMonthly] = useState<number>(200);
  const [rate, setRate] = useState<number>(7.5);
  const [years, setYears] = useState<number>(10);
  
  const [data, setData] = useState<any[]>([]);
  const [result, setResult] = useState({ total: 0, contributed: 0, interest: 0 });
  const [loading, setLoading] = useState(false);

  const isPremium = user?.role === 'admin' || user?.role === 'premium';

  // Calculation Logic
  const handleCalculate = async () => {
    if (!isPremium) {
      // Se não for premium, não faz nada (o PremiumLock já trata do clique, mas isto é segurança extra)
      return;
    }

    if (initial < 0 || monthly < 0 || rate < 0 || years < 0) {
      showNotification('warning', "Please enter positive values.");
      return;
    }

    setLoading(true);
    try {
      const response = await calculateCompoundInterest({
        initial_principal: initial,
        monthly_contribution: monthly,
        annual_interest_rate: rate,
        years: years
      });

      setResult({
        total: response.final_balance,
        contributed: response.total_contributed,
        interest: response.total_interest_earned
      });

      // Transform breakdown for chart
      const chartData = response.breakdown.map((item: any) => ({
        year: item.year,
        contributed: item.total_contributed,
        interest: item.total_interest,
        balance: item.balance
      }));
      
      // Add Year 0
      chartData.unshift({
        year: 0,
        contributed: initial,
        interest: 0,
        balance: initial
      });

      setData(chartData);
    } catch (error) {
      console.error("Error calculating interest:", error);
      showNotification('error', "Failed to calculate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-accent font-mono text-lg font-bold text-darkText dark:text-lightText transition-all";
  const labelClass = "block text-xs font-bold text-muted uppercase mb-2";

  // DADOS FAKE PARA BLUR (Se não for premium)
  const fakeData = [
    { year: 0, contributed: 1000, interest: 0, balance: 1000 },
    { year: 1, contributed: 3400, interest: 100, balance: 3500 },
    { year: 2, contributed: 5800, interest: 350, balance: 6150 },
    { year: 3, contributed: 8200, interest: 750, balance: 8950 },
    { year: 4, contributed: 10600, interest: 1300, balance: 11900 },
    { year: 5, contributed: 13000, interest: 2100, balance: 15100 },
  ];

  const displayData = isPremium ? data : fakeData;

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* INPUTS */}
      <div className="lg:col-span-1 space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-800 h-fit">
        
        <div>
          <label className={labelClass}>Initial Investment (€)</label>
          <input 
            type="number" 
            value={initial} 
            onChange={(e) => setInitial(Number(e.target.value))} 
            className={inputClass} 
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Monthly Contribution (€)</label>
          <input 
            type="number" 
            value={monthly} 
            onChange={(e) => setMonthly(Number(e.target.value))} 
            className={inputClass} 
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Annual Interest Rate (%)</label>
          <input 
            type="number" 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))} 
            className={inputClass} 
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <label className={labelClass}>Time Period (Years)</label>
          <input 
            type="number" 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))} 
            className={inputClass} 
            min="1"
            max="100"
          />
        </div>

        <button 
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl transition-all shadow-glow disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

      </div>

      {/* RESULTS & CHART */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-accent text-primary p-6 rounded-2xl shadow-lg shadow-accent/20">
            <p className="text-xs font-bold uppercase opacity-80 mb-1">💰 Final Balance</p>
            <p className="text-3xl font-heading font-bold">
              {isPremium ? result.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }) : '---'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-700">
            <p className="text-xs font-bold uppercase text-muted mb-1">📥 Total Invested</p>
            <p className="text-2xl font-heading font-bold text-darkText dark:text-lightText">
              {isPremium ? result.contributed.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }) : '---'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-700">
            <p className="text-xs font-bold uppercase text-success mb-1">📈 Total Interest</p>
            <p className="text-2xl font-heading font-bold text-success">
              {isPremium ? `+${result.interest.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })}` : '---'}
            </p>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 h-[400px]">
          <h3 className="text-lg font-bold text-darkText dark:text-lightText mb-4">Growth Projection</h3>
          {displayData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00DC82" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00DC82" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `Year ${val}`} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)' }}
                  formatter={(value: number) => value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                />
                <Legend />
                <Area type="monotone" dataKey="contributed" name="Total Invested" stackId="1" stroke="#3b82f6" fill="url(#colorContributed)" />
                <Area type="monotone" dataKey="interest" name="Interest Earned" stackId="1" stroke="#00DC82" fill="url(#colorInterest)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted italic">
              Click "Calculate" to see the projection.
            </div>
          )}
        </div>

        {/* TABLE (Optional) */}
        {isPremium && data.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-secondary dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-secondary dark:border-gray-700">
              <h3 className="text-lg font-bold text-darkText dark:text-lightText">Yearly Breakdown</h3>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase bg-secondary dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Year</th>
                    <th className="px-6 py-3 text-right">Invested</th>
                    <th className="px-6 py-3 text-right">Interest</th>
                    <th className="px-6 py-3 text-right">Total Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.year} className="border-b border-secondary dark:border-gray-700 last:border-0 hover:bg-secondary/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 font-mono">{row.year}</td>
                      <td className="px-6 py-3 text-right font-mono">{row.contributed.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-6 py-3 text-right font-mono text-success">+{row.interest.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                      <td className="px-6 py-3 text-right font-bold">{row.balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
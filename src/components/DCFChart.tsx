import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE = '/api';

function useFetch<T>(endpoint: string, initialData: T): T {
  const [data, setData] = useState<T>(initialData);
  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('API Fetch Error:', err));
  }, [endpoint]);
  return data;
}

interface ValuationData {
  ticker: string;
  currentPrice: number;
  fairValue: number;
  assumptions: {
    beta: number;
    growthRate: number;
    costOfEquity: number;
  };
}

const DCFChart = ({ ticker }: { ticker: string }) => {
  const data = useFetch<ValuationData | null>(`/dcf/${ticker}`, null);

  if (!data) return <div className="h-40 flex items-center justify-center text-[var(--test-muted)] text-[10px] uppercase tracking-widest animate-pulse">Fair-Value-Matrix wird berechnet...</div>;

  const { currentPrice, fairValue } = data;
  const isUndervalued = currentPrice < fairValue;
  const diffPct = Math.abs(Math.round(((currentPrice - fairValue) / fairValue) * 100));

  const dcfData = [
    { name: 'Valuation', price: currentPrice, fairValue: fairValue }
  ];

  const currentPos = Math.min(100, Math.max(0, (currentPrice / (fairValue * 1.5)) * 100));
  const fairPos = Math.min(100, Math.max(0, (fairValue / (fairValue * 1.5)) * 100));

  return (
    <div className="mt-4 border-t border-[var(--border-secondary)] pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 group/info relative">
            <p className="section-title uppercase">DCF-Bewertung</p>
            <Info size={12} className="text-[var(--text-muted)] cursor-help hover:text-[var(--accent-blue)] transition-colors" />
            <div className="absolute bottom-full left-0 mb-3 w-80 p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[10px] text-[var(--text-muted)] opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-2 group-hover/info:translate-y-0 pointer-events-none z-50 shadow-2xl backdrop-blur-xl">
              <p className="font-black text-[var(--text-primary)] mb-2 uppercase tracking-wider">Was ist ein DCF-Modell?</p>
              <p className="mb-3 text-[var(--text-muted)] leading-relaxed italic">Das Discounted-Cashflow-Modell schätzt den inneren Wert eines Unternehmens, indem zukünftige freie Cashflows prognostiziert und auf den heutigen Wert abgezinst werden.</p>
              <ul className="space-y-2 text-[var(--text-primary)]">
                <li className="flex gap-2">
                  <span className="text-[var(--accent-blue)] font-bold">•</span>
                  <span>Freie Cashflows für die kommenden Jahre schätzen</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-blue)] font-bold">•</span>
                  <span>Einen langfristigen Wachstumswert für die Zeit danach ansetzen</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-blue)] font-bold">•</span>
                  <span>Alle Cashflows mit der Eigenkapitalkostenrate abzinsen</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--accent-blue)] font-bold">•</span>
                  <span>Den berechneten Fair Value mit dem aktuellen Marktpreis vergleichen</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex gap-4 text-[9px] font-bold text-[var(--text-muted)]">
                <span>BETA: <span className="text-[var(--text-primary)] tabular-nums">{data.assumptions.beta}</span></span>
                <span>WGR: <span className="text-[var(--text-primary)] tabular-nums">{data.assumptions.growthRate}%</span></span>
                <span>DR: <span className="text-[var(--text-primary)] tabular-nums">{data.assumptions.costOfEquity}%</span></span>
              </div>
            </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black tracking-wider uppercase ${isUndervalued ? 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20 text-[var(--accent-green)]' : 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20 text-[var(--accent-red)]'}`}>
          {isUndervalued ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
          {diffPct}% {isUndervalued ? 'Unterbewertet' : 'Überbewertet'}
        </div>
      </div>

      <div className="relative h-14 flex items-center px-1">
        <div className="absolute left-0 right-0 h-0.5 bg-[var(--border-main)] rounded-full mx-1" />
        
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute h-0.5 rounded-full origin-left opacity-40" 
          style={{ 
            left: `${Math.min(currentPos, fairPos)}%`, 
            width: `${Math.abs(currentPos - fairPos)}%`,
            background: isUndervalued ? 'var(--accent-green)' : 'var(--accent-red)'
          }} 
        />

        <div className="absolute w-[2px] h-3 bg-[var(--border-main)] rounded-full" style={{ left: '0%' }} />
        <div className="absolute w-[2px] h-3 bg-[var(--border-main)] rounded-full" style={{ left: '100%' }} />

        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-20 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${fairPos}%` }}
        >
          <div className={`w-5 h-5 rounded-full border-2 border-[var(--bg-card)] shadow-2xl flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${isUndervalued ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}`}>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
          <div className="mt-2 text-center whitespace-nowrap">
            <span className="block text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Bewertung</span>
            <span className={`text-[10px] font-black leading-none tabular-nums ${isUndervalued ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>${data.fairValue}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 -translate-x-1/2 flex flex-col items-center mt-6"
          style={{ left: `${currentPos}%`, bottom: '-20px' }}
        >
          <div className="w-1 h-3 bg-[var(--accent-blue)] rounded-full" />
          <span className="text-[10px] font-bold text-[var(--accent-blue)] tabular-nums">${data.currentPrice}</span>
        </motion.div>
      </div>

      <div className="h-32 w-full mt-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dcfData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="name" hide />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 600 }} />
            <Tooltip 
              cursor={{ fill: 'var(--bg-card-hover)' }}
              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-main)', borderRadius: '4px', fontSize: '10px' }}
            />
            <Bar dataKey="price" name="Aktuell" fill="var(--accent-blue)" radius={[1, 1, 0, 0]} barSize={20} />
            <Bar dataKey="fairValue" name="Fair Value" fill="var(--text-muted)" radius={[1, 1, 0, 0]} barSize={20} opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ValuationBadge = ({ ticker, currentPrice }: { ticker: string; currentPrice: number }) => {
  const dcf = useFetch<ValuationData | null>(`/dcf/${ticker}`, null);
  if (!dcf?.fairValue) return null;
  const isUndervalued = currentPrice < dcf.fairValue;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter tabular-nums border ${isUndervalued ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20' : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20'}`}>
      {isUndervalued ? 'Unterbewertet' : 'Überbewertet'}
    </span>
  );
};

export default DCFChart;
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Info, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ValuationData {
  ticker: string;
  currentPrice: number;
  fairValue: number;
  currency: string;
  discount: number;
  assumptions: {
    beta: number;
    costOfEquity: number;
    growthRate: number;
    terminalGrowth: number;
  };
}

const DCFChart = ({ ticker }: { ticker: string }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    
    fetch(`/api/valuation/${ticker}`)
      .then(r => r.json())
      .then(d => { 
        if (!mounted) return;
        if (d.error || !d.fairValue) {
          setError(true);
        } else {
          setData(d); 
        }
        setLoading(false); 
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });
      
    return () => { mounted = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="mt-4 bg-white/5 rounded-2xl p-6 border border-white/5 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/3 mb-6" />
        <div className="h-1.5 bg-white/5 rounded-full w-full mb-8" />
        <div className="flex justify-between">
          <div className="h-3 bg-white/5 rounded w-12" />
          <div className="h-3 bg-white/5 rounded w-12" />
        </div>
      </div>
    );
  }

  if (error || !data || data.fairValue <= 0) {
    return (
      <div className="mt-4 bg-red-500/5 rounded-2xl p-4 border border-red-500/10 flex items-center gap-3">
        <AlertTriangle size={14} className="text-red-400 opacity-50" />
        <p className="text-[10px] font-bold text-red-400/50 uppercase tracking-widest">{t('dash_no_data')}</p>
      </div>
    );
  }

  const isUndervalued = data.fairValue > data.currentPrice;
  const diffPct = Math.abs(data.discount);
  
  // Scale logic for the visual bar
  const margin = 0.2;
  const minVal = Math.min(data.currentPrice, data.fairValue) * (1 - margin);
  const maxVal = Math.max(data.currentPrice, data.fairValue) * (1 + margin);
  const range = maxVal - minVal;
  
  const getPos = (val: number) => Math.min(100, Math.max(0, ((val - minVal) / range) * 100));
  
  const currentPos = getPos(data.currentPrice);
  const fairPos = getPos(data.fairValue);

  return (
    <div className="mt-4 bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
      {/* Background glow */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-20 transition-colors duration-500 ${isUndervalued ? 'bg-green-500' : 'bg-red-500'}`} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('dash_valuation')}</span>
          <div className="group/info relative">
            <div className="group/info relative">
              <Info size={12} className="text-slate-600 cursor-help hover:text-indigo-400 transition-colors" />
              <div className="absolute bottom-full left-0 mb-3 w-80 p-4 bg-[#0a0a0c] border border-white/10 rounded-2xl text-[10px] text-slate-400 opacity-0 group-hover/info:opacity-100 transition-all transform translate-y-2 group-hover/info:translate-y-0 pointer-events-none z-50 shadow-2xl backdrop-blur-xl">
                <p className="font-bold text-slate-200 mb-2 uppercase tracking-wider">{t('dcf_info_title')}</p>
                <p className="mb-3 text-slate-500 leading-relaxed italic">{t('dcf_info_p1')}</p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{t('dcf_info_step1')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{t('dcf_info_step2')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{t('dcf_info_step3')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{t('dcf_info_step4')}</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-white/5 flex gap-4 text-[9px] font-bold text-slate-500">
                  <span>BETA: <span className="text-white">{data.assumptions.beta}</span></span>
                  <span>WGR: <span className="text-white">{data.assumptions.growthRate}%</span></span>
                  <span>DR: <span className="text-white">{data.assumptions.costOfEquity}%</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wider uppercase ${isUndervalued ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {isUndervalued ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
          {diffPct}% {isUndervalued ? t('dash_undervalued') : t('dash_overvalued')}
        </div>
      </div>

      <div className="relative h-14 flex items-center px-1">
        {/* Track */}
        <div className="absolute left-0 right-0 h-1 bg-white/5 rounded-full mx-1" />
        
        {/* Active Segment */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute h-1 rounded-full origin-left opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
          style={{ 
            left: `${Math.min(currentPos, fairPos)}%`, 
            width: `${Math.abs(currentPos - fairPos)}%`,
            background: isUndervalued ? '#4ade80' : '#f87171'
          }} 
        />

        {/* Legend lines */}
        <div className="absolute w-[2px] h-3 bg-white/10 rounded-full" style={{ left: '0%' }} />
        <div className="absolute w-[2px] h-3 bg-white/10 rounded-full" style={{ left: '100%' }} />

        {/* Fair Value Marker (Target) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.3 }}
          className="absolute z-20 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${fairPos}%` }}
        >
          <div className={`w-5 h-5 rounded-full border-2 border-[#0a0a0c] shadow-2xl flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${isUndervalued ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]" />
          </div>
          <div className="mt-2 text-center whitespace-nowrap">
            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-tighter">{t('dash_valuation')}</span>
            <span className={`text-[10px] font-black leading-none ${isUndervalued ? 'text-green-400' : 'text-red-400'}`}>${data.fairValue}</span>
          </div>
        </motion.div>

        {/* Current Price Marker */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.5 }}
          className="absolute z-10 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${currentPos}%` }}
        >
          <div className="w-0.5 h-6 bg-white/30 rounded-full mb-1" />
          <div className="w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-900 shadow-lg ring-4 ring-white/5" />
          <div className="mt-1 flex flex-col items-center bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{t('dash_current')}</span>
            <span className="text-[10px] font-black text-white leading-none">${data.currentPrice}</span>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
        <span>{t('dash_bearish_range')}</span>
        <span>{t('dash_bullish_projection')}</span>
      </div>
    </div>
  );
};

export const ValuationBadge = ({ ticker, currentPrice }: { ticker: string; currentPrice: number }) => {
  const [data, setData] = useState<ValuationData | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${ticker}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); });
  }, [ticker]);

  if (!data || !data.fairValue) return <span className="text-slate-600">-</span>;
  
  const isUndervalued = data.fairValue > currentPrice;
  const diffPct = Math.abs(data.discount);

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-white font-mono font-bold">${data.fairValue.toFixed(2)}</span>
      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isUndervalued ? 'text-green-400' : 'text-red-400'}`}>
        {isUndervalued ? <ArrowUpRight size={8} strokeWidth={3} /> : <ArrowDownRight size={8} strokeWidth={3} />}
        {diffPct}%
      </span>
    </div>
  );
};

export default DCFChart;

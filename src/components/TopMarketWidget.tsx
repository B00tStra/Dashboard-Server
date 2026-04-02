import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, TrendingDown, Minus, Activity, LayoutGrid } from 'lucide-react';
import { FearAndGreedGauge, FearAndGreedData } from './FearAndGreedGauge';

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

function useScoreLabel(score: number) {
  const { t } = useLanguage();
  if (score >= 50) return { label: t('analysis_bullish') || 'Strong Bullish',    icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
  if (score >= 10) return { label: t('analysis_sl_bullish') || 'Bullish', icon: TrendingUp,   color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (score >= -10) return { label: t('analysis_neutral') || 'Neutral',   icon: Minus,        color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' };
  if (score >= -50) return { label: t('analysis_sl_bearish') || 'Bearish',icon: TrendingDown, color: 'text-rose-300',   bg: 'bg-rose-500/10 border-rose-500/20' };
  return             { label: t('analysis_bearish') || 'Strong Bearish',         icon: TrendingDown, color: 'text-rose-400',   bg: 'bg-rose-500/20 border-rose-500/30' };
}

function SentimentBar({ bullish, bearish, neutral }: { bullish: number; bearish: number; neutral: number }) {
  return (
    <div className="flex rounded-full overflow-hidden h-1.5 gap-px w-full">
      <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${bullish}%` }} />
      <div className="bg-slate-500 transition-all duration-700" style={{ width: `${neutral}%` }} />
      <div className="bg-rose-500 transition-all duration-700" style={{ width: `${bearish}%` }} />
    </div>
  );
}

function NavButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/market-analysis')}
      className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white hover:bg-indigo-500/30 hover:border-indigo-400/50 transition-all group shadow-lg hover:shadow-indigo-500/20 text-sm font-bold"
    >
      <Activity size={18} className="text-indigo-400 group-hover:text-white transition-colors" />
      <span className="group-hover:scale-105 transition-transform tracking-wide">Full Market Analysis</span>
      <span className="ml-auto text-sm font-black text-indigo-400 group-hover:text-white group-hover:translate-x-1 transition-all">→</span>
    </button>
  );
}

function DashboardMacroWidget({ data, fearAndGreed }: { data: any[]; fearAndGreed: FearAndGreedData | undefined }) {
  const getStatusStyle = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s.includes('extreme fear')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (s.includes('fear')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (s.includes('neutral')) return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    if (s.includes('extreme greed')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('greed')) return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  };

  if (!fearAndGreed) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      
      {/* ── Left: Fear & Greed Gauge ── */}
      <div className="xl:col-span-1 flex flex-col h-full">
        <FearAndGreedGauge data={fearAndGreed} title="Fear and Greed Index" showLegend={true} />
        <NavButton />
      </div>

      {/* ── Right: Compact Macro Indicators ── */}
      <div className="xl:col-span-2 glass-panel rounded-[2rem] p-6 border-white/5 bg-slate-800/20 flex flex-col justify-center">
        <h3 className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black mb-6 pl-2 flex items-center gap-3">
          <div className="w-6 h-px bg-indigo-500/50" />
          Global Macro Indicators
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.slice(0, 3).map((item, index) => (
            <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/80 transition-colors group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-[20px] -mr-8 -mt-8 pointer-events-none group-hover:bg-indigo-500/20 transition-colors"/>
               <div className="flex flex-col h-full justify-between">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight">{item.value}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-700/50">
                     <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black border uppercase tracking-widest ${getStatusStyle(item.status)}`}>
                       {item.status}
                     </span>
                     <div className="flex items-end gap-1 h-4">
                       {[0.4, 0.6, 0.5, 0.8, 0.7].map((h, i) => (
                          <div key={i} className="w-1 bg-slate-600 rounded-t-sm group-hover:bg-indigo-400 transition-colors duration-300" style={{ height: `${h * 100}%` }} />
                       ))}
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HeatmapTile({ ticker, index }: { ticker: any; index: number }) {
  const score = ticker.score || 0;
  const isPositive = score > 10;
  const isNegative = score < -10;

  let bgClass = 'bg-slate-800/40 border-slate-700/50';
  if (score >= 50) bgClass = 'bg-emerald-900/60 border-emerald-500/40';
  else if (score >= 10) bgClass = 'bg-emerald-900/30 border-emerald-500/20';
  else if (score <= -50) bgClass = 'bg-rose-900/60 border-rose-500/40';
  else if (score <= -10) bgClass = 'bg-rose-900/30 border-rose-500/20';

  const { label } = useScoreLabel(score);
  const ringClass = 'hover:border-white/20';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`relative p-4 rounded-2xl transition-all duration-300 border backdrop-blur-md flex flex-col justify-between group h-24 ${bgClass} ${ringClass}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-lg font-black text-white tracking-tight">{ticker.ticker}</span>
        <span className={`text-lg font-black ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
           {score > 0 ? '+' : ''}{score}
        </span>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
           <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider truncate">{label}</span>
        </div>
        <SentimentBar bullish={ticker.bullish || 0} bearish={ticker.bearish || 0} neutral={ticker.neutral || 0} />
      </div>
    </motion.div>
  );
}

const TopMarketWidget: React.FC = () => {
  const marketDataRaw = useFetch<any>('/market-data', null);
  const stockNewsListRaw = useFetch<any[]>('/stock-news', []);

  const marketData = {
    stocks: { macro: [], fearAndGreed: { current: 50, yesterday: 50, lastWeek: 50, lastMonth: 50, status: 'Neutral', indicators: [] } },
    ...(marketDataRaw || {})
  };

  const currentMacro = marketData.stocks.macro || [];
  const fearAndGreed = marketData.stocks.fearAndGreed;

  // Extract top 5 stocks by absolute momentum score to highlight the most active movers
  const topMovers = (Array.isArray(stockNewsListRaw) ? stockNewsListRaw : [])
    .filter(s => s && s.ticker && typeof s.score === 'number')
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 5);

  return (
    <div className="w-full">
      <DashboardMacroWidget data={currentMacro} fearAndGreed={fearAndGreed} />
      
      {topMovers.length > 0 && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
               <LayoutGrid className="text-indigo-400" size={18}/> Top 5 Sector Movers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topMovers.map((t, i) => (
                <HeatmapTile key={t.ticker} ticker={t} index={i} />
              ))}
            </div>
         </motion.div>
      )}
    </div>
  );
};

export default TopMarketWidget;

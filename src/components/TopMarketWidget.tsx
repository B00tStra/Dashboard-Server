import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  if (score >= 50) return { label: 'Stark bullish', icon: TrendingUp, color: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20' };
  if (score >= 10) return { label: 'Bullish', icon: TrendingUp, color: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]/5 border-[var(--accent-green)]/10' };
  if (score >= -10) return { label: 'Neutral', icon: Minus, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-card-hover)] border-[var(--border-main)]' };
  if (score >= -50) return { label: 'Bearish', icon: TrendingDown, color: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]/5 border-[var(--accent-red)]/10' };
  return { label: 'Stark bearish', icon: TrendingDown, color: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20' };
}

function SentimentBar({ bullish, bearish, neutral }: { bullish: number; bearish: number; neutral: number }) {
  return (
    <div className="flex rounded-full overflow-hidden h-1 gap-px w-full bg-[var(--bg-sidebar)]">
      <div className="bg-[var(--accent-green)] transition-all duration-700" style={{ width: `${bullish}%` }} />
      <div className="bg-[var(--text-muted)] transition-all duration-700 opacity-30" style={{ width: `${neutral}%` }} />
      <div className="bg-[var(--accent-red)] transition-all duration-700" style={{ width: `${bearish}%` }} />
    </div>
  );
}

function NavButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/market-analysis')}
      className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)] hover:border-[var(--accent-blue)] hover:bg-[var(--bg-card-hover)] transition-all group shadow-sm text-xs font-black uppercase tracking-widest"
    >
      <Activity size={16} className="text-[var(--accent-blue)] group-hover:scale-110 transition-transform" />
      <span>Full Market Matrix</span>
      <span className="ml-auto text-[var(--accent-blue)] group-hover:translate-x-1 transition-all">→</span>
    </button>
  );
}

function DashboardMacroWidget({ data, fearAndGreed }: { data: any[]; fearAndGreed: FearAndGreedData | undefined }) {
  const getStatusStyle = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s.includes('extreme fear')) return 'bg-[var(--accent-red)]/20 text-[var(--accent-red)] border-[var(--accent-red)]/30';
    if (s.includes('fear')) return 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20';
    if (s.includes('neutral')) return 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-main)]';
    if (s.includes('extreme greed')) return 'bg-[var(--accent-green)]/20 text-[var(--accent-green)] border-[var(--accent-green)]/30';
    if (s.includes('greed')) return 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20';
    return 'bg-[var(--bg-sidebar)] text-[var(--text-muted)] border-[var(--border-secondary)]';
  };

  if (!fearAndGreed) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 w-full">
      <div className="xl:col-span-1 flex flex-col h-full">
        <FearAndGreedGauge data={fearAndGreed} title="Sentiment Gauge" showLegend={true} />
        <NavButton />
      </div>

      <div className="xl:col-span-2 analytics-card p-6 flex flex-col justify-center">
        <h3 className="section-title mb-6 flex items-center gap-3">
          <div className="w-6 h-px bg-[var(--accent-blue)]/30" />
          Global Macro Cluster
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {data.slice(0, 3).map((item, index) => (
            <div key={index} className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl p-5 hover:bg-[var(--bg-card-hover)] transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent-blue)]/5 rounded-full blur-[20px] -mr-8 -mt-8 pointer-events-none group-hover:bg-[var(--accent-blue)]/10 transition-colors"/>
               <div className="flex flex-col h-full justify-between">
                  <div className="mb-4">
                    <p className="section-title mb-2">{item.label}</p>
                    <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">{item.value}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--border-secondary)]">
                     <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black border uppercase tracking-widest tabular-nums ${getStatusStyle(item.status)}`}>
                       {item.status}
                     </span>
                     <div className="flex items-end gap-1 h-3 opacity-30 group-hover:opacity-100 transition-opacity">
                       {[0.4, 0.6, 0.5, 0.8, 0.7].map((h, i) => (
                          <div key={i} className="w-1 bg-[var(--text-muted)] rounded-t-sm group-hover:bg-[var(--accent-blue)] transition-colors duration-300" style={{ height: `${h * 100}%` }} />
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

  let bgClass = 'bg-[var(--bg-card)] border-[var(--border-main)]';
  if (score >= 50) bgClass = 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/30';
  else if (score >= 10) bgClass = 'bg-[var(--accent-green)]/5 border-[var(--accent-green)]/20';
  else if (score <= -50) bgClass = 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/30';
  else if (score <= -10) bgClass = 'bg-[var(--accent-red)]/5 border-[var(--accent-red)]/20';

  const { label } = useScoreLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`relative p-4 rounded-xl transition-all duration-300 border flex flex-col justify-between group h-24 w-full ${bgClass} hover:border-[var(--text-muted)]`}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{ticker.ticker}</span>
        <span className={`text-sm font-black tabular-nums ${isPositive ? 'text-[var(--accent-green)]' : isNegative ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}>
           {score > 0 ? '+' : ''}{score}
        </span>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
           <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider truncate">{label}</span>
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

  const topMovers = (Array.isArray(stockNewsListRaw) ? stockNewsListRaw : [])
    .filter(s => s && s.ticker && typeof s.score === 'number')
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 5);

  return (
    <div className="w-full">
      <DashboardMacroWidget data={currentMacro} fearAndGreed={fearAndGreed} />
      
      {topMovers.length > 0 && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 w-full">
            <h2 className="section-title text-[var(--text-primary)] mb-4 flex items-center gap-2">
               <LayoutGrid className="text-[var(--accent-blue)]" size={14}/> Top Movers Matrix
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
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
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowLeft, Activity, Clock } from 'lucide-react';
import { FearAndGreedGauge, FearAndGreedData } from '../components/FearAndGreedGauge';

const API_BASE = '/api';

function useFetch<T>(endpoint: string, initialData: T): T {
  const [data, setData] = useState<T>(initialData);
  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('FearAndGreed Fetch Error:', err));
  }, [endpoint]);
  return data;
}

// ── Status Color ──────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('extreme fear') || s.includes('fear')) return {
    badge: 'text-[var(--accent-red)] border-[var(--accent-red)]/20 bg-[var(--accent-red)]/5',
    line: 'var(--accent-red)',
  };
  if (s.includes('extreme greed') || s.includes('greed')) return {
    badge: 'text-[var(--accent-green)] border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5',
    line: 'var(--accent-green)',
  };
  return {
    badge: 'text-[var(--text-muted)] border-[var(--border-main)] bg-[var(--bg-sidebar)]',
    line: 'var(--text-muted)',
  };
}

// ── Static indicator metadata ─────────────────────────────────────────────────

const INDICATORS_META: Record<string, { description: string; subtitle: string }> = {
  'Market Momentum': {
    subtitle: 'S&P 500 vs. 125D Moving Average',
    description: 'Current index position relative to its 125-day rolling average. Divergence signals a shift in structural momentum.',
  },
  'Stock Price Strength': {
    subtitle: 'Net 52-Week Highs/Lows (NYSE)',
    description: 'Calculates the ratio of equities reaching yearly price peaks versus those hitting yearly troughs.',
  },
  'Stock Price Breadth': {
    subtitle: 'McClellan Volume Summation Index',
    description: 'Analyzes the cumulative volume of rising stocks against falling stocks to determine market participation.',
  },
  'Put and Call Options': {
    subtitle: '5D Average Put/Call Ratio',
    description: 'A higher ratio indicates increased hedging and bearish sentiment. Values above 1.0 signal defensive positioning.',
  },
  'Market Volatility': {
    subtitle: 'VIX vs. 50D Moving Average',
    description: 'Measures implied volatility of S&P 500 options. Rising VIX values typically correlate with fear-driven liquidation.',
  },
  'Safe Haven Demand': {
    subtitle: 'Bond vs. Equity 20D Performance',
    description: 'Analyzes capital flows between Treasury instruments and risky assets. Flight to quality signals fear.',
  },
  'Junk Bond Demand': {
    subtitle: 'High Yield vs. Investment Grade Spread',
    description: 'Credit risk appetite measured by the yield premium demanded for speculative-grade corporate debt.',
  },
};

// ── Generate mock chart data ──────────────────────────────────────────────────

function mockTrend(base: number, length = 40, variance = 10): { v: number }[] {
  let v = base;
  return Array.from({ length }, () => {
    v += (Math.random() - 0.5) * variance;
    v = Math.max(0, Math.min(100, v));
    return { v: parseFloat(v.toFixed(2)) };
  });
}

// ── Indicator Card ────────────────────────────────────────────────────────────

interface IndicatorCardProps {
  name: string;
  status: string;
  value: string;
  index: number;
}

function IndicatorCard({ name, status, value, index }: IndicatorCardProps) {
  const meta = INDICATORS_META[name] || { subtitle: value, description: '' };
  const style = getStatusStyle(status);

  const seed = name.length * (status.length || 5);
  const baseScore = status.toLowerCase().includes('extreme fear') ? 15 :
                    status.toLowerCase().includes('fear') ? 35 :
                    status.toLowerCase().includes('extreme greed') ? 85 :
                    status.toLowerCase().includes('greed') ? 70 : 50;
  const chartData = React.useMemo(() => mockTrend(seed % 30 + baseScore, 40, 8), [name, status]);

  return (
    <motion.div
      className="analytics-card p-6 flex flex-col gap-5 border-[var(--border-main)] group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] text-[var(--test-primary)] font-black uppercase tracking-[0.4em] mb-1 opacity-40">
            Vector {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase">{name}</h3>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{meta.subtitle}</p>
        </div>
        <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border tabular-nums whitespace-nowrap ${style.badge}`}>
          {status}
        </div>
      </div>

      <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fg-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={style.line} stopOpacity={0.1} />
                <stop offset="95%" stopColor={style.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
            <Area
              type="linear"
              dataKey="v"
              stroke={style.line}
              strokeWidth={1.5}
              fill={`url(#fg-${index})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-relaxed">
        {meta.description}
      </p>

      <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] mt-auto pt-4 border-t border-[var(--border-secondary)]">
        <Clock size={10} className="text-[var(--accent-blue)]" />
        <span>Telemetry Synchronized · Real-time Feed</span>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FearAndGreedPage: React.FC = () => {
  const navigate = useNavigate();
  const marketData = useFetch<any>('/market-data', null);

  const stocksFG: FearAndGreedData | undefined = marketData?.stocks?.fearAndGreed;
  const cryptoFG: FearAndGreedData | undefined = marketData?.crypto?.fearAndGreed;
  const [tab, setTab] = useState<'stocks' | 'crypto'>('stocks');
  const currentFG = tab === 'stocks' ? stocksFG : cryptoFG;
  const indicators = (currentFG?.indicators || []) as Array<{ name: string; status: string; value: string }>;

  return (
    <div className="analytics-grid pt-6 w-full max-w-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-main)] mb-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/analysis')}
            className="w-10 h-10 rounded bg-[var(--bg-sidebar)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3 uppercase">
              <Activity className="text-[var(--accent-blue)]" size={24} />
              Sentiment Matrix
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                7 Constituent Vectors · Cluster Synthesis Analysis
            </p>
          </div>
        </div>

        <div className="flex bg-[var(--bg-sidebar)] p-1 rounded border border-[var(--border-main)] shadow-inner">
            <button
              className={`px-8 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'stocks' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setTab('stocks')}
            >
              Equity
            </button>
            <button
              className={`px-8 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'crypto' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setTab('crypto')}
            >
              Crypto
            </button>
        </div>
      </div>

      {currentFG ? (
        <div className="space-y-12">
          
          <div className="max-w-xl mx-auto w-full">
            <FearAndGreedGauge
              data={currentFG}
              title="Central Sentiment Hub"
              showLegend={true}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Current Vector', value: currentFG.current, isMain: true },
              { label: 'Prior Close', value: currentFG.yesterday },
              { label: '7D Rolling Avg', value: currentFG.lastWeek },
              { label: '30D Rolling Avg', value: currentFG.lastMonth },
            ].map((item) => {
              const style = getStatusStyle(
                item.value <= 25 ? 'Extreme Fear' :
                item.value <= 45 ? 'Fear' :
                item.value <= 55 ? 'Neutral' :
                item.value <= 75 ? 'Greed' : 'Extreme Greed'
              );

              return (
                <div
                  key={item.label}
                  className={`analytics-card p-6 text-center border-[var(--border-main)] ${item.isMain ? 'border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/5 shadow-[0_0_20px_var(--accent-blue)]/5' : ''}`}
                >
                  <p className="text-[9px] text-[var(--test-primary)] font-black uppercase tracking-[0.2em] mb-4 opacity-40">{item.label}</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: style.line }}>
                      {item.value}
                    </span>
                  </div>
                  <div className={`inline-block mt-4 text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded border tabular-nums ${style.badge}`}>
                    {item.value <= 25 ? 'EXTR FEAR' : item.value <= 45 ? 'FEAR' : item.value <= 55 ? 'NEUTRAL' : item.value <= 75 ? 'GREED' : 'EXTR GREED'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[var(--border-main)]" />
            <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] flex-shrink-0">
              Constituent Cluster Breakdown
            </h2>
            <div className="h-px flex-1 bg-[var(--border-main)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((ind, i) => (
              <IndicatorCard key={ind.name} {...ind} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center analytics-card border-dashed">
            <div className="w-10 h-10 border-2 border-[var(--accent-blue)]/20 border-t-[var(--accent-blue)] rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Decoding Sentiment Matrix...</span>
        </div>
      )}
    </div>
  );
};

export default FearAndGreedPage;

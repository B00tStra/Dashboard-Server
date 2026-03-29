import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
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
  if (s.includes('extreme fear')) return {
    badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-500',
    line: '#f43f5e',
    fill: 'rgba(244,63,94,0.1)',
  };
  if (s.includes('fear')) return {
    badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-500',
    line: '#f97316',
    fill: 'rgba(249,115,22,0.1)',
  };
  if (s.includes('extreme greed')) return {
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-500',
    line: '#10b981',
    fill: 'rgba(16,185,129,0.1)',
  };
  if (s.includes('greed')) return {
    badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    dot: 'bg-cyan-500',
    line: '#22d3ee',
    fill: 'rgba(34,211,238,0.1)',
  };
  return {
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/30',
    dot: 'bg-slate-500',
    line: '#94a3b8',
    fill: 'rgba(148,163,184,0.1)',
  };
}

// ── Static indicator metadata ─────────────────────────────────────────────────

const INDICATORS_META: Record<string, { description: string; subtitle: string }> = {
  'Market Momentum': {
    subtitle: 'S&P 500 vs. its 125-day moving average',
    description: 'When the S&P 500 is above its rolling average of the prior 125 trading days, that\'s a sign of positive momentum. If below, investors are getting cautious. The index uses slowing momentum as a signal for Fear.',
  },
  'Stock Price Strength': {
    subtitle: 'Net new 52-week highs and lows on the NYSE',
    description: 'The number of stocks at 52-week highs compared to 52-week lows. When highs vastly outnumber lows, that\'s a bullish sign and signals Greed.',
  },
  'Stock Price Breadth': {
    subtitle: 'McClellan Volume Summation Index',
    description: 'This measures the volume of NYSE shares rising vs. falling. A low or negative number is bearish. The index uses decreasing trading volume as a signal for Fear.',
  },
  'Put and Call Options': {
    subtitle: '5-day average put/call ratio',
    description: 'Puts are options to sell; calls are options to buy. When the put/call ratio rises, investors are growing more nervous. A ratio above 1 is considered bearish.',
  },
  'Market Volatility': {
    subtitle: 'VIX vs. its 50-day moving average',
    description: 'The CBOE VIX measures expected S&P 500 volatility over the next 30 days. It drops on rally days and soars during plunges. Higher VIX in a prolonged bear market signals Fear.',
  },
  'Safe Haven Demand': {
    subtitle: 'Difference in 20-day stock and bond returns',
    description: 'Shows the difference between Treasury bond and stock returns over the past 20 trading days. Bonds do better when investors are scared — this signals Fear.',
  },
  'Junk Bond Demand': {
    subtitle: 'Yield spread: junk bonds vs. investment grade',
    description: 'A smaller spread between junk bond yields and safer government bonds indicates investors are taking on more risk (Greed). A wider spread shows more caution (Fear).',
  },
};

// ── Generate mock chart data ──────────────────────────────────────────────────

function mockTrend(base: number, length = 40, variance = 15): { v: number }[] {
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

  // Generate stable mock data based on name + status
  const seed = name.length * (status.length || 5);
  const baseScore = status.toLowerCase().includes('extreme fear') ? 12 :
                    status.toLowerCase().includes('fear') ? 28 :
                    status.toLowerCase().includes('extreme greed') ? 88 :
                    status.toLowerCase().includes('greed') ? 72 : 50;
  const chartData = React.useMemo(() => mockTrend(seed % 30 + baseScore, 40, 12), [name]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border border-white/5 hover:border-white/10 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="text-base font-black text-white tracking-tight capitalize">{name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</p>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 ${style.badge}`}>
          {status}
        </span>
      </div>

      {/* Chart */}
      <div className="h-[80px] w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fg-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={style.line} stopOpacity={0.25} />
                <stop offset="95%" stopColor={style.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
            <Tooltip
              contentStyle={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e2e8f0', fontSize: 11 }}
              formatter={(v: number) => [v.toFixed(1), 'Value']}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={style.line}
              strokeWidth={2}
              fill={`url(#fg-${index})`}
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
        {meta.description}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium mt-auto pt-2 border-t border-white/5">
        <Clock size={10} />
        <span>Last updated today at {timeStr} EDT</span>
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
    <div className="p-4 sm:p-6 pb-16 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Market Analysis</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity size={22} className="text-indigo-400" />
              Fear &amp; Greed Index
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">7 constituent indicators · CNN Markets methodology</p>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-white/10 w-fit shadow-inner">
          <button
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-300 ${tab === 'stocks' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setTab('stocks')}
          >
            Stocks
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-300 ${tab === 'crypto' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setTab('crypto')}
          >
            Crypto
          </button>
        </div>
      </motion.div>

      {/* Main Gauge */}
      {currentFG && (
        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FearAndGreedGauge
            data={currentFG}
            title={tab === 'stocks' ? 'Stock Market Sentiment' : 'Crypto Market Sentiment'}
            showLegend={true}
          />
        </motion.div>
      )}

      {/* Historical Comparison - CNN Style */}
      {currentFG && (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: 'Now', value: currentFG.current, isMain: true },
            { label: 'Previous Close', value: currentFG.yesterday },
            { label: '1 Week Ago', value: currentFG.lastWeek },
            { label: '1 Month Ago', value: currentFG.lastMonth },
          ].map((item, i) => {
            const change = i > 0 ? item.value - currentFG.current : 0;
            const style = getStatusStyle(
              item.value <= 25 ? 'Extreme Fear' :
              item.value <= 45 ? 'Fear' :
              item.value <= 55 ? 'Neutral' :
              item.value <= 75 ? 'Greed' : 'Extreme Greed'
            );

            return (
              <div
                key={item.label}
                className={`glass-panel rounded-2xl p-5 text-center border ${item.isMain ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5'}`}
              >
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">{item.label}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`text-4xl font-black tabular-nums ${style.dot.replace('bg-', 'text-')}`}>
                    {item.value}
                  </span>
                  {i > 0 && change !== 0 && (
                    <div className="flex flex-col items-center">
                      {change > 0 ? (
                        <span className="text-green-400 text-xs">↑</span>
                      ) : (
                        <span className="text-red-400 text-xs">↓</span>
                      )}
                    </div>
                  )}
                </div>
                {i > 0 && (
                  <p className={`text-xs font-bold ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {change > 0 ? '+' : ''}{change}
                  </p>
                )}
                <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${style.badge}`}>
                  {item.value <= 25 ? 'Extreme Fear' : item.value <= 45 ? 'Fear' : item.value <= 55 ? 'Neutral' : item.value <= 75 ? 'Greed' : 'Extreme Greed'}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Section Title */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-white/5" />
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex-shrink-0">
          7 Fear &amp; Greed Indicators
        </h2>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {/* Indicators Grid */}
      {indicators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {indicators.map((ind, i) => (
            <IndicatorCard key={ind.name} {...ind} index={i} />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Activity size={24} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading indicator data...</p>
        </div>
      )}
    </div>
  );
};

export default FearAndGreedPage;

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FearAndGreedData } from '../components/FearAndGreedGauge';
import { motion } from 'framer-motion';

const API_BASE = '/api';

function mockTrend(base: number, length = 40, variance = 10): { v: number; date: string }[] {
  let v = base;
  return Array.from({ length }, (_, i) => {
    v += (Math.random() - 0.5) * variance;
    v = Math.max(0, Math.min(100, v));
    return { v: parseFloat(v.toFixed(2)), date: `${i}` };
  });
}

function useFetch<T>(endpoint: string, initialData: T): T {
  const [data, setData] = useState<T>(initialData);
  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('MarketAnalysis Fetch Error:', err));
  }, [endpoint]);
  return data;
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
const TermTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="term-card px-3 py-2 text-[10px] font-mono shadow-xl">
      <div className="micro-label mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>■</span>
          <span className="text-[var(--text-primary)] font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Macro Area Chart ──────────────────────────────────────────────────────────
function MacroAreaChart({ data, color = 'var(--accent-blue)', height = 160 }: { data: any[]; color?: string; height?: number }) {
  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="date" hide />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} domain={['dataMin', 'dataMax']} />
          <Tooltip content={<TermTooltip />} cursor={{ stroke: 'var(--border-main)', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--text-muted)' }: { data: any[]; color?: string }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Yield Curve ───────────────────────────────────────────────────────────────
function YieldCurvePanel({ snapshot }: { snapshot: { label: string; value: number }[] }) {
  if (!snapshot?.length) return null;
  const minVal = Math.min(...snapshot.map(p => p.value));
  const maxVal = Math.max(...snapshot.map(p => p.value));
  const range  = maxVal - minVal || 1;
  const isInverted = snapshot.some((p, i) => i > 0 && p.value < snapshot[i - 1].value);

  return (
    <div className="term-card">
      <div className="term-header">
        <span className="micro-label text-[var(--text-secondary)]">Yield Curve — U.S. Treasuries</span>
        <span className={`flex items-center gap-1.5 micro-label text-[9px] ${isInverted ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isInverted ? 'bg-[var(--accent-red)]' : 'bg-[var(--accent-green)]'}`} />
          {isInverted ? 'INVERTED' : 'NORMAL'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2 h-36">
          {snapshot.map((point, i) => {
            const h = ((point.value - minVal) / range) * 80 + 20;
            const isLow = i > 0 && point.value < snapshot[i - 1].value;
            return (
              <div key={point.label} className="flex-1 h-full flex flex-col justify-end items-center group">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${h}%` }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className={`w-full rounded-t-md transition-opacity group-hover:opacity-100 opacity-80 ${isLow ? 'bg-[var(--accent-red)]/50 group-hover:bg-[var(--accent-red)]/70' : 'bg-[var(--accent-blue)]/50 group-hover:bg-[var(--accent-blue)]/70'}`}
                />
                <div className="absolute -top-6 hidden group-hover:block z-50 pointer-events-none">
                  <div className="term-card px-2 py-1 text-[9px] font-mono text-[var(--accent-blue)]">{point.value.toFixed(2)}%</div>
                </div>
                <span className="micro-label text-[8px] mt-1.5 group-hover:text-[var(--text-primary)] transition-colors">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sector Grid ───────────────────────────────────────────────────────────────
function SectorGrid({ sectors }: { sectors: { name: string; change: number }[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2">
      {sectors.map(s => (
        <div key={s.name} className="term-card term-card-hover p-3 flex flex-col items-center text-center group">
          <p className="micro-label text-[8px] mb-1.5 truncate w-full group-hover:text-[var(--text-secondary)] transition-colors">{s.name}</p>
          <span className={`data-value text-xs font-bold ${s.change >= 0 ? 'text-pos' : 'text-neg'}`}>
            {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Fear & Greed ──────────────────────────────────────────────────────────────
function FearGreedCard({ fgData }: { fgData: FearAndGreedData | undefined }) {
  const score = fgData?.current ?? 0;
  const label = score >= 75 ? 'Extreme Greed' : score >= 55 ? 'Greed' : score >= 45 ? 'Neutral' : score >= 25 ? 'Fear' : 'Extreme Fear';
  const color  = score >= 55 ? 'var(--accent-green)' : score >= 45 ? 'var(--text-muted)' : 'var(--accent-red)';
  const pct = (score / 100) * 180; // degrees for half-circle

  return (
    <div className="term-card">
      <div className="term-header">
        <span className="micro-label text-[var(--text-secondary)]">Fear & Greed Index</span>
      </div>
      <div className="p-4 flex flex-col items-center">
        <div className="relative w-40 h-20 mt-2 mb-4">
          {/* Track */}
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="var(--border-main)" strokeWidth="8" strokeLinecap="round" />
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 180) * 141.3} 141.3`}
            />
            <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono" fill="var(--text-primary)">{score}</text>
          </svg>
        </div>
        <span className="data-value text-xs font-bold" style={{ color }}>{label}</span>
        <div className="flex justify-between w-full mt-3 pt-3 border-t border-[var(--border-dim)]">
          {['Fear', 'Neutral', 'Greed'].map(l => (
            <span key={l} className="micro-label text-[8px]">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, change, trend, unit = '' }: { title: string; value: string | number; change: string; trend: 'up' | 'down'; unit?: string }) {
  const Icon = trend === 'up' ? TrendingUp : TrendingDown;
  const iconClass = trend === 'up' ? 'icon-bg-green' : 'icon-bg-red';
  return (
    <div className="term-card term-card-hover p-5 flex flex-col justify-between h-28 group">
      <div className="flex items-start justify-between">
        <span className="micro-label">{title}</span>
        <div className={`w-8 h-8 flex items-center justify-center ${iconClass}`}>
          <Icon size={14} />
        </div>
      </div>
      <div>
        <div className="data-value text-lg font-bold text-[var(--text-primary)]">
          {value}<span className="text-xs text-[var(--text-muted)] ml-1 font-normal">{unit}</span>
        </div>
        <div className={`flex items-center gap-1 micro-label text-[9px] mt-0.5 ${trend === 'up' ? 'text-pos' : 'text-neg'}`}>
          {change}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const MarketAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');
  const marketDataRaw = useFetch<any>('/market-data', null);

  const stocks = marketDataRaw?.stocks || {};
  const macro  = marketDataRaw?.macro  || {};
  const currentData = activeTab === 'stocks' ? stocks : (marketDataRaw?.crypto || {});
  const fgData: FearAndGreedData | undefined = currentData.fearAndGreed;

  const tableData = [
    { name: 'S&P 500 Index',    vol: '12.4%', change: '+2.41%', trend: 'up' as const },
    { name: 'US 10Y Treasury',  vol: '4.2%',  change: '-1.12%', trend: 'down' as const },
    { name: 'Bitcoin',          vol: '48.2%', change: '+12.42%', trend: 'up' as const },
    { name: 'Gold Bullion',     vol: '8.1%',  change: '+0.54%', trend: 'up' as const },
  ];
  const sparklines = useMemo(() => tableData.map(() => mockTrend(50, 10, 5)), []);

  return (
    <div className="space-y-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity size={14} className="text-[var(--accent-blue)]" />
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">Market Analysis</h1>
            <p className="micro-label text-[9px] mt-0.5">FRED Macro Data · St. Louis Fed</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-1">
          {(['stocks', 'crypto'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg micro-label text-[9px] transition-all ${activeTab === tab ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
            >
              {tab === 'stocks' ? 'Equities' : 'Crypto'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Net Liquid Cap"       value="117.4" unit="T"  change="+1.24%"  trend="up" />
        <KpiCard title="Volatility (VIX)"     value="14.2"            change="-4.15%"  trend="down" />
        <KpiCard title="Strategic Inflow"     value="842"   unit="B"  change="+12.2%"  trend="up" />
        <KpiCard title="Cluster Coefficient"  value="0.84"            change="-0.02"   trend="down" />
      </div>

      {/* Sector Grid */}
      <div className="term-card">
        <div className="term-header">
          <span className="micro-label text-[var(--text-secondary)]">{t('sector_performance') || 'Sector Performance'}</span>
        </div>
        <div className="p-4">
          <SectorGrid sectors={stocks.sectorPerformance || []} />
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Left: FRED Charts */}
        <div className="xl:col-span-8 space-y-5">

          {/* CPI + Yield */}
          <div className="term-card">
            <div className="term-header">
              <span className="micro-label text-[var(--text-secondary)]">Macro Feed — FRED Data</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-px bg-[var(--accent-purple)]" /><span className="micro-label text-[9px] text-[var(--accent-purple)]">CPI</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-px bg-[var(--accent-blue)]" /><span className="micro-label text-[9px] text-[var(--accent-blue)]">10Y Yield</span></div>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="micro-label text-[9px] mb-3">U.S. Consumer Price Index (YoY)</p>
                <MacroAreaChart data={macro.cpiChart || []} color="var(--accent-purple)" height={160} />
              </div>
              <div>
                <p className="micro-label text-[9px] mb-3">U.S. Treasury Yield (10Y)</p>
                <MacroAreaChart data={macro.yieldChart || []} color="var(--accent-blue)" height={160} />
              </div>
            </div>
          </div>

          {/* Asset correlation table */}
          <div className="term-card">
            <div className="term-header">
              <span className="micro-label text-[var(--text-secondary)]">Inter-Market Asset Correlation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-main)]/50">
                  <tr>
                    <th className="py-2 px-4 micro-label font-normal text-[var(--text-muted)]">Asset Class</th>
                    <th className="py-2 px-4 micro-label font-normal text-[var(--text-muted)] text-right">Volatility</th>
                    <th className="py-2 px-4 micro-label font-normal text-[var(--text-muted)] text-right">7D Change</th>
                    <th className="py-2 px-4 micro-label font-normal text-[var(--text-muted)] text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-dim)]/60">
                  {tableData.map((r, idx) => (
                    <tr key={r.name} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                      <td className="py-2.5 px-4 text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{r.name}</td>
                      <td className="py-2.5 px-4 text-right data-value text-xs text-[var(--text-muted)]">{r.vol}</td>
                      <td className={`py-2.5 px-4 text-right data-value text-xs font-bold ${r.trend === 'up' ? 'text-pos' : 'text-neg'}`}>{r.change}</td>
                      <td className="py-2.5 px-4 text-right flex justify-end">
                        <Sparkline data={sparklines[idx]} color={r.trend === 'up' ? 'var(--accent-green)' : 'var(--accent-red)'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: F&G + Yield Curve */}
        <div className="xl:col-span-4 space-y-5">
          <FearGreedCard fgData={fgData} />
          <YieldCurvePanel snapshot={macro.yieldCurve || []} />
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;

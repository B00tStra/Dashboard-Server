import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity, BarChart2, TrendingUp,
  DollarSign, Percent, Users, TrendingDown as TrendDown,
  Layers, Droplets, Database, Brain, Zap, AlertCircle,
} from 'lucide-react';
import { FearAndGreedData } from '../components/FearAndGreedGauge';

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

// ── Interfaces ────────────────────────────────────────────────────────────────

interface FredSeries {
  current: number;
  prev: number;
  history: { date: string; v: number }[];
}

interface FredCharts {
  fedFunds: FredSeries;
  cpi: FredSeries;
  unemployment: FredSeries;
  yieldCurve: FredSeries;
  payrolls: FredSeries;
  gdpGrowth: FredSeries;
  consumerSentiment: FredSeries;
  breakevenInflation: FredSeries;
  fedBalanceSheet: FredSeries;
  joblessClaims: FredSeries;
  wtiOil: FredSeries;
  yieldCurveSnapshot: { label: string; value: number }[];
}

interface MarketData {
  stocks: { macro: any[]; fearAndGreed: FearAndGreedData };
  crypto: { macro: any[]; fearAndGreed: FearAndGreedData };
  fredCharts?: FredCharts;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function delta(current: number, prev: number) {
  const d = parseFloat((current - prev).toFixed(2));
  return { d, sign: d > 0 ? '+' : '', color: d > 0 ? 'text-emerald-400' : d < 0 ? 'text-rose-400' : 'text-slate-500' };
}

function fgColor(score: number) {
  if (score <= 25) return { text: 'text-rose-400', stroke: '#f43f5e', bg: 'bg-rose-500', label: 'Extreme Fear' };
  if (score <= 45) return { text: 'text-orange-400', stroke: '#f97316', bg: 'bg-orange-500', label: 'Fear' };
  if (score <= 55) return { text: 'text-slate-300', stroke: '#94a3b8', bg: 'bg-slate-400', label: 'Neutral' };
  if (score <= 75) return { text: 'text-emerald-400', stroke: '#4ade80', bg: 'bg-emerald-400', label: 'Greed' };
  return { text: 'text-emerald-300', stroke: '#22c55e', bg: 'bg-emerald-500', label: 'Extreme Greed' };
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, color = 'indigo' }: {
  icon: React.ElementType; title: string; subtitle?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    cyan:   'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    amber:  'bg-amber-500/15 border-amber-500/30 text-amber-400',
    rose:   'bg-rose-500/15 border-rose-500/30 text-rose-400',
    emerald:'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  };
  const cls = colorMap[color] || colorMap.indigo;
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cls}`}>
        <Icon size={15} />
      </div>
      <div>
        <h2 className="text-sm font-black text-white uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string; value: string | number; unit?: string;
  current: number; prev: number;
  status: 'good' | 'bad' | 'neutral' | 'warning';
  icon: React.ElementType;
  description?: string;
}

function KpiCard({ label, value, unit = '', current, prev, status, icon: Icon, description }: KpiCardProps) {
  const { d, sign, color: dc } = delta(current, prev);
  const border = status === 'good' ? 'border-emerald-500/30 hover:border-emerald-400/50'
    : status === 'bad'     ? 'border-rose-500/30 hover:border-rose-400/50'
    : status === 'warning' ? 'border-amber-500/30 hover:border-amber-400/50'
    : 'border-slate-700/50 hover:border-slate-600/60';
  const glow = status === 'good' ? 'bg-emerald-500/5' : status === 'bad' ? 'bg-rose-500/5' : status === 'warning' ? 'bg-amber-500/5' : '';
  const dot  = status === 'good' ? 'bg-emerald-400' : status === 'bad' ? 'bg-rose-400' : status === 'warning' ? 'bg-amber-400' : 'bg-slate-500';
  const ico  = status === 'good' ? 'text-emerald-400' : status === 'bad' ? 'text-rose-400' : status === 'warning' ? 'text-amber-400' : 'text-slate-400';

  return (
    <div className={`relative rounded-2xl p-4 border transition-all duration-200 cursor-default ${border} ${glow} bg-slate-900/60 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700/50">
          <Icon size={14} className={ico} />
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${dot}`} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white tracking-tight leading-none">
        {value}<span className="text-sm font-bold text-slate-400 ml-0.5">{unit}</span>
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] font-bold ${dc}`}>{sign}{d}{unit}</span>
        {description && <span className="text-[10px] text-slate-600 truncate">{description}</span>}
      </div>
    </div>
  );
}

// ── Chart Panel ───────────────────────────────────────────────────────────────

interface ChartPanelProps {
  title: string; subtitle?: string;
  data: { date: string; v: number }[];
  color: string; type: 'line' | 'area' | 'bar';
  unit?: string; referenceValue?: number; referenceLabel?: string;
  domain?: [number | 'auto', number | 'auto'];
  height?: number;
}

function ChartPanel({ title, subtitle, data, color, type, unit = '%', referenceValue, referenceLabel, domain, height = 160 }: ChartPanelProps) {
  const last  = data[data.length - 1]?.v;
  const first = data[0]?.v;
  const trend = last > first ? 'up' : last < first ? 'down' : 'flat';
  const step  = Math.max(1, Math.floor(data.length / 6));
  const ticks = data.filter((_, i) => i % step === 0).map(d => d.date);

  const gradId = `grad-${title.replace(/[\s()]/g, '-')}`;

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4 backdrop-blur-sm hover:border-slate-600/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-wider">{title}</p>
          {subtitle && <p className="text-[9px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border
          ${trend === 'up'   ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
            trend === 'down' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
            'text-slate-400 border-slate-600/30 bg-slate-700/20'}`}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {last?.toFixed(2)}{unit}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" ticks={ticks} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={domain || ['auto', 'auto']} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit={unit} />} />
              {referenceValue !== undefined && <ReferenceLine y={referenceValue} stroke="#475569" strokeDasharray="4 2" label={{ value: referenceLabel || '', fill: '#64748b', fontSize: 9 }} />}
              <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" ticks={ticks} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={domain || ['auto', 'auto']} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit={unit} />} />
              {referenceValue !== undefined && <ReferenceLine y={referenceValue} stroke={color} strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: referenceLabel || '', fill: '#94a3b8', fontSize: 9 }} />}
              <Area type="monotone" dataKey="v" stroke={color} fill={`url(#${gradId})`} strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" ticks={ticks} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={domain || ['auto', 'auto']} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit={unit} />} />
              {referenceValue !== undefined && <ReferenceLine y={referenceValue} stroke="#ef4444" strokeDasharray="4 2" label={{ value: referenceLabel || '', fill: '#ef4444', fontSize: 9, position: 'right' }} />}
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-black text-white">{payload[0]?.value?.toFixed(2)}{unit}</p>
    </div>
  );
}

// ── Yield Curve Snapshot ──────────────────────────────────────────────────────

function YieldCurvePanel({ snapshot }: { snapshot: { label: string; value: number }[] }) {
  if (!snapshot?.length) return null;
  const minVal = Math.min(...snapshot.map(p => p.value));
  const maxVal = Math.max(...snapshot.map(p => p.value));
  const range  = maxVal - minVal || 1;
  const isInverted = snapshot.some((p, i) => i > 0 && p.value < snapshot[i - 1].value);

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-wider">Vollständige Zinskurve</p>
          <p className="text-[9px] text-slate-500 mt-0.5">US-Staatsanleihen · Alle Laufzeiten</p>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          isInverted ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isInverted ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
          {isInverted ? 'INVERTIERT' : 'NORMAL'}
        </div>
      </div>
      <div className="flex items-end gap-1 h-24 mb-2">
        {snapshot.map((point, i) => {
          const h = ((point.value - minVal) / range) * 80 + 15;
          const isLow = i > 0 && point.value < snapshot[i - 1].value;
          return (
            <div key={point.label} className="flex-1 h-full flex flex-col justify-end items-center group relative">
              <div className={`w-full rounded-t-sm transition-all ${isLow ? 'bg-rose-500/60 group-hover:bg-rose-400' : 'bg-indigo-500/60 group-hover:bg-indigo-400'}`}
                style={{ height: `${h}%` }} />
              <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap">
                  <span className="font-black text-white">{point.value.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {snapshot.map(p => <div key={p.label} className="flex-1 text-center text-[9px] text-slate-500 font-bold">{p.label}</div>)}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-bold">
        <span>Tief: {minVal.toFixed(2)}%</span>
        <span>Hoch: {maxVal.toFixed(2)}%</span>
      </div>
    </div>
  );
}

// ── Fear & Greed Panel (flat design) ─────────────────────────────────────────

function FearGreedPanel({ data, label }: { data: FearAndGreedData; label: string }) {
  const navigate = useNavigate();
  const s  = data.current || 50;
  const c  = fgColor(s);
  const pct = (s / 100) * 100;

  const comparisons = [
    { label: 'Yesterday',   value: data.yesterday },
    { label: 'Last Week',   value: data.lastWeek },
    { label: 'Last Month',  value: data.lastMonth },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black text-white uppercase tracking-wider">Fear & Greed Index</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.text} border-current bg-white/5`}>
          {c.label.toUpperCase()}
        </span>
      </div>

      {/* Score + bar */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className={`text-5xl font-black tabular-nums ${c.text}`}>{s}</span>
          <span className="text-slate-500 text-sm font-bold">/ 100</span>
        </div>
        <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
          {/* gradient track */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(to right, #f43f5e 0%, #f97316 25%, #94a3b8 45%, #4ade80 65%, #22c55e 100%)' }}
          />
          {/* dark overlay from right */}
          <div className="absolute inset-0 rounded-full bg-slate-800"
            style={{ left: `${pct}%` }}
          />
          {/* needle */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
            style={{ left: `calc(${pct}% - 1px)` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-bold">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      {/* Historical comparisons */}
      <div className="grid grid-cols-3 gap-2">
        {comparisons.map(cmp => {
          const cc = fgColor(cmp.value || 50);
          return (
            <div key={cmp.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-slate-500 font-bold mb-1">{cmp.label}</p>
              <p className={`text-xl font-black ${cc.text}`}>{cmp.value ?? '—'}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{cc.label}</p>
            </div>
          );
        })}
      </div>

      {/* Zone legend */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: 'Ext. Fear',  color: 'bg-rose-500',    range: '0–25' },
          { label: 'Fear',       color: 'bg-orange-500',  range: '25–45' },
          { label: 'Neutral',    color: 'bg-slate-400',   range: '45–55' },
          { label: 'Greed',      color: 'bg-emerald-400', range: '55–75' },
          { label: 'Ext. Greed', color: 'bg-emerald-500', range: '75–100' },
        ].map((z, i) => (
          <div key={i} className="text-center">
            <div className={`h-1.5 ${z.color} rounded-full mb-1.5`} />
            <p className="text-[9px] text-slate-400 font-bold leading-tight">{z.label}</p>
            <p className="text-[8px] text-slate-600 font-mono">{z.range}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/fear-and-greed')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all text-xs font-bold group">
        <Activity size={14} />
        Detailed View
        <span className="ml-auto group-hover:translate-x-1 transition-transform">→</span>
      </button>
    </div>
  );
}

// ── Recession Signals ─────────────────────────────────────────────────────────

function RecessionPanel({ fc }: { fc: FredCharts }) {
  const signals = [
    {
      label: 'Zinskurve invertiert',
      active: (fc.yieldCurve.current ?? 0) < 0,
      value: `${fc.yieldCurve.current?.toFixed(2)}%`,
      note: 'Historisch 6–18 Monate vor Rezession',
    },
    {
      label: 'Inflation über Ziel',
      active: (fc.cpi.current ?? 0) > 2.5,
      value: `${fc.cpi.current?.toFixed(1)}% (Ziel: 2%)`,
      note: 'Zwingt Fed zu erhöhten Zinsen',
    },
    {
      label: 'BIP-Wachstum unter 1%',
      active: (fc.gdpGrowth.current ?? 0) < 1,
      value: `${fc.gdpGrowth.current?.toFixed(1)}%`,
      note: 'Stagnationsbereich',
    },
    {
      label: 'Arbeitslosigkeit steigt',
      active: fc.unemployment.current > fc.unemployment.prev,
      value: `${fc.unemployment.current}% (vorher: ${fc.unemployment.prev}%)`,
      note: 'Sahm-Regel: +0,5pp = Rezessionssignal',
    },
    {
      label: 'Erstanträge über 350K',
      active: (fc.joblessClaims.current ?? 0) > 350,
      value: `${fc.joblessClaims.current}K / Woche`,
      note: 'Frühindikator für Arbeitsmarktabkühlung',
    },
  ];

  const activeCount = signals.filter(s => s.active).length;

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-white uppercase tracking-wider">Rezessionssignale</p>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          activeCount >= 3 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
          activeCount >= 2 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
          'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        }`}>
          {activeCount >= 3 ? <AlertCircle size={10} /> : activeCount >= 2 ? <Zap size={10} /> : <Activity size={10} />}
          {activeCount} / {signals.length} aktiv
        </div>
      </div>

      <div className="space-y-2">
        {signals.map(sig => (
          <div key={sig.label} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
            sig.active
              ? 'bg-rose-950/30 border-rose-500/20'
              : 'bg-slate-800/30 border-slate-700/30'
          }`}>
            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${sig.active ? 'bg-rose-400 shadow-[0_0_6px_#f87171]' : 'bg-emerald-500'}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-white">{sig.label}</span>
                <span className={`text-[10px] font-bold ${sig.active ? 'text-rose-400' : 'text-emerald-400'}`}>{sig.value}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">{sig.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const MarketAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');

  const marketDataRaw = useFetch<any>('/market-data', null);
  const marketData: MarketData = {
    stocks: { macro: [], fearAndGreed: { current: 50, yesterday: 50, lastWeek: 50, lastMonth: 50, status: 'Neutral', indicators: [] } },
    crypto: { macro: [], fearAndGreed: { current: 50, yesterday: 50, lastWeek: 50, lastMonth: 50, status: 'Neutral', indicators: [] } },
    ...(marketDataRaw || {})
  };

  const isStocks  = activeTab === 'stocks';
  const fearAndGreed = isStocks ? marketData.stocks.fearAndGreed : marketData.crypto.fearAndGreed;
  const fc = marketData.fredCharts;

  const liveTag = (
    <div className="ml-auto flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      <span className="text-[10px] text-cyan-400 font-bold">LIVE</span>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart2 className="text-indigo-400" size={28} />
            Marktanalyse
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Makroökonomische Echtzeit-Daten · Quelle: Federal Reserve (FRED)
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-white/5 shadow-inner">
            <button className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${isStocks ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('stocks')}>Aktien</button>
            <button className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isStocks ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('crypto')}>Krypto</button>
          </div>
        </motion.div>
      </div>

      {fc ? (
        <>
          {/* ══════════════════════════════════════════════════════════
              SEKTION 1 · MARKTSTIMMUNG & REZESSIONSRISIKO
          ══════════════════════════════════════════════════════════ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <SectionHeader icon={TrendingUp} title="Marktstimmung & Rezessionsrisiko" subtitle="Fear & Greed · Signalübersicht" color="rose" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <FearGreedPanel data={fearAndGreed} label={isStocks ? 'US Stock Market' : 'Crypto Market'} />
              <RecessionPanel fc={fc} />
            </div>
          </motion.section>

          {/* ══════════════════════════════════════════════════════════
              SEKTION 2 · GELDPOLITIK & ZINSEN
          ══════════════════════════════════════════════════════════ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="flex items-center gap-3 mb-5">
              <SectionHeader icon={Percent} title="Geldpolitik & Zinsen" subtitle="Leitzins · Zinsstrukturkurve · Fed-Bilanz" color="indigo" />
              {liveTag}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <KpiCard label="Fed-Leitzins" value={fc.fedFunds.current} unit="%"
                current={fc.fedFunds.current} prev={fc.fedFunds.prev}
                status={fc.fedFunds.current < fc.fedFunds.prev ? 'good' : fc.fedFunds.current > 5 ? 'bad' : 'neutral'}
                icon={Percent} description="FEDFUNDS" />
              <KpiCard label="Zinsstruktur (10J−2J)" value={fc.yieldCurve.current?.toFixed(2) ?? '—'} unit="%"
                current={fc.yieldCurve.current ?? 0} prev={fc.yieldCurve.prev ?? 0}
                status={(fc.yieldCurve.current ?? 0) < -0.5 ? 'bad' : (fc.yieldCurve.current ?? 0) < 0 ? 'warning' : 'good'}
                icon={Activity} description={fc.yieldCurve.current < 0 ? '⚠ Invertiert' : 'Normal'} />
              <KpiCard label="Fed-Bilanzsumme" value={fc.fedBalanceSheet.current?.toFixed(1) ?? '—'} unit="T"
                current={fc.fedBalanceSheet.current ?? 0} prev={fc.fedBalanceSheet.prev ?? 0}
                status={fc.fedBalanceSheet.current < fc.fedBalanceSheet.prev ? 'good' : 'warning'}
                icon={Database} description="QT = schrumpft" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <ChartPanel title="Fed-Leitzins" subtitle="Effektiver Zinssatz (FEDFUNDS)"
                data={fc.fedFunds.history} color="#818cf8" type="area" unit="%"
                referenceValue={2} referenceLabel="Neutral ~2%" domain={[0, 'auto']} />
              <ChartPanel title="Zinsstrukturkurve" subtitle="10J − 2J Spread (T10Y2Y)"
                data={fc.yieldCurve.history} color={fc.yieldCurve.current < 0 ? '#f43f5e' : '#34d399'} type="line" unit="%"
                referenceValue={0} referenceLabel="Invertierung" />
              <ChartPanel title="Fed-Bilanzsumme" subtitle="Gesamtvermögen (WALCL)"
                data={fc.fedBalanceSheet.history} color="#c084fc" type="area" unit="T"
                domain={['auto', 'auto']} />
            </div>

            {/* Full yield curve */}
            <YieldCurvePanel snapshot={fc.yieldCurveSnapshot} />
          </motion.section>

          {/* ══════════════════════════════════════════════════════════
              SEKTION 2 · INFLATION & ROHSTOFFE
          ══════════════════════════════════════════════════════════ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <SectionHeader icon={TrendDown} title="Inflation & Rohstoffe" subtitle="Verbraucherpreise · Markterwartungen · Energiepreise" color="amber" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <KpiCard label="Inflation (VPI JaJ)" value={fc.cpi.current?.toFixed(1) ?? '—'} unit="%"
                current={fc.cpi.current ?? 0} prev={fc.cpi.prev ?? 0}
                status={(fc.cpi.current ?? 99) < 2.5 ? 'good' : (fc.cpi.current ?? 99) < 3.5 ? 'warning' : 'bad'}
                icon={TrendDown} description="Ziel: 2%" />
              <KpiCard label="Breakeven-Inflation" value={fc.breakevenInflation.current?.toFixed(2) ?? '—'} unit="%"
                current={fc.breakevenInflation.current ?? 0} prev={fc.breakevenInflation.prev ?? 0}
                status={(fc.breakevenInflation.current ?? 99) < 2.5 ? 'good' : (fc.breakevenInflation.current ?? 99) < 3 ? 'warning' : 'bad'}
                icon={DollarSign} description="Markterwartung 10J" />
              <KpiCard label="Rohöl WTI" value={fc.wtiOil.current?.toFixed(1) ?? '—'} unit="$"
                current={fc.wtiOil.current ?? 0} prev={fc.wtiOil.prev ?? 0}
                status={(fc.wtiOil.current ?? 0) < 70 ? 'good' : (fc.wtiOil.current ?? 0) < 90 ? 'neutral' : 'bad'}
                icon={Droplets} description="DCOILWTICO" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ChartPanel title="Inflation (VPI JaJ)" subtitle="Alle Verbraucher (CPIAUCSL)"
                data={fc.cpi.history} color="#f59e0b" type="area" unit="%"
                referenceValue={2} referenceLabel="Fed-Ziel" domain={[0, 'auto']} />
              <ChartPanel title="Breakeven-Inflation" subtitle="Markterwartung 10J (T10YIE)"
                data={fc.breakevenInflation.history} color="#4ade80" type="line" unit="%"
                referenceValue={2} referenceLabel="Fed-Ziel" domain={[1.5, 3.5]} />
              <ChartPanel title="Rohöl WTI" subtitle="Preis je Barrel (DCOILWTICO)"
                data={fc.wtiOil.history} color="#fbbf24" type="line" unit="$"
                referenceValue={80} referenceLabel="$80" />
            </div>
          </motion.section>

          {/* ══════════════════════════════════════════════════════════
              SEKTION 3 · KONJUNKTUR & ARBEITSMARKT
          ══════════════════════════════════════════════════════════ */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <SectionHeader icon={Layers} title="Konjunktur & Arbeitsmarkt" subtitle="BIP · Beschäftigung · Verbraucherstimmung" color="emerald" />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              <KpiCard label="BIP-Wachstum (real)" value={fc.gdpGrowth.current} unit="%"
                current={fc.gdpGrowth.current} prev={fc.gdpGrowth.prev}
                status={fc.gdpGrowth.current > 2 ? 'good' : fc.gdpGrowth.current > 0 ? 'warning' : 'bad'}
                icon={BarChart2} description="Quartal" />
              <KpiCard label="Stellenzuwachs" value={`+${fc.payrolls.current?.toLocaleString() ?? '—'}`} unit="K"
                current={fc.payrolls.current ?? 0} prev={fc.payrolls.prev ?? 0}
                status={(fc.payrolls.current ?? 0) > 100 ? 'good' : (fc.payrolls.current ?? 0) > 0 ? 'warning' : 'bad'}
                icon={Layers} description="Monatliche Änderung" />
              <KpiCard label="Arbeitslosenquote" value={fc.unemployment.current} unit="%"
                current={fc.unemployment.current} prev={fc.unemployment.prev}
                status={fc.unemployment.current < 4.5 ? 'good' : fc.unemployment.current < 6 ? 'warning' : 'bad'}
                icon={Users} description="UNRATE" />
              <KpiCard label="Erstanträge Arbeitslos" value={fc.joblessClaims.current?.toLocaleString() ?? '—'} unit="K"
                current={fc.joblessClaims.current ?? 0} prev={fc.joblessClaims.prev ?? 0}
                status={(fc.joblessClaims.current ?? 999) < 250 ? 'good' : (fc.joblessClaims.current ?? 999) < 350 ? 'warning' : 'bad'}
                icon={Users} description="Wöchentlich" />
              <KpiCard label="Verbraucherstimmung" value={fc.consumerSentiment.current} unit=""
                current={fc.consumerSentiment.current} prev={fc.consumerSentiment.prev}
                status={fc.consumerSentiment.current > 80 ? 'good' : fc.consumerSentiment.current > 60 ? 'warning' : 'bad'}
                icon={Brain} description="UMich-Index" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              <ChartPanel title="BIP-Wachstum (real)" subtitle="Vierteljährliche Änderung %"
                data={fc.gdpGrowth.history} color="#a78bfa" type="bar" unit="%"
                referenceValue={0} domain={['auto', 'auto']} />
              <ChartPanel title="Stellenzuwachs" subtitle="Non-Farm Payrolls (PAYEMS)"
                data={fc.payrolls.history} color="#22d3ee" type="bar" unit="K"
                referenceValue={0} domain={['auto', 'auto']} />
              <ChartPanel title="Verbraucherstimmung" subtitle="Univ. of Michigan (UMCSENT)"
                data={fc.consumerSentiment.history} color="#fb923c" type="area" unit=""
                referenceValue={70} referenceLabel="Ø ~70" domain={[40, 'auto']} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartPanel title="Arbeitslosenquote" subtitle="US (UNRATE)"
                data={fc.unemployment.history} color="#94a3b8" type="area" unit="%"
                referenceValue={4} referenceLabel="Hist. Ø" domain={[3, 'auto']} height={130} />
              <ChartPanel title="Erstanträge Arbeitslosenhilfe" subtitle="Wöchentlich (ICSA)"
                data={fc.joblessClaims.history} color="#fb923c" type="bar" unit="K"
                referenceValue={250} referenceLabel="Alarm: 350K" domain={[150, 'auto']} height={130} />
            </div>
          </motion.section>

        </>
      ) : (
        <div className="h-32 flex items-center justify-center border border-dashed border-slate-700/50 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-bold">FRED-Daten werden geladen…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketAnalysis;

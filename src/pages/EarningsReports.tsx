import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ChevronUp, ChevronDown, Clock,
  Search, Filter, BarChart2, Percent, Layers, DollarSign, Calendar, X, RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EarningsRow {
  ticker: string;
  company: string;
  date: string;
  expectedEPS: number;
  actualEPS: number;
  beat: boolean;
  surprise: number;
  expectedRev: number;
  actualRev: number;
  revBeat: boolean;
  sector: string;
}

interface QuarterPoint { q: string; estimate: number; actual: number; }

interface EarningsDetail {
  pe: string; marketCap: string; grossMargin: string;
  revenueGrowth: string; epsGrowth: string; fcf: string;
  epsHistory: QuarterPoint[];
  revenueHistory: QuarterPoint[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const earningsData: EarningsRow[] = [
  { ticker: 'AAPL', company: 'Apple Inc.',           date: '2024-02-01', expectedEPS: 2.10, actualEPS: 2.18, beat: true,  surprise:  3.81, expectedRev: 117.9, actualRev: 119.4, revBeat: true,  sector: 'Technology' },
  { ticker: 'NVDA', company: 'NVIDIA Corp.',          date: '2024-02-21', expectedEPS: 4.59, actualEPS: 5.16, beat: true,  surprise: 12.42, expectedRev:  20.4, actualRev:  22.1, revBeat: true,  sector: 'Technology' },
  { ticker: 'MSFT', company: 'Microsoft Corp.',       date: '2024-01-30', expectedEPS: 2.78, actualEPS: 2.93, beat: true,  surprise:  5.40, expectedRev:  60.8, actualRev:  62.0, revBeat: true,  sector: 'Technology' },
  { ticker: 'TSLA', company: 'Tesla Inc.',            date: '2024-01-24', expectedEPS: 0.85, actualEPS: 0.71, beat: false, surprise:-16.47, expectedRev:  25.9, actualRev:  25.2, revBeat: false, sector: 'Automotive' },
  { ticker: 'AMZN', company: 'Amazon.com Inc.',       date: '2024-02-01', expectedEPS: 0.80, actualEPS: 1.00, beat: true,  surprise: 25.00, expectedRev: 166.2, actualRev: 169.9, revBeat: true,  sector: 'E-Commerce' },
  { ticker: 'META', company: 'Meta Platforms',        date: '2024-02-01', expectedEPS: 4.96, actualEPS: 5.33, beat: true,  surprise:  7.46, expectedRev:  39.2, actualRev:  40.1, revBeat: true,  sector: 'Technology' },
  { ticker: 'GOOGL', company: 'Alphabet Inc.',        date: '2024-01-30', expectedEPS: 1.59, actualEPS: 1.64, beat: true,  surprise:  3.14, expectedRev:  85.3, actualRev:  86.3, revBeat: true,  sector: 'Technology' },
  { ticker: 'NFLX', company: 'Netflix Inc.',          date: '2024-01-23', expectedEPS: 2.22, actualEPS: 2.11, beat: false, surprise: -4.95, expectedRev:   8.7, actualRev:   8.8, revBeat: true,  sector: 'Media' },
  { ticker: 'AMD',  company: 'Advanced Micro Devices',date: '2024-01-30', expectedEPS: 0.77, actualEPS: 0.77, beat: false, surprise:  0.00, expectedRev:   6.1, actualRev:   6.2, revBeat: true,  sector: 'Technology' },
  { ticker: 'JPM',  company: 'JPMorgan Chase',        date: '2024-01-12', expectedEPS: 3.74, actualEPS: 3.97, beat: true,  surprise:  6.15, expectedRev:  39.8, actualRev:  41.3, revBeat: true,  sector: 'Finance' },
  { ticker: 'BAC',  company: 'Bank of America',       date: '2024-01-12', expectedEPS: 0.67, actualEPS: 0.70, beat: true,  surprise:  4.48, expectedRev:  23.8, actualRev:  23.5, revBeat: false, sector: 'Finance' },
  { ticker: 'DIS',  company: 'Walt Disney Co.',       date: '2024-02-07', expectedEPS: 0.99, actualEPS: 1.22, beat: true,  surprise: 23.23, expectedRev:  22.1, actualRev:  23.5, revBeat: true,  sector: 'Media' },
];

const detailsMap: Record<string, EarningsDetail> = {
  AAPL: {
    pe: '28.5x', marketCap: '$2.9T', grossMargin: '45.5%', revenueGrowth: '+2.1%', epsGrowth: '+16.4%', fcf: '$29.8B',
    epsHistory:     [{ q:"Q1'23",estimate:1.98,actual:2.04},{ q:"Q2'23",estimate:1.19,actual:1.26},{ q:"Q3'23",estimate:1.89,actual:1.97},{ q:"Q4'23",estimate:2.10,actual:2.18}],
    revenueHistory: [{ q:"Q1'23",estimate:122.0,actual:117.2},{ q:"Q2'23",estimate:92.0,actual:94.8},{ q:"Q3'23",estimate:89.1,actual:89.5},{ q:"Q4'23",estimate:117.9,actual:119.4}],
  },
  NVDA: {
    pe: '65.3x', marketCap: '$2.2T', grossMargin: '76.1%', revenueGrowth: '+265%', epsGrowth: '+486%', fcf: '$11.6B',
    epsHistory:     [{ q:"Q1'23",estimate:0.92,actual:1.09},{ q:"Q2'23",estimate:2.00,actual:2.70},{ q:"Q3'23",estimate:3.37,actual:4.02},{ q:"Q4'23",estimate:4.59,actual:5.16}],
    revenueHistory: [{ q:"Q1'23",estimate:6.5,actual:7.2},{ q:"Q2'23",estimate:11.0,actual:13.5},{ q:"Q3'23",estimate:16.0,actual:18.1},{ q:"Q4'23",estimate:20.4,actual:22.1}],
  },
  MSFT: {
    pe: '35.2x', marketCap: '$3.1T', grossMargin: '70.1%', revenueGrowth: '+17.6%', epsGrowth: '+21.4%', fcf: '$21.0B',
    epsHistory:     [{ q:"Q1'23",estimate:2.23,actual:2.35},{ q:"Q2'23",estimate:2.46,actual:2.69},{ q:"Q3'23",estimate:2.65,actual:2.99},{ q:"Q4'23",estimate:2.78,actual:2.93}],
    revenueHistory: [{ q:"Q1'23",estimate:52.4,actual:52.9},{ q:"Q2'23",estimate:55.4,actual:56.2},{ q:"Q3'23",estimate:54.5,actual:56.5},{ q:"Q4'23",estimate:60.8,actual:62.0}],
  },
  TSLA: {
    pe: '65.4x', marketCap: '$580B', grossMargin: '17.6%', revenueGrowth: '-9.1%', epsGrowth: '-71.1%', fcf: '$2.1B',
    epsHistory:     [{ q:"Q1'23",estimate:0.86,actual:0.85},{ q:"Q2'23",estimate:0.78,actual:0.91},{ q:"Q3'23",estimate:0.73,actual:0.66},{ q:"Q4'23",estimate:0.85,actual:0.71}],
    revenueHistory: [{ q:"Q1'23",estimate:23.6,actual:23.3},{ q:"Q2'23",estimate:24.9,actual:24.9},{ q:"Q3'23",estimate:24.4,actual:23.4},{ q:"Q4'23",estimate:25.9,actual:25.2}],
  },
  AMZN: {
    pe: '60.1x', marketCap: '$1.8T', grossMargin: '47.0%', revenueGrowth: '+12.5%', epsGrowth: '+200%', fcf: '$36.8B',
    epsHistory:     [{ q:"Q1'23",estimate:0.21,actual:0.31},{ q:"Q2'23",estimate:0.35,actual:0.65},{ q:"Q3'23",estimate:0.58,actual:0.94},{ q:"Q4'23",estimate:0.80,actual:1.00}],
    revenueHistory: [{ q:"Q1'23",estimate:124.5,actual:127.4},{ q:"Q2'23",estimate:131.7,actual:134.4},{ q:"Q3'23",estimate:141.4,actual:143.1},{ q:"Q4'23",estimate:166.2,actual:169.9}],
  },
  META: {
    pe: '28.1x', marketCap: '$1.2T', grossMargin: '81.0%', revenueGrowth: '+24.7%', epsGrowth: '+203%', fcf: '$19.8B',
    epsHistory:     [{ q:"Q1'23",estimate:2.06,actual:2.20},{ q:"Q2'23",estimate:2.91,actual:2.98},{ q:"Q3'23",estimate:3.63,actual:4.39},{ q:"Q4'23",estimate:4.96,actual:5.33}],
    revenueHistory: [{ q:"Q1'23",estimate:27.7,actual:28.6},{ q:"Q2'23",estimate:31.1,actual:32.0},{ q:"Q3'23",estimate:33.6,actual:34.1},{ q:"Q4'23",estimate:39.2,actual:40.1}],
  },
  GOOGL: {
    pe: '26.2x', marketCap: '$1.9T', grossMargin: '55.5%', revenueGrowth: '+12.9%', epsGrowth: '+52.3%', fcf: '$23.6B',
    epsHistory:     [{ q:"Q1'23",estimate:1.07,actual:1.17},{ q:"Q2'23",estimate:1.34,actual:1.44},{ q:"Q3'23",estimate:1.45,actual:1.55},{ q:"Q4'23",estimate:1.59,actual:1.64}],
    revenueHistory: [{ q:"Q1'23",estimate:68.9,actual:69.8},{ q:"Q2'23",estimate:72.8,actual:74.6},{ q:"Q3'23",estimate:76.7,actual:76.7},{ q:"Q4'23",estimate:85.3,actual:86.3}],
  },
  NFLX: {
    pe: '45.8x', marketCap: '$260B', grossMargin: '44.6%', revenueGrowth: '+12.5%', epsGrowth: '+44.6%', fcf: '$6.9B',
    epsHistory:     [{ q:"Q1'23",estimate:2.86,actual:2.88},{ q:"Q2'23",estimate:2.86,actual:3.29},{ q:"Q3'23",estimate:3.49,actual:3.73},{ q:"Q4'23",estimate:2.22,actual:2.11}],
    revenueHistory: [{ q:"Q1'23",estimate:8.2,actual:8.2},{ q:"Q2'23",estimate:8.3,actual:8.2},{ q:"Q3'23",estimate:8.5,actual:8.5},{ q:"Q4'23",estimate:8.7,actual:8.8}],
  },
  AMD: {
    pe: '200x', marketCap: '$170B', grossMargin: '53.0%', revenueGrowth: '+10.2%', epsGrowth: '-10.4%', fcf: '$1.5B',
    epsHistory:     [{ q:"Q1'23",estimate:0.56,actual:0.60},{ q:"Q2'23",estimate:0.57,actual:0.58},{ q:"Q3'23",estimate:0.68,actual:0.70},{ q:"Q4'23",estimate:0.77,actual:0.77}],
    revenueHistory: [{ q:"Q1'23",estimate:5.3,actual:5.4},{ q:"Q2'23",estimate:5.4,actual:5.4},{ q:"Q3'23",estimate:5.7,actual:5.8},{ q:"Q4'23",estimate:6.1,actual:6.2}],
  },
  JPM: {
    pe: '12.1x', marketCap: '$560B', grossMargin: 'N/A', revenueGrowth: '+8.9%', epsGrowth: '+9.2%', fcf: 'N/A',
    epsHistory:     [{ q:"Q1'23",estimate:3.40,actual:4.10},{ q:"Q2'23",estimate:3.97,actual:4.75},{ q:"Q3'23",estimate:3.97,actual:4.33},{ q:"Q4'23",estimate:3.74,actual:3.97}],
    revenueHistory: [{ q:"Q1'23",estimate:35.5,actual:38.3},{ q:"Q2'23",estimate:39.1,actual:42.4},{ q:"Q3'23",estimate:39.6,actual:39.9},{ q:"Q4'23",estimate:39.8,actual:41.3}],
  },
  BAC: {
    pe: '13.2x', marketCap: '$310B', grossMargin: 'N/A', revenueGrowth: '-2.5%', epsGrowth: '+3.0%', fcf: 'N/A',
    epsHistory:     [{ q:"Q1'23",estimate:0.83,actual:0.94},{ q:"Q2'23",estimate:0.84,actual:0.88},{ q:"Q3'23",estimate:0.82,actual:0.90},{ q:"Q4'23",estimate:0.67,actual:0.70}],
    revenueHistory: [{ q:"Q1'23",estimate:25.1,actual:26.3},{ q:"Q2'23",estimate:25.4,actual:25.2},{ q:"Q3'23",estimate:25.2,actual:25.2},{ q:"Q4'23",estimate:23.8,actual:23.5}],
  },
  DIS: {
    pe: '22.4x', marketCap: '$175B', grossMargin: '35.2%', revenueGrowth: '+6.2%', epsGrowth: '+104%', fcf: '$4.8B',
    epsHistory:     [{ q:"Q1'23",estimate:0.87,actual:0.99},{ q:"Q2'23",estimate:0.97,actual:1.03},{ q:"Q3'23",estimate:0.95,actual:1.00},{ q:"Q4'23",estimate:0.99,actual:1.22}],
    revenueHistory: [{ q:"Q1'23",estimate:21.3,actual:21.8},{ q:"Q2'23",estimate:22.0,actual:22.3},{ q:"Q3'23",estimate:22.3,actual:22.3},{ q:"Q4'23",estimate:22.1,actual:23.5}],
  },
};

const upcomingCalendar = [
  { date: 'Apr 24, 2026', ticker: 'TSLA', time: 'After Close', estEPS: '$0.64' },
  { date: 'Apr 25, 2026', ticker: 'MSFT', time: 'After Close', estEPS: '$2.82' },
  { date: 'Apr 30, 2026', ticker: 'AAPL', time: 'After Close', estEPS: '$1.50' },
  { date: 'May 12, 2026', ticker: 'BTC', time: 'Est. 14:00', estEPS: 'Halving Event' },
];

// ── Summary Bar ───────────────────────────────────────────────────────────────

function SummaryBar() {
  const { t } = useLanguage();
  const beats = earningsData.filter(r => r.beat).length;
  const misses = earningsData.filter(r => !r.beat).length;
  const avgSurprise = (earningsData.reduce((s, r) => s + r.surprise, 0) / earningsData.length).toFixed(1);
  const beatRate = ((beats / earningsData.length) * 100).toFixed(0);

  const items = [
    { label: t('earn_total'),        value: earningsData.length.toString(), color: 'text-white' },
    { label: t('earn_beat'),         value: beats.toString(),               color: 'text-green-400' },
    { label: t('earn_missed'),       value: misses.toString(),              color: 'text-red-400' },
    { label: t('earn_beat_rate'),    value: `${beatRate}%`,                 color: 'text-indigo-400' },
    { label: t('earn_avg_surprise'), value: `+${avgSurprise}%`,            color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="glass-panel rounded-xl p-4 border border-white/5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <p className="text-xs text-slate-400 mb-1">{item.label}</p>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Chart Legend ──────────────────────────────────────────────────────────────

const ChartLegend = () => (
  <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" /> Estimate</span>
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Beat</span>
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Miss</span>
  </div>
);

// ── Detail Panel ──────────────────────────────────────────────────────────────

function EarningsDetailPanel({ ticker }: { ticker: string }) {
  const row = earningsData.find(r => r.ticker === ticker);
  const detail = detailsMap[ticker];
  if (!row || !detail) return null;

  const metrics = [
    { label: 'P/E Ratio',       value: detail.pe,            icon: BarChart2,   color: 'text-indigo-400' },
    { label: 'Market Cap',      value: detail.marketCap,     icon: DollarSign,  color: 'text-cyan-400' },
    { label: 'Gross Margin',    value: detail.grossMargin,   icon: Percent,     color: 'text-purple-400' },
    { label: 'Rev. Growth YoY', value: detail.revenueGrowth, icon: Layers,      color: detail.revenueGrowth.startsWith('+') ? 'text-green-400' : 'text-red-400' },
    { label: 'EPS Growth YoY',  value: detail.epsGrowth,     icon: TrendingUp,  color: detail.epsGrowth.startsWith('+') ? 'text-green-400' : 'text-red-400' },
    { label: 'Free Cash Flow',  value: detail.fcf,           icon: DollarSign,  color: 'text-emerald-400' },
  ];

  const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 };

  return (
    <motion.div
      key={ticker}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-panel rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className={`px-5 py-4 border-b border-white/5 flex items-center justify-between ${row.beat ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
        <div className="flex items-center gap-3">
          <img
            src={`https://financialmodelingprep.com/image-stock/${ticker}.png`}
            alt={ticker}
            className="w-10 h-10 rounded-full bg-white/10 object-cover"
            onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${ticker}&background=312e81&color=fff&rounded=true&bold=true`; }}
          />
          <div>
            <p className="font-bold text-white text-base leading-tight">{ticker}</p>
            <p className="text-xs text-slate-400">{row.company}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
          row.beat ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'
        }`}>
          {row.beat ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {row.beat ? 'BEAT' : 'MISS'} {row.surprise > 0 ? '+' : ''}{row.surprise.toFixed(1)}%
        </span>
      </div>

      {/* Key Metrics */}
      <div className="p-4 grid grid-cols-3 gap-2.5 border-b border-white/5">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={10} className={m.color} />
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">{m.label}</p>
              </div>
              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* EPS History */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 size={12} className="text-indigo-400" /> EPS per Quarter
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={detail.epsHistory} barGap={2} barCategoryGap="35%">
            <XAxis dataKey="q" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={38}
              tickFormatter={v => `$${v.toFixed(2)}`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
              formatter={(v: number, name: string) => [`$${(v as number).toFixed(2)}`, name === 'estimate' ? 'Estimate' : 'Actual']} />
            <Bar dataKey="estimate" fill="#1e293b" stroke="#334155" strokeWidth={1} radius={[3,3,0,0]} name="estimate" />
            <Bar dataKey="actual" radius={[3,3,0,0]} name="actual">
              {detail.epsHistory.map((e, i) => (
                <Cell key={i} fill={e.actual >= e.estimate ? '#4ade80' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend />
      </div>

      {/* Revenue History */}
      <div className="px-4 pt-3 pb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers size={12} className="text-purple-400" /> Revenue per Quarter ($B)
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={detail.revenueHistory} barGap={2} barCategoryGap="35%">
            <XAxis dataKey="q" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={38}
              tickFormatter={v => `$${v}B`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }}
              formatter={(v: number, name: string) => [`$${(v as number).toFixed(1)}B`, name === 'estimate' ? 'Estimate' : 'Actual']} />
            <Bar dataKey="estimate" fill="#1e293b" stroke="#334155" strokeWidth={1} radius={[3,3,0,0]} name="estimate" />
            <Bar dataKey="actual" radius={[3,3,0,0]} name="actual">
              {detail.revenueHistory.map((e, i) => (
                <Cell key={i} fill={e.actual >= e.estimate ? '#4ade80' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend />
      </div>
    </motion.div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

type SortKey = 'ticker' | 'date' | 'surprise' | 'actualEPS' | 'actualRev';

function EarningsTable({ selected, onSelect }: { selected: string | null; onSelect: (t: string) => void }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'beat' | 'miss'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = earningsData
    .filter(r => {
      const matchSearch = r.ticker.toLowerCase().includes(search.toLowerCase()) ||
        r.company.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || (filter === 'beat' ? r.beat : !r.beat);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let av: number | string = a[sortKey];
      let bv: number | string = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="text-slate-600" />;

  const th = 'px-3 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors';

  return (
    <motion.div
      className="glass-panel rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-3 border-b border-white/5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            placeholder={t('earn_search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-500" />
          {(['all', 'beat', 'miss'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? f === 'beat' ? 'bg-green-600 text-white' : f === 'miss' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}>
              {t(`earn_filter_${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr>
              <th className={th} onClick={() => handleSort('ticker')}>
                <span className="flex items-center gap-1">{t('earn_col_ticker')} <SortIcon k="ticker" /></span>
              </th>
              <th className={th} onClick={() => handleSort('date')}>
                <span className="flex items-center gap-1">{t('earn_col_date')} <SortIcon k="date" /></span>
              </th>
              <th className={`${th} text-right`} onClick={() => handleSort('actualEPS')}>
                <span className="flex items-center justify-end gap-1">EPS <SortIcon k="actualEPS" /></span>
              </th>
              <th className={`${th} text-right`} onClick={() => handleSort('surprise')}>
                <span className="flex items-center justify-end gap-1">{t('earn_col_surprise')} <SortIcon k="surprise" /></span>
              </th>
              <th className={`${th} text-center`}>{t('earn_col_result')}</th>
              <th className={`${th} text-right hidden sm:table-cell`} onClick={() => handleSort('actualRev')}>
                <span className="flex items-center justify-end gap-1">{t('earn_col_revenue')} <SortIcon k="actualRev" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((row, i) => {
                const isSelected = selected === row.ticker;
                return (
                  <motion.tr
                    key={row.ticker}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => onSelect(row.ticker)}
                    className={`border-t border-white/5 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`https://financialmodelingprep.com/image-stock/${row.ticker}.png`}
                          alt={row.ticker}
                          className="w-7 h-7 rounded-full bg-white/10 object-cover flex-shrink-0"
                          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${row.ticker}&background=312e81&color=fff&rounded=true&bold=true`; }}
                        />
                        <div>
                          <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{row.ticker}</p>
                          <p className="text-[10px] text-slate-500">{row.sector}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{row.date}</td>
                    <td className="px-3 py-3 text-right">
                      <p className="font-mono text-white font-semibold text-sm">${row.actualEPS.toFixed(2)}</p>
                      <p className="font-mono text-slate-600 text-[10px]">est. ${row.expectedEPS.toFixed(2)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-bold text-sm ${row.surprise > 0 ? 'text-green-400' : row.surprise < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {row.surprise > 0 ? '+' : ''}{row.surprise.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.beat ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
                        }`}>
                          {row.beat ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {row.beat ? 'BEAT' : 'MISS'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <span className={`text-xs font-semibold ${row.revBeat ? 'text-green-400' : 'text-red-400'}`}>
                        ${row.actualRev.toFixed(1)}B
                      </span>
                      <span className="text-slate-600 text-[10px]"> / ${row.expectedRev.toFixed(1)}B</span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">{t('earn_no_results')}</div>
        )}
      </div>
    </motion.div>
  );
}

// ── Upcoming Events Timeline ──────────────────────────────────────────────────

function EarningsTimeline({ data, title }: { data: any[]; title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
      {/* Background glow for the section */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -mt-48 -mr-48" />

      <h3 className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black mb-6 flex items-center gap-3 relative z-10">
        <div className="w-6 h-px bg-purple-500/50" />
        <Calendar size={14} className="text-purple-400" /> {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {data.map((e, i) => {
          // split "Apr 24, 2026"
          const parts = e.date.split(' ');
          const month = parts[0]?.toUpperCase() || '';
          const day = parts[1]?.replace(',', '') || '';

          return (
            <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 + i * 0.05 }}
               className="flex bg-slate-900/60 rounded-2xl border border-white/5 overflow-hidden group hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300"
            >
               {/* Date Tear-off Block */}
               <div className="bg-gradient-to-b from-purple-900/30 to-purple-900/10 border-r border-white/5 p-4 flex flex-col items-center justify-center min-w-[75px] relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-none mb-1">{month}</span>
                  <span className="text-3xl font-black text-white leading-tight tracking-tighter">{day}</span>
               </div>
               
               {/* Details Block */}
               <div className="p-4 flex-1 flex flex-col justify-center relative">
                 <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[20px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                 
                 <div className="flex items-center gap-3 mb-2.5">
                    <img src={`https://financialmodelingprep.com/image-stock/${e.ticker}.png`} alt={e.ticker} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 shadow-md flex-shrink-0" onError={(evt) => { evt.currentTarget.src = `https://ui-avatars.com/api/?name=${e.ticker}&background=a855f7&color=fff&rounded=true&bold=true`; }} />
                    <div className="flex flex-col overflow-hidden">
                       <p className="text-lg font-black text-white leading-none tracking-tight truncate">{e.ticker}</p>
                       <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold flex items-center gap-1.5 whitespace-nowrap">
                          <Clock size={10} className="text-slate-500 flex-shrink-0" /> <span className="truncate">{e.time}</span>
                       </p>
                    </div>
                 </div>

                 <div className="flex justify-between items-end border-t border-slate-700/50 pt-2.5 mt-auto">
                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">EST EPS</p>
                    <p className="text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{e.estEPS}</p>
                 </div>
               </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="glass-panel rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-8">
      <BarChart2 size={40} className="text-slate-700" />
      <p className="text-slate-400 font-medium text-sm">Select a company</p>
      <p className="text-slate-600 text-xs">Click any row to view EPS & Revenue charts and key metrics</p>
    </div>
  );
}

// ── Ticker Search ─────────────────────────────────────────────────────────────

interface SearchResult { ticker: string; name: string; exchange: string; }

const TickerSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.slice(0, 6));
        setOpen(data.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 transition-colors">
        <Search size={15} className="text-slate-500 flex-shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Unternehmen suchen — z.B. Apple, AMD…"
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
        {loading && <RefreshCw size={13} className="text-indigo-400 animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-slate-500 hover:text-slate-300">
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {results.map(r => (
            <div key={r.ticker} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{r.ticker}</div>
                <div className="text-xs text-slate-400 truncate">{r.name}</div>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{r.exchange}</span>
            </div>
          ))}
          <div className="px-3 py-2 border-t border-white/5 text-[11px] text-slate-600">
            Analyse-Funktion folgt in Kürze
          </div>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const EarningsReports: React.FC = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string | null>('NVDA');

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('earn_title')}</h1>
            <p className="text-slate-400 text-sm mt-1">{t('earn_subtitle')}</p>
          </div>
          <div className="sm:ml-auto">
            <TickerSearch />
          </div>
        </div>
      </motion.div>

      <SummaryBar />

      <div className="mt-8 mb-8">
        <EarningsTimeline data={upcomingCalendar} title="Upcoming Earnings Calendar" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 xl:gap-8 items-start">
        {/* Table — left */}
        <div className="xl:col-span-3">
          <EarningsTable selected={selected} onSelect={setSelected} />
        </div>

        {/* Detail panel — right */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          <AnimatePresence mode="wait">
            {selected
              ? <EarningsDetailPanel key={selected} ticker={selected} />
              : <EmptyState key="empty" />
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EarningsReports;

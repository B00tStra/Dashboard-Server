import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Search, BarChart2, Percent, Layers, DollarSign, Calendar
} from 'lucide-react';

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

const earningsData: EarningsRow[] = [
  { ticker: 'AAPL', company: 'Apple Inc.', date: '2024-02-01', expectedEPS: 2.10, actualEPS: 2.18, beat: true, surprise: 3.81, expectedRev: 117.9, actualRev: 119.4, revBeat: true, sector: 'Technology' },
  { ticker: 'NVDA', company: 'NVIDIA Corp.', date: '2024-02-21', expectedEPS: 4.59, actualEPS: 5.16, beat: true, surprise: 12.42, expectedRev: 20.4, actualRev: 22.1, revBeat: true, sector: 'Technology' },
  { ticker: 'MSFT', company: 'Microsoft Corp.', date: '2024-01-30', expectedEPS: 2.78, actualEPS: 2.93, beat: true, surprise: 5.40, expectedRev: 60.8, actualRev: 62.0, revBeat: true, sector: 'Technology' },
  { ticker: 'TSLA', company: 'Tesla Inc.', date: '2024-01-24', expectedEPS: 0.85, actualEPS: 0.71, beat: false, surprise: -16.47, expectedRev: 25.9, actualRev: 25.2, revBeat: false, sector: 'Automotive' },
  { ticker: 'AMZN', company: 'Amazon.com Inc.', date: '2024-02-01', expectedEPS: 0.80, actualEPS: 1.00, beat: true, surprise: 25.00, expectedRev: 166.2, actualRev: 169.9, revBeat: true, sector: 'E-Commerce' },
  { ticker: 'META', company: 'Meta Platforms', date: '2024-02-01', expectedEPS: 4.96, actualEPS: 5.33, beat: true, surprise: 7.46, expectedRev: 39.2, actualRev: 40.1, revBeat: true, sector: 'Technology' },
  { ticker: 'GOOGL', company: 'Alphabet Inc.', date: '2024-01-30', expectedEPS: 1.59, actualEPS: 1.64, beat: true, surprise: 3.14, expectedRev: 85.3, actualRev: 86.3, revBeat: true, sector: 'Technology' },
  { ticker: 'NFLX', company: 'Netflix Inc.', date: '2024-01-23', expectedEPS: 2.22, actualEPS: 2.11, beat: false, surprise: -4.95, expectedRev: 8.7, actualRev: 8.8, revBeat: true, sector: 'Media' },
  { ticker: 'AMD', company: 'Advanced Micro Devices', date: '2024-01-30', expectedEPS: 0.77, actualEPS: 0.77, beat: false, surprise: 0.00, expectedRev: 6.1, actualRev: 6.2, revBeat: true, sector: 'Technology' },
  { ticker: 'JPM', company: 'JPMorgan Chase', date: '2024-01-12', expectedEPS: 3.74, actualEPS: 3.97, beat: true, surprise: 6.15, expectedRev: 39.8, actualRev: 41.3, revBeat: true, sector: 'Finance' },
  { ticker: 'BAC', company: 'Bank of America', date: '2024-01-12', expectedEPS: 0.67, actualEPS: 0.70, beat: true, surprise: 4.48, expectedRev: 23.8, actualRev: 23.5, revBeat: false, sector: 'Finance' },
  { ticker: 'DIS', company: 'Walt Disney Co.', date: '2024-02-07', expectedEPS: 0.99, actualEPS: 1.22, beat: true, surprise: 23.23, expectedRev: 22.1, actualRev: 23.5, revBeat: true, sector: 'Media' },
];

const detailsMap: Record<string, EarningsDetail> = {
  AAPL: {
    pe: '28.5x', marketCap: '$2.9T', grossMargin: '45.5%', revenueGrowth: '+2.1%', epsGrowth: '+16.4%', fcf: '$29.8B',
    epsHistory: [{ q: "Q1'23", estimate: 1.98, actual: 2.04 }, { q: "Q2'23", estimate: 1.19, actual: 1.26 }, { q: "Q3'23", estimate: 1.89, actual: 1.97 }, { q: "Q4'23", estimate: 2.10, actual: 2.18 }],
    revenueHistory: [{ q: "Q1'23", estimate: 122.0, actual: 117.2 }, { q: "Q2'23", estimate: 92.0, actual: 94.8 }, { q: "Q3'23", estimate: 89.1, actual: 89.5 }, { q: "Q4'23", estimate: 117.9, actual: 119.4 }],
  },
  NVDA: {
    pe: '65.3x', marketCap: '$2.2T', grossMargin: '76.1%', revenueGrowth: '+265%', epsGrowth: '+486%', fcf: '$11.6B',
    epsHistory: [{ q: "Q1'23", estimate: 0.92, actual: 1.09 }, { q: "Q2'23", estimate: 2.00, actual: 2.70 }, { q: "Q3'23", estimate: 3.37, actual: 4.02 }, { q: "Q4'23", estimate: 4.59, actual: 5.16 }],
    revenueHistory: [{ q: "Q1'23", estimate: 6.5, actual: 7.2 }, { q: "Q2'23", estimate: 11.0, actual: 13.5 }, { q: "Q3'23", estimate: 16.0, actual: 18.1 }, { q: "Q4'23", estimate: 20.4, actual: 22.1 }],
  },
  MSFT: {
    pe: '35.2x', marketCap: '$3.1T', grossMargin: '70.1%', revenueGrowth: '+17.6%', epsGrowth: '+21.4%', fcf: '$21.0B',
    epsHistory: [{ q: "Q1'23", estimate: 2.23, actual: 2.35 }, { q: "Q2'23", estimate: 2.46, actual: 2.69 }, { q: "Q3'23", estimate: 2.65, actual: 2.99 }, { q: "Q4'23", estimate: 2.78, actual: 2.93 }],
    revenueHistory: [{ q: "Q1'23", estimate: 52.4, actual: 52.9 }, { q: "Q2'23", estimate: 55.4, actual: 56.2 }, { q: "Q3'23", estimate: 54.5, actual: 56.5 }, { q: "Q4'23", estimate: 60.8, actual: 62.0 }],
  },
  TSLA: {
    pe: '65.4x', marketCap: '$580B', grossMargin: '17.6%', revenueGrowth: '-9.1%', epsGrowth: '-71.1%', fcf: '$2.1B',
    epsHistory: [{ q: "Q1'23", estimate: 0.86, actual: 0.85 }, { q: "Q2'23", estimate: 0.78, actual: 0.91 }, { q: "Q3'23", estimate: 0.73, actual: 0.66 }, { q: "Q4'23", estimate: 0.85, actual: 0.71 }],
    revenueHistory: [{ q: "Q1'23", estimate: 23.6, actual: 23.3 }, { q: "Q2'23", estimate: 24.9, actual: 24.9 }, { q: "Q3'23", estimate: 24.4, actual: 23.4 }, { q: "Q4'23", estimate: 25.9, actual: 25.2 }],
  },
};

const upcomingCalendar = [
  { date: 'Apr 24, 2026', ticker: 'TSLA', time: 'After Close', estEPS: '$0.64' },
  { date: 'Apr 25, 2026', ticker: 'MSFT', time: 'After Close', estEPS: '$2.82' },
  { date: 'Apr 30, 2026', ticker: 'AAPL', time: 'After Close', estEPS: '$1.50' },
  { date: 'May 12, 2026', ticker: 'BTC', time: 'Est. 14:00', estEPS: 'Halving Event' },
];

function SummaryBar() {
  const beats = earningsData.filter(r => r.beat).length;
  const misses = earningsData.filter(r => !r.beat).length;
  const avgSurprise = parseFloat((earningsData.reduce((s, r) => s + r.surprise, 0) / earningsData.length).toFixed(1));
  const beatRate = ((beats / earningsData.length) * 100).toFixed(0);

  const items = [
    { label: 'ANZAHL', value: earningsData.length.toString(), color: 'var(--text-primary)' },
    { label: 'POSITIV', value: beats.toString(), color: 'var(--accent-green)' },
    { label: 'NEGATIV', value: misses.toString(), color: 'var(--accent-red)' },
    { label: 'TREFFERQUOTE', value: `${beatRate}%`, color: 'var(--accent-blue)' },
    { label: 'Ø ÜBERRASCHUNG', value: `+${avgSurprise}%`, color: 'var(--accent-purple)' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-10">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="analytics-card p-10 analytics-card-hover group"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <p className="section-title mb-4 tracking-[0.3em] group-hover:text-[var(--text-primary)] transition-colors">{item.label}</p>
          <p className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: item.color }}>{item.value}</p>
          <div className="mt-4 w-full h-px bg-white/5 group-hover:bg-[var(--accent-blue)]/20 transition-all" />
        </motion.div>
      ))}
    </div>
  );
}

function EarningsDetailPanel({ ticker }: { ticker: string }) {
  const row = earningsData.find(r => r.ticker === ticker);
  const detail = detailsMap[ticker] || detailsMap.AAPL;
  if (!row || !detail) return null;

  const metrics = [
    { label: 'KGV', value: detail.pe, icon: BarChart2, color: 'var(--accent-blue)' },
    { label: 'Marktkapitalisierung', value: detail.marketCap, icon: DollarSign, color: 'var(--accent-blue)' },
    { label: 'Bruttomarge', value: detail.grossMargin, icon: Percent, color: 'var(--accent-purple)' },
    { label: 'Umsatzwachstum YoY', value: detail.revenueGrowth, icon: Layers, color: detail.revenueGrowth.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)' },
    { label: 'EPS-Wachstum YoY', value: detail.epsGrowth, icon: TrendingUp, color: detail.epsGrowth.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)' },
    { label: 'Freier Cashflow', value: detail.fcf, icon: DollarSign, color: 'var(--accent-green)' },
  ];

  return (
    <motion.div
      key={ticker}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="analytics-card overflow-hidden flex flex-col h-full shadow-3xl shadow-black/50"
    >
      <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-sidebar)] border border-white/5 flex items-center justify-center overflow-hidden shadow-inner translate-y-[-2px]">
            <img
              src={`https://financialmodelingprep.com/image-stock/${ticker}.png`}
              alt={ticker}
              className="w-8 h-8 object-contain"
              onError={e => { e.currentTarget.src = `https://at-ui-avatars.com/api/?name=${ticker}`; }}
            />
          </div>
          <div>
            <p className="text-base font-black text-[var(--test-primary)] uppercase tracking-tight">{ticker}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">{row.company}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tabular-nums transition-all ${
          row.beat ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20' : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${row.beat ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}`} />
          {row.beat ? 'BEAT' : 'MISS'} {row.surprise > 0 ? '+' : ''}{row.surprise.toFixed(1)}%
        </div>
      </div>

      <div className="p-10 space-y-12">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="p-5 glass-panel rounded-2xl border-white/5 group hover:border-[var(--accent-blue)]/20 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={12} style={{ color: m.color }} />
                  <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] group-hover:text-[var(--text-primary)]">{m.label}</p>
                </div>
                <p className="text-sm font-black tabular-nums" style={{ color: m.color }}>{m.value}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          <div>
            <p className="section-title mb-6 uppercase tracking-[0.3em] font-black">EPS-Matrix</p>
            <div className="h-48 w-full px-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detail.epsHistory}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="q" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: '12px', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                    cursor={{ fill: 'var(--bg-card-hover)', opacity: 0.4 }}
                  />
                  <Bar dataKey="estimate" fill="var(--bg-sidebar)" stroke="var(--border-main)" strokeWidth={1} radius={[2, 2, 0, 0]} name="est" />
                  <Bar dataKey="actual" radius={[2, 2, 0, 0]} name="act">
                    {detail.epsHistory.map((e, index) => (
                      <Cell key={index} fill={e.actual >= e.estimate ? 'var(--accent-green)' : 'var(--accent-red)'} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EarningsTable({ selected, onSelect }: { selected: string | null; onSelect: (t: string) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'beat' | 'miss'>('all');

  const filtered = earningsData.filter(r => {
    const matchSearch = r.ticker.toLowerCase().includes(search.toLowerCase()) || r.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'beat' ? r.beat : !r.beat);
    return matchSearch && matchFilter;
  });

  const th = 'px-8 py-6 text-left text-[10px] font-black text-[var(--test-primary)] uppercase tracking-[0.3em] bg-white/[0.02]';

  return (
    <div className="analytics-card overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-6 p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="w-full bg-[var(--bg-main)] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs text-[var(--test-primary)] placeholder-gray-600 focus:outline-none focus:border-[var(--accent-blue)]/50 uppercase transition-all tracking-widest font-black"
            placeholder="Unternehmen oder Ticker suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 glass-panel rounded-xl">
          {([
            { key: 'all', label: 'Alle' },
            { key: 'beat', label: 'Beat' },
            { key: 'miss', label: 'Miss' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === f.key ? 'bg-[var(--accent-blue)] text-white shadow-xl' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>Unternehmen</th>
              <th className={th}>Datum</th>
              <th className={`${th} text-right`}>Tatsächliches EPS</th>
              <th className={`${th} text-right`}>Überraschung</th>
              <th className={`${th} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((row) => (
              <tr key={row.ticker} onClick={() => onSelect(row.ticker)} className={`cursor-pointer transition-all group ${selected === row.ticker ? 'bg-[var(--accent-blue)]/5' : 'hover:bg-white/[0.02]'}`}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-sidebar)] border border-white/5 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                      <img src={`https://financialmodelingprep.com/image-stock/${row.ticker}.png`} alt={row.ticker} className="w-6 h-6 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase tracking-tight transition-colors ${selected === row.ticker ? 'text-[var(--accent-blue)]' : 'text-[var(--text-primary)]'}`}>{row.ticker}</p>
                      <p className="text-[9px] text-[var(--test-muted)] uppercase tracking-[0.2em] mt-1 font-black">{row.sector}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-[var(--text-muted)] text-[11px] uppercase font-black tabular-nums tracking-widest">{row.date}</td>
                <td className="px-8 py-6 text-right">
                  <p className="text-sm font-black text-[var(--text-primary)] tabular-nums group-hover:text-[var(--accent-blue)] transition-colors">${row.actualEPS.toFixed(2)}</p>
                  <p className="text-[10px] text-[var(--test-muted)] uppercase font-black tabular-nums tracking-tighter">Schätzung ${row.expectedEPS.toFixed(2)}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={`text-sm font-black tabular-nums transition-all group-hover:scale-110 inline-block origin-right ${row.surprise > 0 ? 'text-[var(--accent-green)] scale-105' : row.surprise < 0 ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}>
                    {row.surprise > 0 ? '+' : ''}{row.surprise.toFixed(1)}%
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                      row.beat ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20' : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20'
                    }`}>
                      {row.beat ? 'POSITIV' : 'NEGATIV'}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EarningsTimeline({ data, title }: { data: any[]; title: string }) {
  return (
    <div className="analytics-card p-10 w-full mb-10">
      <h3 className="section-title mb-10 flex items-center gap-4">
        <div className="w-10 h-px bg-[var(--accent-blue)]/50" />
        <Calendar size={16} className="text-[var(--accent-blue)]" /> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {data.map((e, index) => (
          <div key={index} className="flex glass-panel rounded-2xl border-white/5 overflow-hidden group hover:border-[var(--accent-blue)]/30 transition-all cursor-pointer">
            <div className="bg-white/[0.03] border-r border-white/5 p-6 flex flex-col items-center justify-center min-w-[100px] group-hover:bg-[var(--accent-blue)]/10 transition-colors">
              <span className="text-[10px] text-[var(--accent-blue)] font-black uppercase tracking-widest">{e.date.split(' ')[0]}</span>
              <span className="text-3xl font-black text-[var(--text-primary)] group-hover:scale-110 transition-transform tabular-nums">{e.date.split(' ')[1].replace(',', '')}</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                  <img src={`https://financialmodelingprep.com/image-stock/${e.ticker}.png`} alt={e.ticker} className="w-7 h-7 object-contain" />
                </div>
                <p className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{e.ticker}</p>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Geschätztes EPS</p>
                <p className="text-sm font-black text-[var(--accent-blue)] tabular-nums">{e.estEPS}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EarningsReports: React.FC = () => {
  const [selected, setSelected] = useState<string | null>('NVDA');

  return (
    <div className="space-y-16 w-full pb-16">
      <div className="pb-10 border-b border-white/5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center shadow-xl">
            <BarChart2 className="text-[var(--accent-blue)]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">
              Quartalsberichte
            </h1>
            <p className="text-[10px] text-[var(--accent-blue)] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)] animate-pulse shadow-[0_0_10px_var(--accent-blue)]" />
              Institutioneller Analyse-Feed
            </p>
          </div>
        </div>
      </div>

      <SummaryBar />

      <EarningsTimeline data={upcomingCalendar} title="Kommende Quartalstermine" />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 h-fit">
          <EarningsTable selected={selected} onSelect={setSelected} />
        </div>
        <div className="xl:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selected && <EarningsDetailPanel key={selected} ticker={selected} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EarningsReports;
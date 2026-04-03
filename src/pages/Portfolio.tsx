import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart2, Activity, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { fmt, fmtEur, getLogoUrl } from '../utils/formatters';

const API = '/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Position {
  ticker: string;
  shares: number;
  avgBuyPrice: number;
  buyDate: string;
  currentPrice: number;
  previousClose: number;
  companyName: string;
  currency: string;
  cost: number;
  value: number;
  pnl: number;
  pnlPct: number;
  dayChange: number;
  dayChangePct: number;
  weight: number;
}

interface Summary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
}

const PNL_POS = '#10b981';
const PNL_NEG = '#f43f5e';

const CHART_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', PNL_POS, PNL_NEG,
  '#a78bfa', '#34d399', '#fb923c', '#38bdf8', '#e879f9',
];

// ── Sparkbar (mini P&L bar per position) ─────────────────────────────────────

const MiniBar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-1">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(Math.abs(pct), 100)}%`, backgroundColor: color, marginLeft: pct < 0 ? 'auto' : undefined }}
    />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const Portfolio = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPct: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/portfolio`);
      const data = await res.json();
      setPositions(data.positions ?? []);
      setSummary(data.summary ?? { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPct: 0 });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deletePosition = async (ticker: string) => {
    await fetch(`${API}/portfolio/${ticker}`, { method: 'DELETE' });
    load();
  };

  const syncTR = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/portfolio/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setLastSync(new Date().toLocaleTimeString('de-DE'));
        await load();
      } else {
        alert('Sync Fehler: ' + (data.error ?? 'Unbekannt'));
      }
    } catch {
      alert('Netzwerkfehler beim Sync');
    } finally {
      setSyncing(false);
    }
  };

  const pieData = positions.map((p, i) => ({
    name: p.ticker,
    value: p.value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = positions
    .filter(p => p.currentPrice > 0)
    .map((p) => ({
      name: p.ticker,
      pnl: Math.round(p.pnlPct * 100) / 100,
      fill: p.pnlPct >= 0 ? PNL_POS : '#f43f5e',
    }));

  const dayPnl = positions.reduce((s, p) => s + (p.dayChange * p.shares), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Portfolio</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Trade Republic
            </span>
          </div>
          {positions.length > 0 && (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-white">{fmtEur(summary.totalValue)}</span>
              <span className={`text-sm font-semibold ${dayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dayPnl >= 0 ? '+' : ''}{fmtEur(dayPnl)} heute
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSync && <span className="text-xs text-slate-500">Sync: {lastSync}</span>}
          <button
            onClick={syncTR}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisiere…' : 'Sync TR'}
          </button>
          <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Gesamtwert',
              value: fmtEur(summary.totalValue),
              sub: `${positions.length} Positionen`,
              icon: DollarSign,
              color: 'indigo',
            },
            {
              label: 'Investiert',
              value: fmtEur(summary.totalCost),
              sub: 'Einstandswert',
              icon: BarChart2,
              color: 'slate',
            },
            {
              label: 'Gesamt P&L',
              value: `${summary.totalPnl >= 0 ? '+' : ''}${fmtEur(summary.totalPnl)}`,
              sub: `${summary.totalPnlPct >= 0 ? '+' : ''}${fmt(summary.totalPnlPct)}%`,
              icon: summary.totalPnl >= 0 ? TrendingUp : TrendingDown,
              color: summary.totalPnl >= 0 ? 'emerald' : 'red',
            },
            {
              label: 'Heute',
              value: `${dayPnl >= 0 ? '+' : ''}${fmtEur(dayPnl)}`,
              sub: 'Tagesveränderung',
              icon: Activity,
              color: dayPnl >= 0 ? 'emerald' : 'red',
            },
          ].map(card => {
            const Icon = card.icon;
            const colors: Record<string, { icon: string; text: string }> = {
              indigo:  { icon: 'bg-indigo-500/10 text-indigo-400',   text: 'text-indigo-300' },
              slate:   { icon: 'bg-slate-500/10 text-slate-400',     text: 'text-slate-300' },
              emerald: { icon: 'bg-emerald-500/10 text-emerald-400', text: 'text-emerald-400' },
              red:     { icon: 'bg-red-500/10 text-red-400',         text: 'text-red-400' },
            };
            const c = colors[card.color];
            return (
              <div key={card.label} className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${c.icon}`}><Icon size={13} /></div>
                  <span className="text-xs text-slate-500">{card.label}</span>
                </div>
                <div className={`text-xl font-bold ${c.text}`}>{card.value}</div>
                <div className="text-xs text-slate-600 mt-0.5">{card.sub}</div>
              </div>
            );
          })}
        </div>
      )}

      {positions.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <BarChart2 size={28} className="text-indigo-400" />
          </div>
          <p className="text-slate-300 font-semibold mb-1">Keine Positionen</p>
          <p className="text-slate-500 text-sm">Klicke "Sync TR" um dein Trade Republic Portfolio zu laden.</p>
        </div>
      ) : (
        <>
          {/* ── Main Grid ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Positions Table */}
            <div className="xl:col-span-2 bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Positionen</span>
                <span className="text-xs text-slate-500">{positions.length} Assets</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-white/5">
                      <th className="text-left px-5 py-3 font-medium">Asset</th>
                      <th className="text-right px-3 py-3 font-medium">Stück</th>
                      <th className="text-right px-3 py-3 font-medium">Kurs</th>
                      <th className="text-right px-3 py-3 font-medium">Wert</th>
                      <th className="text-right px-3 py-3 font-medium">P&amp;L</th>
                      <th className="text-right px-3 py-3 font-medium">Tag</th>
                      <th className="text-right px-3 py-3 font-medium">Anteil</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p, i) => {
                      const logo = getLogoUrl(p.ticker);
                      return (
                        <tr key={p.ticker} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              {logo ? (
                                <img src={logo} alt={p.ticker}
                                  className="w-8 h-8 rounded-lg object-contain bg-slate-800/80 p-1 flex-shrink-0"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-800"
                                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                  {p.ticker.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white leading-tight">{p.ticker}</div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[110px]">{p.companyName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right px-3 py-3 text-slate-400 text-xs">
                            {fmt(p.shares, p.shares % 1 === 0 ? 0 : 4)}
                          </td>
                          <td className="text-right px-3 py-3">
                            <div className="text-white text-xs font-medium">{fmt(p.currentPrice)}</div>
                            <div className="text-[10px] text-slate-600">Ø {fmt(p.avgBuyPrice)}</div>
                          </td>
                          <td className="text-right px-3 py-3">
                            <div className="text-white font-semibold text-xs">{fmtEur(p.value)}</div>
                            <div className="text-[10px] text-slate-600">{fmtEur(p.cost)} Einstand</div>
                          </td>
                          <td className="text-right px-3 py-3">
                            <div className={`font-bold text-xs ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {p.pnl >= 0 ? '+' : ''}{fmtEur(p.pnl)}
                            </div>
                            <div className={`text-[10px] font-medium ${p.pnlPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {p.pnlPct >= 0 ? '+' : ''}{fmt(p.pnlPct)}%
                            </div>
                            <MiniBar pct={p.pnlPct} color={p.pnlPct >= 0 ? PNL_POS : '#f43f5e'} />
                          </td>
                          <td className="text-right px-3 py-3">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${p.dayChangePct >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                              {p.dayChangePct >= 0 ? '+' : ''}{fmt(p.dayChangePct)}%
                            </span>
                          </td>
                          <td className="text-right px-3 py-3">
                            <div className="text-xs text-white font-medium">{fmt(p.weight, 1)}%</div>
                            <MiniBar pct={p.weight} color={CHART_COLORS[i % CHART_COLORS.length]} />
                          </td>
                          <td className="px-3 py-3">
                            <button onClick={() => deletePosition(p.ticker)}
                              className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Donut Chart */}
              <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Allokation</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: 12 }}
                      formatter={(val: number) => [fmtEur(val), 'Wert']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {positions.map((p, i) => (
                    <div key={p.ticker} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-300 font-medium w-14 flex-shrink-0">{p.ticker}</span>
                      <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.weight}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                      <span className="text-slate-400 w-9 text-right">{fmt(p.weight, 1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* P&L Bar Chart */}
              <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Rendite pro Position</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} barSize={18} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: 12 }}
                      formatter={(val: number) => [`${val >= 0 ? '+' : ''}${val}%`, 'Rendite']}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Nächste Schritte Teaser */}
              <div className="bg-slate-900/40 border border-indigo-500/10 rounded-2xl p-4">
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity size={11} /> In Entwicklung
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />Performance vs. S&P 500</div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />Interner Zinsfuß (IRR)</div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />Korrelationsmatrix</div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />Sharpe Ratio · Beta · Volatilität</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;

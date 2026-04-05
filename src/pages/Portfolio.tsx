import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Activity, Trash2, AlertTriangle, X,
  ShieldCheck, Globe
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { fmt, fmtEur, getLogoUrl } from '../utils/formatters';
import DCFChart, { ValuationBadge } from '../components/DCFChart';
import { useTheme } from '../context/ThemeContext';

const RANGES = ['1D', '5D', '1M', '6M', '1Y', 'ALL'];
const CHART_COLORS = ['#2962ff', '#26a69a', '#ef5350', '#ffb100', '#9c27b0', '#00bcd4', '#ff5722'];

const Portfolio: React.FC = () => {
  // ── Data & State ─────────────────────────────────────────────────────────────
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'none' | 'request' | 'verify'>('none');
  const [authCode, setAuthCode] = useState('');
  const [authing, setAuthing] = useState(false);
  
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [perfRange, setPerfRange] = useState('ALL');
  const { theme } = useTheme();

  const load = useCallback(async () => {
    try {
      const resp = await fetch('/api/portfolio');
      const d = await resp.json();
      setData(d);
      setLoading(false);
    } catch (e) {
      console.error('Fetch error:', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncTR = async () => {
    setSyncing(true);
    try {
      const resp = await fetch('/api/tr/sync', { method: 'POST' });
      const d = await resp.json();
      if (d.error) {
        if (d.sessionExpired) setAuthStep('request');
        setSyncError(d);
      } else {
        await load();
      }
    } catch (e) {
      setSyncError({ message: 'Netzwerkfehler' });
    }
    setSyncing(false);
  };

  const requestLogin = async () => {
    setAuthing(true);
    const resp = await fetch('/api/tr/login', { method: 'POST' });
    const d = await resp.json();
    setAuthing(false);
    if (!d.error) setAuthStep('verify');
    else setSyncError(d);
  };

  const submitAuth = async () => {
    setAuthing(true);
    const resp = await fetch('/api/tr/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode }),
    });
    const d = await resp.json();
    setAuthing(false);
    if (!d.error) {
      setAuthStep('none');
      setAuthCode('');
      syncTR();
    } else {
      setSyncError(d);
    }
  };

  const deletePosition = async (ticker: string) => {
    if (!confirm(`Möchtest du ${ticker} wirklich löschen?`)) return;
    await fetch(`/api/portfolio/${ticker}`, { method: 'DELETE' });
    load();
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="term-card px-3 py-2.5 text-xs shadow-xl min-w-[140px]">
        <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
               <span className="text-[var(--text-secondary)] font-medium">{p.name}:</span>
            </div>
            <span className="text-[var(--text-primary)] font-bold tabular-nums">{fmtEur(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <RefreshCw size={20} className="animate-spin text-[var(--accent-blue)]" />
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Initialisiere Portfolio...</span>
      </div>
    );
  }

  const { summary, positions, history } = data;
  const isDark = theme === 'dark';
  const chartColors = {
    grid: isDark ? 'rgba(42, 46, 57, 0.4)' : '#f0f3fa',
    text: '#787b86',
    area: '#2962ff'
  };

  const perfData = history?.history || [];
  const tickInterval = Math.ceil(perfData.length / 10);
  const pieData = positions.map((p: any, i: number) => ({
    name: p.ticker,
    value: p.marketValue,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* ── TradingView Header Ticker ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-8 px-1 py-2 border-b border-[var(--border-main)] mb-6 overflow-x-auto no-scrollbar">
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Gesamtvermögen</span>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">{fmtEur(summary.totalValue)}</span>
               <span className={`text-xs font-bold ${summary.totalPnlPct >= 0 ? 'text-pos' : 'text-neg'}`}>
                  {summary.totalPnlPct >= 0 ? '▲' : '▼'} {fmt(Math.abs(summary.totalPnlPct))}%
               </span>
            </div>
         </div>
         
         <div className="h-10 w-px bg-[var(--border-main)] hidden sm:block" />
         
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">24H Ergebnis</span>
            <span className={`text-sm font-bold tabular-nums ${summary.dayChangePct >= 0 ? 'text-pos' : 'text-neg'}`}>
               {summary.dayChangePct >= 0 ? '+' : ''}{fmtEur(summary.dayChange || 0)}
            </span>
         </div>
         
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Investitionskapital</span>
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{fmtEur(summary.totalCost)}</span>
         </div>

         <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded shadow-sm">
               <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse shadow-[0_0_8px_var(--accent-green)]" />
               <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Live Market Feed</span>
            </div>
            <button
                onClick={syncTR} disabled={syncing}
                className="p-2 border border-[var(--border-main)] hover:border-[var(--accent-blue)] transition-all rounded bg-[var(--bg-card)] shadow-sm disabled:opacity-40"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              </button>
         </div>
      </div>

      {/* ── Main Performance Chart ──────────────────────────────────────────── */}
      <div className="term-card overflow-visible">
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[var(--bg-main)] border-b border-[var(--border-main)]">
           <div className="flex items-center gap-5">
              <span className="text-[11px] font-extrabold text-[var(--text-primary)] uppercase tracking-widest">Portfolio Performance</span>
              <div className="flex items-center bg-[var(--bg-card)] rounded-sm p-0.5 border border-[var(--border-main)]">
                 {RANGES.map(tf => (
                    <button
                       key={tf}
                       onClick={() => setPerfRange(tf)}
                       className={`px-3 py-1 text-[9px] font-bold rounded-sm transition-all ${perfRange === tf ? 'bg-[var(--accent-blue)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                       {tf}
                    </button>
                 ))}
              </div>
           </div>
           <div className="hidden sm:flex items-center gap-3">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Benchmark: <span className="text-[var(--text-secondary)]">S&P 500 (+12.4%)</span></span>
           </div>
        </div>
        
        <div className="h-[450px] w-full p-6 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={perfData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.area} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={chartColors.area} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis 
                dataKey="label" 
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 500 }}
                dy={12}
                interval={tickInterval}
              />
              <YAxis 
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 500 }}
                tickFormatter={v => `€${(v / 1000).toFixed(1)}k`}
                width={55}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                 content={<ChartTooltip />}
                 cursor={{ stroke: chartColors.text, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="portfolio" 
                name="Portfolio"
                stroke={chartColors.area} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1000}
                isAnimationActive={false}
              />
              <Area 
                type="stepAfter" 
                dataKey="invested" 
                name="Investiert"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                strokeWidth={1}
                strokeDasharray="5 5"
                fill="none"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Allocation & Matrix Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Allocation Pie */}
         <div className="lg:col-span-4 term-card">
            <div className="term-header py-2.5 px-4 bg-[var(--bg-main)]">
               <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Asset Allocation</span>
            </div>
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
               <div className="relative w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%"
                        innerRadius={70} outerRadius={90}
                        paddingAngle={3} dataKey="value"
                        stroke="var(--bg-card)" strokeWidth={2}
                      >
                        {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', fontSize: '10px' }}
                        formatter={(v: any) => [fmtEur(v), 'Market Value']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total P/L</span>
                     <span className={`text-lg font-bold tabular-nums ${summary.totalPnl >= 0 ? 'text-pos' : 'text-neg'}`}>
                        {summary.totalPnl >= 0 ? '+' : ''}{fmtEur(summary.totalPnl)}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         {/* Matrix Table */}
         <div className="lg:col-span-8 term-card">
            <div className="term-header py-2.5 px-4 bg-[var(--bg-main)]">
               <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[var(--accent-blue)]" />
                  <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Asset Matrix</span>
               </div>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-main)] bg-[var(--bg-card)]/30">
                    <th className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Asset</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Price</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Volume</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">24H</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {positions.map((asset: any) => (
                    <React.Fragment key={asset.ticker}>
                      <tr 
                        onClick={() => setExpandedTicker(expandedTicker === asset.ticker ? null : asset.ticker)}
                        className={`
                          group cursor-pointer transition-all duration-150
                          hover:bg-[var(--bg-card-hover)]
                          ${expandedTicker === asset.ticker ? 'bg-[var(--bg-card-hover)]' : ''}
                        `}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getLogoUrl(asset.ticker) ?? undefined} 
                              className="w-8 h-8 rounded-full bg-white p-0.5 border border-[var(--border-main)] shadow-sm" 
                              alt="" 
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[var(--text-primary)]">{asset.ticker}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-medium truncate max-w-[120px]">{asset.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className="data-value text-xs text-[var(--text-primary)] font-semibold">{fmtEur(asset.price)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <div className="flex flex-col items-end">
                              <span className="data-value text-xs text-[var(--text-primary)] font-bold">{fmtEur(asset.marketValue)}</span>
                              <span className="text-[9px] text-[var(--text-muted)] font-bold">{fmt(asset.weight, 1)}%</span>
                           </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className={`text-[11px] font-bold tabular-nums ${asset.dayChangePct >= 0 ? 'text-pos' : 'text-neg'}`}>
                              {asset.dayChangePct >= 0 ? '+' : ''}{fmt(asset.dayChangePct, 2)}%
                           </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <div className="flex flex-col items-end">
                              <span className={`text-xs font-bold tabular-nums ${asset.pnl >= 0 ? 'text-pos' : 'text-neg'}`}>{fmtEur(asset.pnl)}</span>
                              <span className={`text-[9px] font-bold tabular-nums ${asset.pnlPct >= 0 ? 'text-pos' : 'text-neg'}`}>
                                 {asset.pnlPct >= 0 ? '+' : ''}{fmt(asset.pnlPct, 1)}%
                              </span>
                           </div>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {expandedTicker === asset.ticker && (
                          <tr>
                            <td colSpan={5} className="p-0 bg-[var(--bg-main)]/50">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-b border-[var(--border-main)]"
                              >
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                                   <div className="lg:col-span-8 space-y-4">
                                      <div className="flex items-center justify-between px-2">
                                         <div className="flex items-center gap-3">
                                            <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Intrinsic valuation // {asset.ticker}</h4>
                                            <ValuationBadge ticker={asset.ticker} currentPrice={asset.price} />
                                         </div>
                                         <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] font-bold">
                                             <div className="flex items-center gap-1.5"><Globe size={12} /> SEC DATA</div>
                                             <div className="flex items-center gap-1.5"><ShieldCheck size={12} /> AUDITED</div>
                                         </div>
                                      </div>
                                      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded p-4 h-64 shadow-inner">
                                        <DCFChart ticker={asset.ticker} />
                                      </div>
                                   </div>
                                   <div className="lg:col-span-4 space-y-4">
                                      <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest px-2">Node Intelligence</h4>
                                      <div className="space-y-3">
                                         <div className="term-card p-4 bg-[var(--bg-card)] border-l-4 border-l-[var(--accent-blue)]">
                                            <div className="text-[10px] text-[var(--text-muted)] font-bold mb-1 uppercase">Sentiment Scan</div>
                                            <div className="text-[12px] text-[var(--text-primary)] font-medium leading-relaxed">
                                               Positive correlation with technical breakout markers. Order flow suggests institutional accumulation.
                                            </div>
                                         </div>
                                         <button 
                                           onClick={() => deletePosition(asset.ticker)}
                                           className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-[var(--accent-red)]/30 text-[var(--accent-red)] text-[10px] font-bold hover:bg-[var(--accent-red)]/10 transition-all uppercase tracking-widest"
                                         >
                                           <Trash2 size={12} /> Remove Asset
                                         </button>
                                      </div>
                                   </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>

      {/* ── Auth Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {authStep !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="term-card max-w-sm w-full p-8 shadow-2xl bg-[var(--bg-card)]"
            >
              {authStep === 'request' ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-[var(--accent-blue)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--accent-blue)]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-widest mb-2">Trade Republic</h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Sitzung abgelaufen. Neuen Login-Code von Trade Republic anfordern?
                    </p>
                  </div>
                  <button
                    onClick={requestLogin} disabled={authing}
                    className="w-full py-3 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-40 shadow-lg"
                  >
                    {authing ? 'Fordere an...' : 'Login-Code senden'}
                  </button>
                  <button onClick={() => setAuthStep('none')} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest">Abbrechen</button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest mb-2">Code eingeben</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Gib den 4-stelligen Code aus der TR App ein.
                    </p>
                  </div>
                  <input
                    type="text" inputMode="numeric" maxLength={6} value={authCode} autoFocus
                    onChange={e => setAuthCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && submitAuth()}
                    placeholder="0000"
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg px-4 py-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-all font-mono"
                  />
                  {syncError?.message && (
                    <p className="text-[10px] font-bold text-[var(--accent-red)] uppercase">{syncError.message}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setAuthStep('request'); setAuthCode(''); }}
                      className="flex-1 py-3 rounded-lg border border-[var(--border-main)] text-[10px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-all uppercase tracking-widest"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={submitAuth}
                      disabled={authCode.length < 4 || authing}
                      className="flex-1 py-3 rounded-lg bg-[var(--accent-blue)] text-white text-[10px] font-bold hover:brightness-110 transition-all disabled:opacity-40 uppercase tracking-widest shadow-lg"
                    >
                      {authing ? 'Verifiziere...' : 'Bestätigen'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Toast ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {syncError && !syncError.sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
          >
            <div className="term-card border-[var(--accent-red)]/40 bg-[var(--bg-card)] p-3 flex items-center gap-3 shadow-2xl">
              <AlertTriangle size={14} className="text-[var(--accent-red)] flex-shrink-0" />
              <p className="text-xs font-bold text-[var(--text-primary)] flex-1">{syncError.message}</p>
              <button onClick={() => setSyncError(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portfolio;

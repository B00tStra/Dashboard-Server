import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Cpu, BarChart2, Clock, AlertCircle, Zap, Activity, ShieldCheck, TrendingUp } from 'lucide-react';

interface Session {
  agent: string;
  description: string;
  sessionKey: string;
  used: number;
  limit: number;
  percent: number;
  age: string;
}

interface TokenData {
  sessions: Session[];
  summary: {
    totalUsed: number;
    totalLimit: number;
    averageLimit: number;
    percentUsed: number;
    sessionCount: number;
  };
}

function formatTokens(num: number) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

function getStatusStyle(percent: number) {
  if (percent >= 90) return { 
    bar: 'from-rose-600 to-rose-400', 
    text: 'text-rose-400', 
    border: 'border-rose-500/20', 
    bg: 'bg-rose-500/10', 
    glow: 'shadow-rose-500/20',
    accent: '#fb7185'
  };
  if (percent >= 70) return { 
    bar: 'from-amber-600 to-amber-400', 
    text: 'text-amber-400', 
    border: 'border-amber-500/20', 
    bg: 'bg-amber-500/10', 
    glow: 'shadow-amber-500/20',
    accent: '#fbbf24'
  };
  return { 
    bar: 'from-indigo-600 to-cyan-400', 
    text: 'text-indigo-400', 
    border: 'border-indigo-500/20', 
    bg: 'bg-indigo-500/10', 
    glow: 'shadow-indigo-500/20',
    accent: '#818cf8'
  };
}

// ── Radial progress circle ────────────────────────────────────────────────────
function RadialProgress({ percent, size = 160, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const style = getStatusStyle(percent);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center p-4 bg-white/5 rounded-full border border-white/5 shadow-2xl overflow-visible" style={{ width: size + 40, height: size + 40 }}>
      {/* Outer Glow Ring */}
      <div 
        className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none" 
        style={{ background: style.accent }}
      />
      
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke="url(#tokenGradComp)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.5, ease: 'circOut' }}
        />
        <defs>
          <linearGradient id="tokenGradComp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={percent >= 90 ? '#e11d48' : percent >= 70 ? '#d97706' : '#6366f1'} />
            <stop offset="100%" stopColor={percent >= 90 ? '#fb7185' : percent >= 70 ? '#fbbf24' : '#22d3ee'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center z-10">
        <p className={`text-4xl font-black tabular-nums tracking-tighter ${style.text} drop-shadow-md`}>{percent}%</p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">utilization</p>
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session, index }: { session: Session; index: number }) {
  const style = getStatusStyle(session.percent);

  return (
    <motion.div
      className="glass-card rounded-[1.5rem] p-6 flex flex-col gap-5 group"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full ${style.text.replace('text-', 'bg-')} shadow-[0_0_12px_currentColor]`} />
            <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight truncate">{session.agent}</p>
          </div>
          {session.description && (
            <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">{session.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${style.bg} ${style.text} border ${style.border} shadow-lg tabular-nums inline-block`}>
              {session.percent}%
            </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
           <span>{formatTokens(session.used)} used</span>
           <span className="text-slate-600 italic">Limit {formatTokens(session.limit)}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${session.percent}%` }}
            transition={{ duration: 1.2, delay: index * 0.05 + 0.4, ease: 'circOut' }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-slate-700" />
          <span>{session.age} active</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <ShieldCheck size={11} className="text-emerald-500" />
           <span className="text-emerald-600/80">Protected</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const TokenUsageNexus: React.FC<{ isTab?: boolean }> = ({ isTab = false }) => {
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/token-usage');
      const json = await res.json();
      if (json.error) { setError(json.error); }
      else { setData(json); setError(null); }
    } catch { setError('Failed to fetch token usage data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Synchronizing Nexus...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center bg-rose-500/5 border-rose-500/20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Nexus Disconnected</p>
        <p className="text-slate-500 text-sm mt-1">{error || 'Unknown error'}</p>
        <button onClick={fetchData} className="mt-4 text-xs font-bold text-indigo-400 hover:text-white transition-colors">RETRY CONNECTION</button>
      </div>
    );
  }

  const { summary, sessions } = data;
  const style = getStatusStyle(summary.percentUsed);
  const remaining = summary.totalLimit - summary.totalUsed;

  return (
    <div className={`${isTab ? '' : 'max-w-7xl mx-auto space-y-12'}`}>
      
      {/* ── Header (only if not in tab) ── */}
      {!isTab && (
        <motion.div
            className="flex items-end justify-between border-b border-white/5 pb-8"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Cpu size={24} className="text-indigo-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter">
                Token <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Nexus</span>
                </h1>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em] ml-1">Context Analysis & Resource Monitoring</p>
            </div>
            <button
            onClick={fetchData}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl glass-panel border border-white/5 hover:border-indigo-500/30 text-slate-400 hover:text-white transition-all group font-bold text-xs uppercase tracking-widest"
            >
            <span className="hidden sm:inline">Refresh Matrix</span>
            <RefreshCw size={14} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
            </button>
        </motion.div>
      )}

      {/* ── Overview Panel ── */}
      <motion.div
        className={`${isTab ? 'mb-8' : 'relative'}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.8 }}
      >
        <div className={`glass-panel rounded-[2.5rem] ${isTab ? 'p-6 sm:p-8' : 'p-8 sm:p-12'} border border-white/10 overflow-hidden relative shadow-2xl`}>
           {/* Abstract Background Design */}
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
           <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

           <div className={`flex flex-col ${isTab ? 'lg:flex-row' : 'lg:flex-row'} items-center gap-8 lg:gap-16 relative z-10`}>

            {/* Radial Chart Section */}
            <div className="flex-shrink-0">
              <RadialProgress percent={summary.percentUsed} size={isTab ? 160 : 200} strokeWidth={isTab ? 12 : 15} />
            </div>

            {/* 3-Column Stats Layout */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
                 {/* Column 1: Tokens Used */}
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <TrendingUp size={12} className={style.text} /> Tokens Used
                    </p>
                    <p className={`${isTab ? 'text-3xl' : 'text-4xl'} font-black text-white tabular-nums drop-shadow-sm tracking-tighter`}>
                      {formatTokens(summary.totalUsed)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase">Total Context Consumption</p>
                 </div>

                 {/* Column 2: Tokens Guthaben (Remaining) */}
                 <div className={`space-y-1 ${isTab ? 'sm:border-l sm:border-white/5 sm:pl-6' : 'lg:border-l lg:border-white/5 lg:pl-8'}`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap size={12} className="text-emerald-400" /> Tokens Guthaben
                    </p>
                    <p className={`${isTab ? 'text-3xl' : 'text-4xl'} font-black text-white tabular-nums drop-shadow-sm tracking-tighter`}>
                      {formatTokens(remaining)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase">Available Buffer</p>
                 </div>

                 {/* Column 3: Prozent (Percentage) */}
                 <div className={`space-y-1 ${isTab ? 'sm:border-l sm:border-white/5 sm:pl-6' : 'lg:border-l lg:border-white/5 lg:pl-8'}`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity size={12} className="text-indigo-400" /> Prozent Used
                    </p>
                    <p className={`${isTab ? 'text-3xl' : 'text-4xl'} font-black tabular-nums drop-shadow-sm tracking-tighter ${style.text}`}>
                      {summary.percentUsed}%
                    </p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase">Total Capacity</p>
                 </div>
              </div>

              {/* Progress Detail */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.percentUsed}%` }}
                    transition={{ duration: 2, ease: 'circOut' }}
                  />
                </div>
                <div className="flex justify-between mt-3 px-1">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{summary.sessionCount} Active Instance Nodes</span>
                   </div>
                   <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-tighter">
                      Avg Limit: {formatTokens(summary.averageLimit)}
                   </span>
                </div>
              </div>
            </div>

           </div>
        </div>
      </motion.div>

      {/* ── Sessions Grid ── */}
      <div className={`space-y-6 ${isTab ? 'mt-8' : ''}`}>
        <div className="flex items-center gap-4">
           <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
             <BarChart2 size={12} className="text-white/40" />
             Active Instance Matrix
           </h2>
           <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        
        <div className={`grid grid-cols-1 ${isTab ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
          {sessions.map((session, i) => (
            <SessionCard key={i} session={session} index={i} />
          ))}
        </div>
      </div>

      {/* ── Info Footer ── */}
      <motion.div 
        className={`glass-panel rounded-2xl ${isTab ? 'p-5' : 'p-6 mt-12'} border border-white/5 flex flex-col sm:flex-row items-center gap-6`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <AlertCircle size={20} className="text-indigo-400" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">Architecture Node</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Elastic context management ensures deterministic AI behavior. Node sessions are automatically managed across the neural nexus.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-center px-4">
              <p className="text-base font-black text-white tracking-tighter">272k</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase">Cap</p>
           </div>
           <div className="w-px h-6 bg-white/10 hidden sm:block" />
           <div className="text-center px-4">
              <p className="text-base font-black text-white tracking-tighter">1.2ms</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase">Latency</p>
           </div>
        </div>
      </motion.div>

    </div>
  );
};

export default TokenUsageNexus;

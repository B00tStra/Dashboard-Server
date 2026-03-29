// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

export interface FearAndGreedIndicator {
  name: string;
  status: string;
  value: string;
}

export interface FearAndGreedData {
  current: number;
  yesterday: number;
  lastWeek: number;
  lastMonth: number;
  lastYear?: number;
  status: string;
  indicators: FearAndGreedIndicator[];
}

export function FearAndGreedStatusColor(score: number) {
  if (score <= 25) return 'text-rose-500';
  if (score <= 45) return 'text-orange-500';
  if (score <= 55) return 'text-slate-400';
  if (score <= 75) return 'text-cyan-400';
  return 'text-emerald-400';
}

function getStatusLabel(score: number) {
  if (score <= 25) return 'EXTREME FEAR';
  if (score <= 45) return 'FEAR';
  if (score <= 55) return 'NEUTRAL';
  if (score <= 75) return 'GREED';
  return 'EXTREME GREED';
}

export function FearAndGreedGauge({ data, title, compact = false, showLegend = false }: { data: FearAndGreedData | undefined; title: string; compact?: boolean; showLegend?: boolean }) {
  if (!data) return null;
  const s = data.current || 50;
  const angle = (s / 100) * 180;

  // Arc segments with color zones
  const getArcPath = (startScore: number, endScore: number, radius: number) => {
    const startAngle = (startScore / 100) * Math.PI - Math.PI;
    const endAngle = (endScore / 100) * Math.PI - Math.PI;
    const r = radius;
    const x1 = 200 + r * Math.cos(startAngle);
    const y1 = 200 + r * Math.sin(startAngle);
    const x2 = 200 + r * Math.cos(endAngle);
    const y2 = 200 + r * Math.sin(endAngle);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const getStatusColor = (score: number) => {
    if (score <= 25) return { text: 'text-rose-500', bg: 'bg-rose-500', stroke: '#f43f5e' };
    if (score <= 45) return { text: 'text-orange-500', bg: 'bg-orange-500', stroke: '#f97316' };
    if (score <= 55) return { text: 'text-slate-400', bg: 'bg-slate-400', stroke: '#94a3b8' };
    if (score <= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-400', stroke: '#4ade80' };
    return { text: 'text-emerald-500', bg: 'bg-emerald-500', stroke: '#22c55e' };
  };

  const colors = getStatusColor(s);

  return (
    <motion.div
      className="glass-panel rounded-[2rem] p-8 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden border border-white/5 bg-slate-950/40"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-8 relative z-10 w-full">
        <h3 className="text-lg font-bold text-white tracking-tight opacity-90">{title}</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-black mt-1">Sentiment Snapshot</p>
      </div>

      <div className="relative w-full max-w-[440px] aspect-[2/1] overflow-visible mb-6">
        <svg viewBox="0 0 400 220" className="w-full h-full">
          {/* Color zone segments - visible background */}
          <path d={getArcPath(0, 25, 160)} fill="none" stroke="#f43f5e" strokeWidth="12" strokeOpacity="0.25" />
          <path d={getArcPath(25, 45, 160)} fill="none" stroke="#f97316" strokeWidth="12" strokeOpacity="0.25" />
          <path d={getArcPath(45, 55, 160)} fill="none" stroke="#94a3b8" strokeWidth="12" strokeOpacity="0.25" />
          <path d={getArcPath(55, 75, 160)} fill="none" stroke="#4ade80" strokeWidth="12" strokeOpacity="0.25" />
          <path d={getArcPath(75, 100, 160)} fill="none" stroke="#22c55e" strokeWidth="12" strokeOpacity="0.25" />

          {/* Active Progress line */}
          <path
            d={getArcPath(0, s, 160)}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Tick marks at zone boundaries */}
          {[0, 25, 45, 55, 75, 100].map(m => {
             const angle = (m / 100) * Math.PI - Math.PI;
             const x1 = 200 + 150 * Math.cos(angle);
             const y1 = 200 + 150 * Math.sin(angle);
             const x2 = 200 + 170 * Math.cos(angle);
             const y2 = 200 + 170 * Math.sin(angle);
             return <line key={m} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="2" />;
          })}

          {/* Numbers */}
          <g fontSize="11" fontWeight="bold" fill="#64748b" className="font-mono">
            <text x="35" y="215" textAnchor="start">0</text>
            <text x="200" y="50" textAnchor="middle">50</text>
            <text x="365" y="215" textAnchor="end">100</text>
          </g>
        </svg>

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-[3px] h-[165px] origin-bottom z-20"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle - 90 }}
          transition={{ type: 'spring', damping: 20, stiffness: 60 }}
        >
          <div className={`w-full h-full ${colors.bg} rounded-full shadow-lg`} />
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${colors.bg} border-4 border-slate-900 shadow-xl`} />
        </motion.div>

        {/* Center Score */}
        <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 w-full text-center z-30">
           <div className="flex flex-col items-center">
              <motion.div
                className="flex items-baseline gap-1"
                key={s}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              >
                <span className={`text-7xl font-black tracking-tighter tabular-nums drop-shadow-2xl ${colors.text}`}>
                  {s}
                </span>
              </motion.div>
              <div
                className={`text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-current bg-white/5 backdrop-blur-md shadow-2xl mt-2 ${colors.text}`}
              >
                {getStatusLabel(s)}
              </div>
           </div>
        </div>
      </div>

      {/* Legend - CNN Style */}
      {showLegend && (
        <div className="w-full max-w-[440px] mt-4">
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Extreme Fear', color: 'bg-rose-500', range: '0-25' },
              { label: 'Fear', color: 'bg-orange-500', range: '25-45' },
              { label: 'Neutral', color: 'bg-slate-400', range: '45-55' },
              { label: 'Greed', color: 'bg-emerald-400', range: '55-75' },
              { label: 'Extreme Greed', color: 'bg-emerald-500', range: '75-100' },
            ].map((zone, i) => (
              <div key={i} className="text-center">
                <div className={`h-2 ${zone.color} rounded-full mb-2`} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{zone.label}</p>
                <p className="text-[9px] text-slate-600 font-mono mt-0.5">{zone.range}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

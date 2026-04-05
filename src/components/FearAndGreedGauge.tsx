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
  if (score <= 25) return 'var(--accent-red)';
  if (score <= 45) return 'var(--accent-red)';
  if (score <= 55) return 'var(--text-muted)';
  if (score <= 75) return 'var(--accent-green)';
  return 'var(--accent-green)';
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
    if (score <= 25) return { text: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]', stroke: 'var(--accent-red)' };
    if (score <= 45) return { text: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]', stroke: 'var(--accent-red)' };
    if (score <= 55) return { text: 'text-[var(--text-muted)]', bg: 'bg-[var(--text-muted)]', stroke: 'var(--text-muted)' };
    if (score <= 75) return { text: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]', stroke: 'var(--accent-green)' };
    return { text: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]', stroke: 'var(--accent-green)' };
  };

  const colors = getStatusColor(s);

  return (
    <motion.div
      className="analytics-card p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden w-full h-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-blue)]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="text-center mb-6 relative z-10 w-full">
        <h3 className="section-title text-[var(--test-primary)]">{title}</h3>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">Sentiment Matrix</p>
      </div>

      <div className="relative w-full max-w-[400px] aspect-[2/1] overflow-visible mb-6">
        <svg viewBox="0 0 400 220" className="w-full h-full">
          <path d={getArcPath(0, 25, 160)} fill="none" stroke="var(--accent-red)" strokeWidth="8" strokeOpacity="0.1" />
          <path d={getArcPath(25, 45, 160)} fill="none" stroke="var(--accent-red)" strokeWidth="8" strokeOpacity="0.1" />
          <path d={getArcPath(45, 55, 160)} fill="none" stroke="var(--text-muted)" strokeWidth="8" strokeOpacity="0.1" />
          <path d={getArcPath(55, 75, 160)} fill="none" stroke="var(--accent-green)" strokeWidth="8" strokeOpacity="0.1" />
          <path d={getArcPath(75, 100, 160)} fill="none" stroke="var(--accent-green)" strokeWidth="8" strokeOpacity="0.1" />

          <path
            d={getArcPath(0, s, 160)}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="butt"
            className="transition-all duration-1000 ease-out"
          />

          {[0, 25, 45, 55, 75, 100].map(m => {
             const angle = (m / 100) * Math.PI - Math.PI;
             const x1 = 200 + 155 * Math.cos(angle);
             const y1 = 200 + 155 * Math.sin(angle);
             const x2 = 200 + 165 * Math.cos(angle);
             const y2 = 200 + 165 * Math.sin(angle);
             return <line key={m} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-main)" strokeWidth="2" />;
          })}

          <g fontSize="10" fontWeight="bold" fill="var(--text-muted)" className="tabular-nums">
            <text x="35" y="210" textAnchor="start">0</text>
            <text x="200" y="45" textAnchor="middle">50</text>
            <text x="365" y="210" textAnchor="end">100</text>
          </g>
        </svg>

        <motion.div
          className="absolute bottom-0 left-1/2 w-[2px] h-[160px] origin-bottom z-20"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle - 90 }}
          transition={{ type: 'spring', damping: 25, stiffness: 80 }}
        >
          <div className={`w-full h-full ${colors.bg} shadow-lg`} />
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${colors.bg} border-2 border-[var(--bg-card)] shadow-xl`} />
        </motion.div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full text-center z-30">
            <div className="flex flex-col items-center">
              <span className={`text-6xl font-black tracking-tighter tabular-nums ${colors.text}`}>
                {s}
              </span>
              <div
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border tabular-nums mt-1 ${colors.text} border-current bg-[var(--bg-card)] shadow-lg`}
              >
                {getStatusLabel(s)}
              </div>
            </div>
        </div>
      </div>

      {showLegend && (
        <div className="w-full max-w-[400px] mt-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: 'Extreme Fear', color: 'bg-[var(--accent-red)]', range: '0-25' },
              { label: 'Fear', color: 'bg-[var(--accent-red)] opacity-60', range: '25-45' },
              { label: 'Neutral', color: 'bg-[var(--text-muted)]', range: '45-55' },
              { label: 'Greed', color: 'bg-[var(--accent-green)] opacity-60', range: '55-75' },
              { label: 'Extreme Greed', color: 'bg-[var(--accent-green)]', range: '75-100' },
            ].map((zone, i) => (
              <div key={i} className="text-center">
                <div className={`h-1.5 ${zone.color} rounded-sm mb-1.5`} />
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">{zone.label}</p>
                <p className="text-[8px] text-[var(--text-muted)] font-mono mt-0.5 tabular-nums">{zone.range}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

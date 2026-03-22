import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle, Globe, Newspaper, Brain, Compass } from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────

const stocksMacroData = [
  { label: 'Fed Target Rate', value: '5.25 - 5.50%', prev: '5.25 - 5.50%', status: 'neutral', history: [{v: 5}, {v: 5.25}, {v: 5.25}, {v: 5.25}, {v: 5.5}, {v: 5.5}] },
  { label: 'CPI (YoY)', value: '3.1%', prev: '3.2%', status: 'good', history: [{v: 3.7}, {v: 3.2}, {v: 3.1}, {v: 3.4}, {v: 3.2}, {v: 3.1}] },
  { label: 'Non-Farm Payrolls', value: '275K', prev: '229K', status: 'hot', history: [{v: 150}, {v: 199}, {v: 216}, {v: 229}, {v: 275}] },
];

const cryptoMacroData = [
  { label: 'BTC Dominance', value: '52.4%', prev: '51.8%', status: 'hot', history: [{v: 50}, {v: 51}, {v: 51.5}, {v: 51.2}, {v: 52}, {v: 52.4}] },
  { label: 'Total Market Cap', value: '$2.64T', prev: '$2.51T', status: 'good', history: [{v: 2.1}, {v: 2.3}, {v: 2.4}, {v: 2.2}, {v: 2.5}, {v: 2.64}] },
  { label: 'ETH Gas (Gwei)', value: '24', prev: '45', status: 'neutral', history: [{v: 60}, {v: 55}, {v: 40}, {v: 48}, {v: 30}, {v: 24}] },
];

const stocksNews = [
  { title: 'Semiconductor sales reach record highs amid robust global AI infrastructure investments', time: '2h ago', source: 'TechInsider' },
  { title: 'Big Tech focuses shifting from Metaverse concepts directly to Enterprise AI implementation', time: '4h ago', source: 'MarketWatch' },
  { title: 'Global PC shipments return to solid growth in Q1 ahead of new AI-PC wave', time: '5h ago', source: 'Reuters' },
];

const cryptoNews = [
  { title: 'Bitcoin ETFs see record inflows as institutional adoption accelerates globally', time: '1h ago', source: 'CoinDesk' },
  { title: 'Ethereum network fees hit yearly low following massive L2 transaction shifts', time: '3h ago', source: 'Decrypt' },
  { title: 'Solana DeFi ecosystem Total Value Locked crosses $10 Billion milestone', time: '5h ago', source: 'Blockworks' },
];

interface TickerSentiment {
  ticker: string;
  name: string;
  bullish: number;
  bearish: number;
  neutral: number;
  score: number; // -100 to +100
  trend: 'up' | 'down' | 'flat';
  signals: string[];
  priceHistory: { day: string; price: number }[];
}

const stocksTickers: TickerSentiment[] = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', bullish: 65, bearish: 18, neutral: 17,
    score: 72, trend: 'up',
    signals: ['Strong earnings beat', 'iPhone demand resilient', 'Services segment growing'],
    priceHistory: [
      { day: 'Mon', price: 170 }, { day: 'Tue', price: 172 }, { day: 'Wed', price: 171 },
      { day: 'Thu', price: 174 }, { day: 'Fri', price: 175 },
    ],
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', bullish: 82, bearish: 8, neutral: 10,
    score: 91, trend: 'up',
    signals: ['AI chip demand surging', 'Data center revenue record', 'H100 backlog extended'],
    priceHistory: [
      { day: 'Mon', price: 820 }, { day: 'Tue', price: 835 }, { day: 'Wed', price: 848 },
      { day: 'Thu', price: 862 }, { day: 'Fri', price: 875 },
    ],
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', bullish: 35, bearish: 50, neutral: 15,
    score: -28, trend: 'down',
    signals: ['Price cuts pressuring margins', 'EV demand slowdown concerns', 'Competition intensifying'],
    priceHistory: [
      { day: 'Mon', price: 260 }, { day: 'Tue', price: 255 }, { day: 'Wed', price: 252 },
      { day: 'Thu', price: 249 }, { day: 'Fri', price: 248 },
    ],
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', bullish: 70, bearish: 12, neutral: 18,
    score: 68, trend: 'up',
    signals: ['Azure growth steady', 'Copilot AI integration', 'Enterprise adoption strong'],
    priceHistory: [
      { day: 'Mon', price: 408 }, { day: 'Tue', price: 411 }, { day: 'Wed', price: 413 },
      { day: 'Thu', price: 414 }, { day: 'Fri', price: 416 },
    ],
  },
  {
    ticker: 'META', name: 'Meta Platforms', bullish: 48, bearish: 35, neutral: 17,
    score: 18, trend: 'flat',
    signals: ['Ad revenue mixed signals', 'Threads gaining traction', 'Reality Labs still losing'],
    priceHistory: [
      { day: 'Mon', price: 502 }, { day: 'Tue', price: 498 }, { day: 'Wed', price: 495 },
      { day: 'Thu', price: 493 }, { day: 'Fri', price: 492 },
    ],
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', bullish: 72, bearish: 14, neutral: 14,
    score: 74, trend: 'up',
    signals: ['AWS reaccelerating', 'Ad business outperforming', 'Cost cuts showing results'],
    priceHistory: [
      { day: 'Mon', price: 181 }, { day: 'Tue', price: 182 }, { day: 'Wed', price: 183 },
      { day: 'Thu', price: 184 }, { day: 'Fri', price: 185 },
    ],
  },
];

const cryptoTickers: TickerSentiment[] = [
  {
    ticker: 'BTC', name: 'Bitcoin', bullish: 85, bearish: 5, neutral: 10,
    score: 92, trend: 'up',
    signals: ['ETF Inflows Strong', 'Halving Supply Shock', 'Hashrate ATH'],
    priceHistory: [ { day: 'Mon', price: 68000 }, { day: 'Tue', price: 69500 }, { day: 'Wed', price: 71000 }, { day: 'Thu', price: 72500 }, { day: 'Fri', price: 74000 } ],
  },
  {
    ticker: 'ETH', name: 'Ethereum', bullish: 60, bearish: 20, neutral: 20,
    score: 55, trend: 'up',
    signals: ['ETF Approval Hopes', 'L2 Growth', 'Deflationary Issuance'],
    priceHistory: [ { day: 'Mon', price: 3400 }, { day: 'Tue', price: 3450 }, { day: 'Wed', price: 3600 }, { day: 'Thu', price: 3650 }, { day: 'Fri', price: 3800 } ],
  },
  {
    ticker: 'SOL', name: 'Solana', bullish: 75, bearish: 15, neutral: 10,
    score: 80, trend: 'up',
    signals: ['DEX Volume Flippening', 'Meme Coin Frenzy', 'Network Stability'],
    priceHistory: [ { day: 'Mon', price: 140 }, { day: 'Tue', price: 145 }, { day: 'Wed', price: 152 }, { day: 'Thu', price: 160 }, { day: 'Fri', price: 165 } ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 50) return '#4ade80';
  if (score >= 0) return '#facc15';
  return '#f87171';
}

function useScoreLabel(score: number) {
  const { t } = useLanguage();
  if (score >= 60) return { label: t('analysis_bullish'),    icon: TrendingUp,   color: 'text-green-400', bg: 'bg-green-900/40 border-green-500/30' };
  if (score >= 20) return { label: t('analysis_sl_bullish'), icon: TrendingUp,   color: 'text-green-300', bg: 'bg-green-900/20 border-green-500/20' };
  if (score >= -20) return { label: t('analysis_neutral'),   icon: Minus,        color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-500/30' };
  if (score >= -60) return { label: t('analysis_sl_bearish'),icon: TrendingDown, color: 'text-red-300',   bg: 'bg-red-900/20 border-red-500/20' };
  return             { label: t('analysis_bearish'),         icon: TrendingDown, color: 'text-red-400',   bg: 'bg-red-900/40 border-red-500/30' };
}

// ── Sentiment Bar ─────────────────────────────────────────────────────────────

function SentimentBar({ bullish, bearish, neutral }: { bullish: number; bearish: number; neutral: number }) {
  return (
    <div className="flex rounded-full overflow-hidden h-2 gap-px">
      <div className="bg-green-500 transition-all duration-700" style={{ width: `${bullish}%` }} />
      <div className="bg-gray-500 transition-all duration-700" style={{ width: `${neutral}%` }} />
      <div className="bg-red-500 transition-all duration-700" style={{ width: `${bearish}%` }} />
    </div>
  );
}

// ── Radar ─────────────────────────────────────────────────────────────────────

function SentimentRadar({ ticker }: { ticker: TickerSentiment }) {
  const data = [
    { metric: 'Bullish', value: ticker.bullish },
    { metric: 'Momentum', value: Math.max(0, ticker.score + 50) / 2 },
    { metric: 'Volume', value: 60 + Math.random() * 30 },
    { metric: 'Social', value: ticker.bullish * 0.9 },
    { metric: 'News', value: ticker.bullish * 0.85 },
    { metric: 'Analyst', value: ticker.bullish * 0.95 },
  ];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Radar dataKey="value" stroke={scoreColor(ticker.score)} fill={scoreColor(ticker.score)} fillOpacity={0.15} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── Ticker Card ───────────────────────────────────────────────────────────────

function TickerCard({ ticker, index, selected, onSelect }: {
  ticker: TickerSentiment;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const { label, icon: Icon, color, bg } = useScoreLabel(ticker.score);
  const TrendIcon = ticker.trend === 'up' ? TrendingUp : ticker.trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onSelect}
      className={`glass-card rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
        selected ? 'ring-2 ring-indigo-500/60 bg-slate-800/70' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={`https://financialmodelingprep.com/image-stock/${ticker.ticker}.png`} alt={ticker.ticker} className="w-8 h-8 rounded-full bg-white/10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div>
            <p className="text-lg font-bold text-white leading-tight">{ticker.ticker}</p>
            <p className="text-xs text-slate-400">{ticker.name}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${color}`}>
          <Icon size={11} />
          {label}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-black" style={{ color: scoreColor(ticker.score) }}>
          {ticker.score > 0 ? '+' : ''}{ticker.score}
        </span>
        <span className="text-slate-400 text-xs mb-1">{t('analysis_score_label')}</span>
        <TrendIcon size={16} className={`mb-1 ml-auto ${ticker.trend === 'up' ? 'text-green-400' : ticker.trend === 'down' ? 'text-red-400' : 'text-yellow-400'}`} />
      </div>

      {/* Bar */}
      <SentimentBar bullish={ticker.bullish} bearish={ticker.bearish} neutral={ticker.neutral} />
      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
        <span className="text-green-400">{ticker.bullish}{t('analysis_bull_pct')}</span>
        <span>{ticker.neutral}{t('analysis_neutral_pct')}</span>
        <span className="text-red-400">{ticker.bearish}{t('analysis_bear_pct')}</span>
      </div>

      {/* Mini price chart */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={ticker.priceHistory}>
            <defs>
              <linearGradient id={`g-${ticker.ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scoreColor(ticker.score)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={scoreColor(ticker.score)} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="price" stroke={scoreColor(ticker.score)} strokeWidth={1.5}
              fill={`url(#g-${ticker.ticker})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ ticker }: { ticker: TickerSentiment }) {
  const { t } = useLanguage();
  const { label, color } = useScoreLabel(ticker.score);
  return (
    <motion.div
      key={ticker.ticker}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel rounded-2xl p-6 flex flex-col gap-6"
    >
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">{t('analysis_selected')}</p>
        <div className="flex items-center gap-3">
          <img src={`https://financialmodelingprep.com/image-stock/${ticker.ticker}.png`} alt={ticker.ticker} className="w-10 h-10 rounded-full bg-white/10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div>
            <h2 className="text-3xl font-black text-white">{ticker.ticker}
              <span className={`text-lg font-medium ml-2 ${color}`}>{label}</span>
            </h2>
            <p className="text-slate-400 text-sm">{ticker.name}</p>
          </div>
        </div>
      </div>

      <SentimentRadar ticker={ticker} />

      <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
        <p className="text-[10px] text-indigo-400 font-bold mb-2 flex items-center gap-1.5 uppercase tracking-widest">
          <Brain size={14}/> AI Analyst Verdict
        </p>
        <p className="text-sm text-indigo-100/90 leading-relaxed italic font-medium">
          "{ticker.ticker} is currently exhibiting strong technical momentum. Institutional accumulation is evident across options flow, though short-term RSI suggests mild overbought conditions. Hold recommended with a trailing stop-loss."
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">{t('analysis_signals')}</p>
        <div className="space-y-2">
          {ticker.signals.map((s, i) => {
            const positive = ticker.score >= 0;
            const Icon = positive ? CheckCircle : AlertTriangle;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2.5 glass rounded-xl px-3 py-2.5"
              >
                <Icon size={14} className={`mt-0.5 flex-shrink-0 ${positive ? 'text-green-400' : 'text-yellow-400'}`} />
                <span className="text-sm text-slate-300">{s}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{t('analysis_breakdown')}</p>
        <SentimentBar bullish={ticker.bullish} bearish={ticker.bearish} neutral={ticker.neutral} />
        <div className="flex justify-between text-xs mt-2">
          <span className="text-green-400 font-semibold">{ticker.bullish}{t('analysis_pct_bullish')}</span>
          <span className="text-slate-400">{ticker.neutral}{t('analysis_pct_neutral')}</span>
          <span className="text-red-400 font-semibold">{ticker.bearish}{t('analysis_pct_bearish')}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Overview Bar Chart & Gauge ────────────────────────────────────────────────

function FearAndGreedGauge({ score, title }: { score: number; title: string }) {
  const angle = (score / 100) * 180;
  return (
    <motion.div className="glass-panel rounded-2xl p-5 flex flex-col items-center relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div className="flex items-center gap-2 mb-6 w-full justify-start">
        <Compass size={15} className="text-emerald-400" />
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      
      {/* Semi-circle Gauge */}
      <div className="relative w-56 h-28 overflow-hidden mb-2 translate-y-2">
        {/* Rainbow Arch */}
        <div 
          className="absolute top-0 left-0 w-56 h-56 rounded-full opacity-90" 
          style={{ 
            background: 'conic-gradient(from 270deg, #ef4444 0deg, #eab308 90deg, #10b981 180deg, transparent 180deg)', 
            WebkitMaskImage: 'radial-gradient(transparent 65%, black 66%)',
            maskImage: 'radial-gradient(transparent 65%, black 66%)' 
          }} 
        />
        {/* Glow behind arch */}
        <div className="absolute top-0 left-0 w-56 h-56 rounded-full blur-2xl opacity-30 mix-blend-screen" style={{ background: 'conic-gradient(from 270deg, #ef4444 0deg, #eab308 90deg, #10b981 180deg, transparent 180deg)' }} />

        {/* Labels under the arch */}
        <span className="absolute bottom-2 left-6 text-[9px] font-black text-red-400 uppercase tracking-wider drop-shadow-md">Fear</span>
        <span className="absolute bottom-2 right-6 text-[9px] font-black text-emerald-400 uppercase tracking-wider drop-shadow-md">Greed</span>

        {/* Center dot under needle */}
        <div className="absolute bottom-0 left-1/2 w-8 h-8 rounded-full bg-slate-900 border-4 border-slate-700 transform -translate-x-1/2 translate-y-1/2 z-30 shadow-2xl" />

        {/* Needle Container (rotates) */}
        <div 
          className="absolute bottom-0 left-1/2 w-1.5 h-[5.5rem] origin-bottom transition-all duration-1000 ease-out z-20"
          style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
        >
          {/* Actual Needle line */}
          <div className="w-full h-full bg-white rounded-t-full shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      <div className="text-center z-10 mt-auto">
        <h3 className="text-4xl font-black text-emerald-400 drop-shadow-lg">{score}</h3>
        <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold mt-1">Extreme Greed</p>
      </div>
    </motion.div>
  );
}

function SentimentSpectrum({ data }: { data: { name: string; score: number }[] }) {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 flex flex-col justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-8">
        <Zap size={15} className="text-indigo-400" />
        <p className="text-sm font-semibold text-white">Sentiment Spectrum</p>
      </div>
      
      <div className="relative w-full h-16 rounded-full bg-slate-900/50 border border-white/5 flex items-center px-6 mt-2">
         <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 rounded-full blur-md" />
         <div className="w-full h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative z-10">
            <div className="absolute -top-6 left-0 text-[9px] text-red-400 font-bold uppercase tracking-wider">Bearish</div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-yellow-400 font-bold uppercase tracking-wider">Neutral</div>
            <div className="absolute -top-6 right-0 text-[9px] text-green-400 font-bold uppercase tracking-wider">Bullish</div>
            
            {data.map(ticker => {
               const leftPct = ((ticker.score + 100) / 200) * 100;
               return (
                 <div 
                   key={ticker.name} 
                   className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer transition-all duration-300 hover:z-50 z-20"
                   style={{ left: `${leftPct}%` }}
                 >
                   <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl border border-white/10 pointer-events-none">
                     <span className="font-bold">{ticker.name}</span>: {ticker.score > 0 ? '+' : ''}{ticker.score}
                   </div>
                   <div className="absolute w-8 h-8 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
                   <div className="w-7 h-7 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] overflow-hidden group-hover:scale-125 transition-all bg-slate-800">
                      <img src={`https://financialmodelingprep.com/image-stock/${ticker.name}.png`} alt={ticker.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${ticker.name}&background=1e293b&color=fff&rounded=true&bold=true`; }} />
                   </div>
                 </div>
               );
            })}
         </div>
      </div>
    </motion.div>
  );
}

// ── New Widgets ───────────────────────────────────────────────────────────────

function MacroWidget({ data }: { data: any[] }) {
  return (
    <motion.div className="glass-panel rounded-2xl p-5" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
        <Globe size={14} className="text-cyan-400" /> Macro Indicators
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.label} className="glass-card rounded-xl p-4 flex flex-col relative overflow-hidden border border-white/5 shadow-md group border-b-2 border-b-transparent hover:border-b-cyan-500/50 transition-colors">
             <div className="relative z-10 flex flex-col h-full">
               <p className="text-xs text-slate-400 mb-2 font-medium">{d.label}</p>
               <div className="flex items-center gap-3 mb-1">
                 <p className="text-3xl font-black text-white drop-shadow-md">{d.value}</p>
                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-inner ${d.status === 'hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : d.status === 'good' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}>{d.status}</span>
               </div>
               <p className="text-xs text-slate-500 font-medium mt-auto relative z-10 bg-slate-900/40 inline-block px-2 py-0.5 rounded backdrop-blur-sm self-start">Prev. {d.prev}</p>
             </div>
             {/* Background Sparkline */}
             <div className="absolute bottom-0 left-0 right-0 h-20 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={d.history}>
                   <Area type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} fill="#0891b2" fillOpacity={0.25} dot={false} isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SectorNewsWidget({ data, title }: { data: any[]; title: string }) {
  return (
    <div className="glass-panel rounded-2xl p-6 mt-6">
      <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-5 flex items-center gap-2">
        <Newspaper size={14} className="text-blue-400" /> {title}
      </h3>
      <div className="space-y-4">
        {data.map((news, i) => (
          <div key={i} className="group cursor-pointer">
            <h4 className="text-sm text-slate-200 font-medium leading-snug group-hover:text-blue-400 transition-colors mb-2">
              {news.title}
            </h4>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-semibold text-slate-400">{news.source}</span>
              <span>{news.time}</span>
            </div>
            {i !== data.length - 1 && <div className="h-px w-full bg-white/5 mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const MarketAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');
  const [selectedStock, setSelectedStock] = useState<string>('NVDA');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');

  const isStocks = activeTab === 'stocks';
  
  const currentTickers = isStocks ? stocksTickers : cryptoTickers;
  const selected = isStocks ? selectedStock : selectedCrypto;
  const setSelected = isStocks ? setSelectedStock : setSelectedCrypto;
  const selectedTicker = currentTickers.find(t => t.ticker === selected) || currentTickers[0];

  const currentMacro = isStocks ? stocksMacroData : cryptoMacroData;
  const currentNews = isStocks ? stocksNews : cryptoNews;
  const newsTitle = isStocks ? 'Tech Sector News' : 'Crypto Market News';
  
  const currentOverall = currentTickers.map(t => ({ name: t.ticker, score: t.score }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {t('analysis_title')}
            <div className="flex bg-slate-800/80 p-1 rounded-lg border border-white/10 w-fit ml-4 shadow-inner">
              <button 
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-300 ${isStocks ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} 
                onClick={() => setActiveTab('stocks')}
              >
                Stocks
              </button>
              <button 
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-300 ${!isStocks ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} 
                onClick={() => setActiveTab('crypto')}
              >
                Crypto
              </button>
            </div>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t('analysis_subtitle')}</p>
        </motion.div>
      </div>

      <MacroWidget data={currentMacro} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Left Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SentimentSpectrum data={currentOverall} />
            <FearAndGreedGauge score={isStocks ? 78 : 85} title={isStocks ? "S&P 500 Sentiment" : "Bitcoin Sentiment"} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTickers.map((t, i) => (
              <TickerCard
                key={t.ticker}
                ticker={t}
                index={i}
                selected={selected === t.ticker}
                onSelect={() => setSelected(t.ticker)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="xl:col-span-1">
          <DetailPanel ticker={selectedTicker} />
          <SectorNewsWidget data={currentNews} title={newsTitle} />
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;

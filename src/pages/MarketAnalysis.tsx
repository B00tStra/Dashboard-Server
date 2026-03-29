import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle, 
  Newspaper, Brain, Activity
} from 'lucide-react';
import { 
  FearAndGreedGauge, 
  FearAndGreedData 
} from '../components/FearAndGreedGauge';

const API_BASE = '/api';

function useFetch<T>(endpoint: string, initialData: T, dependencies: React.DependencyList = []): T {
  const [data, setData] = useState<T>(initialData);
  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('API Fetch Error:', err));
  }, [endpoint, ...dependencies]);
  return data;
}

interface TickerSentiment {
  ticker: string;
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  bullish: number;
  bearish: number;
  neutral: number;
  score: number;
  trend: 'up' | 'down' | 'flat';
  signals: string[];
  news_summary: string;
  analysis: string;
  last_updated: string | null;
  priceHistory?: any[];
  priceHistoryDaily?: { day: string; price: number }[];
  chart_1w?: any[];
  chart_1m?: any[];
}

interface MarketData {
  stocks: {
    macro: any[];
    fearAndGreed: FearAndGreedData;
  };
  crypto: {
    macro: any[];
    fearAndGreed: FearAndGreedData;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 50) return '#4ade80';
  if (score >= 0) return '#facc15';
  return '#f87171';
}

function useScoreLabel(score: number) {
  const { t } = useLanguage();
  if (score >= 60) return { label: t('analysis_bullish') || 'Bullish',    icon: TrendingUp,   color: 'text-green-400', bg: 'bg-green-900/40 border-green-500/30' };
  if (score >= 20) return { label: t('analysis_sl_bullish') || 'Slightly Bullish', icon: TrendingUp,   color: 'text-green-300', bg: 'bg-green-900/20 border-green-500/20' };
  if (score >= -20) return { label: t('analysis_neutral') || 'Neutral',   icon: Minus,        color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-500/30' };
  if (score >= -60) return { label: t('analysis_sl_bearish') || 'Slightly Bearish',icon: TrendingDown, color: 'text-red-300',   bg: 'bg-red-900/20 border-red-500/20' };
  return             { label: t('analysis_bearish') || 'Bearish',         icon: TrendingDown, color: 'text-red-400',   bg: 'bg-red-900/40 border-red-500/30' };
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

// Components imported from ../components/FearAndGreedGauge

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

function NavButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/fear-and-greed')}
      className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/40 text-white hover:bg-indigo-500/30 hover:border-indigo-400/60 transition-all group shadow-lg hover:shadow-indigo-500/20 text-base font-bold"
    >
      <Activity size={18} className="text-indigo-300 group-hover:text-white transition-colors" />
      <span className="group-hover:scale-105 transition-transform">View all 7 Fear &amp; Greed Indicators</span>
      <span className="ml-auto text-sm font-black text-indigo-300 group-hover:text-white group-hover:translate-x-1 transition-all">→</span>
    </button>
  );
}

function MacroWidget({ data, fearAndGreed }: { data: any[]; fearAndGreed: FearAndGreedData | undefined }) {
  const getStatusColor = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s.includes('extreme fear')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s.includes('fear')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (s.includes('neutral')) return 'bg-gray-500/20 text-slate-400 border-slate-500/30';
    if (s.includes('extreme greed')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('greed')) return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  };

  if (!fearAndGreed) return null;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      {/* ── Fear & Greed + CTA button ── */}
      <div>
        <FearAndGreedGauge data={fearAndGreed} title="Fear and Greed Index" showLegend={true} />
        <NavButton />
      </div>

      {/* ── Macro Indicators ── */}
      <div>
        <h3 className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black mb-5 pl-2 flex items-center gap-3">
          <div className="w-6 h-px bg-indigo-500/50" />
          Global Macro Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, index) => (
            <div key={index} className="glass-panel p-6 rounded-[1.5rem] border border-white/5 hover:border-white/15 transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors">{item.value}</p>
                  </div>
                  <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black border uppercase tracking-tighter ${getStatusColor(item.status)} shadow-lg`}>
                    {item.status}
                  </span>
               </div>
               <div className="h-12 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.history || []}>
                      <defs>
                        <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} fill={`url(#grad-${index})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>
          ))}
        </div>
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
  
  // Fetch real data
  const marketDataRaw = useFetch<any>('/market-data', null);
  const newsListRaw = useFetch<any[]>('/news', []);
  const stockNewsListRaw = useFetch<any[]>('/stock-news', []);

  // Extremely defensive data preparation
  const newsList = Array.isArray(newsListRaw) ? newsListRaw : [];
  const stockNewsList = Array.isArray(stockNewsListRaw) ? stockNewsListRaw : [];
  
  const marketData: MarketData = {
    stocks: { macro: [], fearAndGreed: { current: 50, yesterday: 50, lastWeek: 50, lastMonth: 50, status: 'Neutral', indicators: [] } },
    crypto: { macro: [], fearAndGreed: { current: 50, yesterday: 50, lastWeek: 50, lastMonth: 50, status: 'Neutral', indicators: [] } },
    ...(marketDataRaw || {})
  };

  const stocksTickers = stockNewsList.filter(s => s && s.ticker && ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'META', 'AMZN', 'NFLX', 'NOW', 'AMD', 'ANET', 'FTNT'].includes(s.ticker)).map(t => ({
    ...t,
    priceHistory: t.priceHistory || [],
    chart_1w: t.chart_1w || [],
    chart_1m: t.chart_1m || [],
    signals: t.signals || [],
  }));
  const cryptoTickers = stockNewsList.filter(s => s && s.ticker && ['BTC', 'ETH', 'SOL'].includes(s.ticker)).map(t => ({
    ...t,
    priceHistory: t.priceHistory || [],
    chart_1w: t.chart_1w || [],
    chart_1m: t.chart_1m || [],
    signals: t.signals || [],
  }));

  const [selectedStock, setSelectedStock] = useState<string>('NVDA');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');

  const isStocks = activeTab === 'stocks';
  const currentTickers = isStocks ? stocksTickers : cryptoTickers;
  
  const selected = isStocks ? selectedStock : selectedCrypto;
  const setSelected = isStocks ? setSelectedStock : setSelectedCrypto;
  const selectedTicker = currentTickers.find(t => t?.ticker === selected) || currentTickers[0] || stockNewsList[0];

  const currentMacro = isStocks ? (marketData?.stocks?.macro || []) : (marketData?.crypto?.macro || []);
  
  const currentNews = newsList.filter(n => {
      if (!n) return false;
      const ticker = n.ticker || '';
      if (isStocks) return !['BTC', 'ETH', 'SOL', 'USDT'].includes(ticker);
      return ['BTC', 'ETH', 'SOL', 'USDT'].includes(ticker);
  }).slice(0, 3);

  const fearAndGreed = isStocks ? marketData?.stocks?.fearAndGreed : marketData?.crypto?.fearAndGreed;
  const currentOverall = (currentTickers || []).map(t => ({ name: t?.ticker || '?', score: typeof t?.score === 'number' ? t.score : 0 }));

  const safeT = (key: string) => t(key) || key;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {safeT('analysis_title')}
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
          <p className="text-slate-400 text-sm mt-1">{safeT('analysis_subtitle')}</p>
        </motion.div>
      </div>

      <MacroWidget data={currentMacro} fearAndGreed={fearAndGreed} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <SentimentSpectrum data={currentOverall} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTickers.map((t, i) => (
              <TickerCard
                key={t?.ticker}
                ticker={t}
                index={i}
                selected={selected === t?.ticker}
                onSelect={() => setSelected(t?.ticker)}
              />
            ))}
          </div>
        </div>

        <div className="xl:col-span-1">
          {selectedTicker && <DetailPanel ticker={selectedTicker} />}
          <SectorNewsWidget data={currentNews} title={isStocks ? 'Tech Sector News' : 'Crypto Market News'} />
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;

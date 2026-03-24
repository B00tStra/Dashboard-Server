import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { createChart, ColorType } from 'lightweight-charts';
import { TrendingUp, TrendingDown, Minus, Circle, RefreshCw, FileText, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { formatTimeAgo } from '../utils/mockData';
import { useLanguage } from '../context/LanguageContext';
import DCFChart, { ValuationBadge } from '../components/DCFChart';

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

const tradingViewLogoMap: Record<string, string> = {
  NVDA: 'nvidia',
  AMD: 'advanced-micro-devices',
  NFLX: 'netflix',
  ANET: 'arista-networks',
  CPRT: 'copart',
  NOW: 'servicenow',
  AAPL: 'apple',
  TSLA: 'tesla',
  MSFT: 'microsoft',
  AMZN: 'amazon',
  META: 'meta-platforms',
  GOOGL: 'alphabet',
};

const getCompanyLogo = (ticker: string) => {
  const tvName = tradingViewLogoMap[ticker];
  return tvName 
    ? `https://s3-symbol-logo.tradingview.com/${tvName}--big.svg`
    : `https://financialmodelingprep.com/image-stock/${ticker}.png`;
};

// ── Watchlist ─────────────────────────────────────────────────────────────────

const Watchlist = ({ onAdd, refreshKey }: { onAdd: () => void; refreshKey: number }) => {
  const watchlist = useFetch<any[]>(`/watchlist?t=${refreshKey}`, [], [refreshKey]);
  const [newTicker, setNewTicker] = useState('');
  const [adding, setAdding] = useState(false);
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim() || adding) return;
    setAdding(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: newTicker }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Fehler beim Hinzufügen');
      } else {
        setNewTicker('');
        onAdd();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Netzwerkfehler');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ticker: string) => {
    try {
      await fetch(`${API_BASE}/tickers/${ticker}`, { method: 'DELETE' });
      onAdd();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col overflow-hidden flex-1 min-h-[300px]">
      <div className="px-4 sm:px-5 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display font-bold text-lg text-white">{t('dash_watchlist')}</h2>
        <form onSubmit={handleAdd} className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => { setNewTicker(e.target.value.toUpperCase()); setErrorMsg(''); }}
              placeholder={t('dash_add_placeholder')}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-40 uppercase"
              disabled={adding}
              maxLength={6}
            />
            <button type="submit" disabled={adding} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors shadow-lg disabled:opacity-50 flex-shrink-0">
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          {errorMsg && <p className="text-[10px] text-red-400 max-w-[160px] text-right leading-tight">{errorMsg}</p>}
        </form>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase">
              <th className="px-4 sm:px-5 py-3 text-left">Ticker</th>
              <th className="px-3 sm:px-4 py-3 text-right">Price</th>
              <th className="px-3 sm:px-4 py-3 text-right">Change</th>
              <th className="px-3 sm:px-4 py-3 text-right">{t('dash_fair').replace(':','')}</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">7d</th>
              <th className="px-3 sm:px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item: any) => {
              const pos = item.change >= 0;
              const sparkData = (item.sparkline || []).map((v: number) => ({ v }));
              return (
                <tr key={item.ticker} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                    <img src={getCompanyLogo(item.ticker)} alt={item.ticker} className="w-8 h-8 rounded-full bg-slate-800 object-cover shadow-sm hidden sm:block" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.ticker}&background=312e81&color=fff&rounded=true&bold=true`; }} />
                    <img src={getCompanyLogo(item.ticker)} alt={item.ticker} className="w-6 h-6 rounded-full bg-slate-800 object-cover shadow-sm sm:hidden" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.ticker}&background=312e81&color=fff&rounded=true&bold=true`; }} />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-white truncate">{item.ticker}</p>
                      <p className="text-slate-400 text-xs truncate hidden sm:block">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3.5 text-right text-white font-mono text-sm font-medium">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3.5 text-right">
                    <span className={`flex items-center justify-end gap-1 text-sm font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
                      {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {pos ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3.5 text-right">
                    <ValuationBadge ticker={item.ticker} currentPrice={item.price} />
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <div className="flex justify-end">
                      <ResponsiveContainer width={72} height={28}>
                        <AreaChart data={sparkData}>
                          <defs>
                            <linearGradient id={`grad-${item.ticker}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={pos ? '#4ade80' : '#f87171'} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={pos ? '#4ade80' : '#f87171'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="v" 
                            stroke={pos ? '#4ade80' : '#f87171'} 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill={`url(#grad-${item.ticker})`} 
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button onClick={() => handleRemove(item.ticker)} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Stock News Feed ────────────────────────────────────────────────────────────

type Sentiment = 'bullish' | 'bearish' | 'neutral';

interface StockNews {
  ticker: string;
  name: string;
  sentiment: Sentiment;
  news_summary: string;
  analysis: string;
  last_updated: string;
}

const CandleChart = ({ ticker, range }: { ticker: string; range: '5d' | '1mo' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/chart/${ticker}?range=${range}`)
      .then(r => r.json())
      .then(data => { setChartData(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, range]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      timeScale: { timeVisible: true, borderVisible: false },
      rightPriceScale: { borderVisible: false },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#4ade80', downColor: '#f87171', borderVisible: false, wickUpColor: '#4ade80', wickDownColor: '#f87171'
    });

    try {
      const sortedData = [...chartData]
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);
      series.setData(sortedData);
      chart.timeScale().fitContent();
    } catch (err) {
      console.warn('Lightweight Charts Error:', err);
    }

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [chartData]);

  const { t } = useLanguage();
  if (loading) return <div className="w-full h-[250px] flex items-center justify-center text-slate-600 text-xs">{t('dash_loading_chart')}</div>;
  if (chartData.length === 0) return <div className="w-full h-[250px] flex items-center justify-center text-slate-600 text-xs">{t('dash_no_data')}</div>;
  return <div ref={chartContainerRef} className="w-full h-[250px] -mx-2 mt-4 mb-2" />;
};

const sentimentConfig: Record<Sentiment, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  bullish:  { label: 'BULLISH',  color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/20',  icon: TrendingUp },
  bearish:  { label: 'BEARISH',  color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/20',      icon: TrendingDown },
  neutral:  { label: 'NEUTRAL',  color: 'text-slate-300',  bg: 'bg-slate-500/10 border-slate-500/20',  icon: Minus },
};

const StockNewsCard: React.FC<{ item: StockNews }> = ({ item }) => {
  const [timeframe, setTimeframe] = useState<'1W' | '1M'>('1M');
  const { t } = useLanguage();
  const cfg = sentimentConfig[item.sentiment];
  const Icon = cfg.icon;
  const isPlaceholder = item.news_summary.startsWith('[');

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 h-full">
      {/* Header */}
        <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={getCompanyLogo(item.ticker)} alt={item.ticker} className="w-10 h-10 rounded-full bg-slate-800 object-cover shadow-sm" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.ticker}&background=312e81&color=fff&rounded=true&bold=true`; }} />
          <div>
            <p className="font-display font-bold text-white text-base">{item.ticker}</p>
            <p className="text-slate-400 text-xs">{item.name}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          <Icon size={11} />
          {cfg.label}
        </span>
      </div>

      {/* News summary */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('dash_news_summary')}</p>
        <p className={`text-sm leading-relaxed ${isPlaceholder ? 'text-slate-600 italic' : 'text-slate-300'}`}>
          {item.news_summary}
        </p>
      </div>

      {/* Analysis */}
      <div className="border-t border-white/5 pt-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('dash_agent_analysis')}</p>
        <p className={`text-sm leading-relaxed ${isPlaceholder ? 'text-slate-600 italic' : 'text-slate-400'}`}>
          {item.analysis}
        </p>
      </div>

      {/* DCF Valuation Chart */}
      <DCFChart ticker={item.ticker} />

      {/* Chart */}
      <div className="border-t border-white/5 pt-3 mt-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_performance')}</p>
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setTimeframe('1W')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${timeframe === '1W' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              1W
            </button>
            <button
              onClick={() => setTimeframe('1M')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${timeframe === '1M' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              1M
            </button>
          </div>
        </div>
        <CandleChart ticker={item.ticker} range={timeframe === '1W' ? '5d' : '1mo'} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 border-t border-white/5 pt-3 mt-1">
        <RefreshCw size={10} />
        <span>{t('dash_last_updated')} {isPlaceholder ? t('dash_pending_agent') : formatTimeAgo(new Date(item.last_updated))}</span>
      </div>
    </div>
  );
};

const StockNewsFeed: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const news = useFetch<StockNews[]>(`/stock-news?t=${refreshKey}`, []);
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg text-white">{t('dash_daily_analysis')}</h2>
        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
          <Circle size={7} className="fill-indigo-400 animate-pulse" /> {t('dash_ai_agent')}
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {news.map(item => <StockNewsCard key={item.ticker} item={item} />)}
      </div>
    </div>
  );
};

// ── Memory Links ──────────────────────────────────────────────────────────────

const memoryFiles = [
  { name: 'user_profile.md',      label: 'User Profile' },
  { name: 'project_context.md',   label: 'Project Context' },
  { name: 'feedback_responses.md',label: 'Feedback' },
  { name: 'reference_sources.md', label: 'References' },
];

const MemoryLinks: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="glass-panel rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
        <FileText size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">{t('dash_memory_files')}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {memoryFiles.map(f => (
          <button
            key={f.name}
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 text-xs font-medium transition-all duration-200"
          >
            {f.label}
            <ExternalLink size={10} className="opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-12">
      <Watchlist refreshKey={refreshKey} onAdd={() => setRefreshKey(k => k + 1)} />
      <StockNewsFeed refreshKey={refreshKey} />
      <MemoryLinks />
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, Briefcase, FileText, Activity, BarChart2 } from 'lucide-react';
import { ValuationBadge } from '../components/DCFChart';
import { motion, AnimatePresence } from 'framer-motion';
import TopMarketWidget from '../components/TopMarketWidget';
import { TV_LOGO_MAP } from '../utils/formatters';

const API_BASE = '/api';

const formatTimeAgo = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

function useFetch<T>(endpoint: string, initialData: T): T {
  const [data, setData] = useState<T>(initialData);
  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('Dashboard Fetch Error:', err));
  }, [endpoint]);
  return data;
}

interface WatchlistItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  last_updated: string;
}

interface StockNews {
  ticker: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  timestamp: string;
}

const Watchlist: React.FC<{ refreshKey: number; onAdd: () => void }> = ({ refreshKey, onAdd }) => {
  const watchlist = useFetch<WatchlistItem[]>(`/watchlist?t=${refreshKey}`, []);
  const [newTicker, setNewTicker] = useState('');

  const handleAdd = async () => {
    if (!newTicker) return;
    await fetch(`${API_BASE}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: newTicker.toUpperCase() }),
    });
    setNewTicker('');
    onAdd();
  };

  const handleRemove = async (ticker: string) => {
    await fetch(`${API_BASE}/watchlist/${ticker}`, { method: 'DELETE' });
    onAdd();
  };

  return (
    <div className="term-card">
      <div className="term-header">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-[var(--accent-blue)]" />
          <h2 className="micro-label text-[var(--text-secondary)]">Watchlist</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg overflow-hidden">
          <input
            className="bg-transparent border-none focus:ring-0 text-[10px] px-3 py-1.5 text-[var(--text-primary)] w-28 font-mono uppercase tracking-widest placeholder:text-[var(--text-muted)] focus:outline-none"
            placeholder="TICKER HINZUFÜGEN"
            value={newTicker}
            onChange={e => setNewTicker(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="bg-[var(--accent-blue)] text-white px-2 py-1.5 hover:brightness-110 transition-all"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {watchlist.map((item) => (
              <motion.div
                key={item.ticker}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="term-card term-card-hover group p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={TV_LOGO_MAP[item.ticker] || `https://financialmodelingprep.com/image-stock/${item.ticker}.png`}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={e => e.currentTarget.style.display = 'none'}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{item.ticker}</div>
                      <div className="micro-label text-[9px] truncate max-w-[100px]">{item.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.ticker)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="data-value text-base font-bold text-[var(--text-primary)]">${item.price.toFixed(2)}</div>
                    <div className={`flex items-center gap-1 text-[10px] font-mono mt-0.5 ${item.change >= 0 ? 'text-pos' : 'text-neg'}`}>
                      {item.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="h-8 w-20 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 50 }, { v: 60 }, { v: 55 }, { v: 70 }, { v: 65 }]}>
                        <Area type="monotone" dataKey="v" stroke={item.change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} fill="transparent" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-dim)]">
                  <ValuationBadge ticker={item.ticker} currentPrice={item.price} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StockNewsCard = ({ item }: { item: StockNews }) => {
  const sentimentStyles = {
    bullish: { label: 'Bullish', color: 'text-pos', icon: TrendingUp },
    bearish: { label: 'Bearish', color: 'text-neg', icon: TrendingDown },
    neutral: { label: 'Neutral', color: 'text-[var(--text-muted)]', icon: Minus },
  };
  const s = sentimentStyles[item.sentiment] || sentimentStyles.neutral;
  const Icon = s.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="term-card term-card-hover group flex flex-col h-full"
    >
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="micro-label bg-[rgba(76,154,255,0.1)] border border-[rgba(76,154,255,0.2)] px-2.5 py-1 rounded-lg text-[var(--accent-blue)]">{item.ticker}</span>
          <div className={`flex items-center gap-1.5 micro-label ${s.color}`}>
            <Icon size={11} /> {s.label} · {item.score}%
          </div>
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">{item.title}</h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3 flex-1">{item.summary}</p>
      </div>
      <div className="px-4 py-2.5 border-t border-[var(--border-dim)] flex items-center gap-2">
        <Activity size={10} className="text-[var(--accent-blue)]" />
        <span className="micro-label text-[9px]">KI-Analyse · {formatTimeAgo(new Date(item.timestamp))}</span>
      </div>
    </motion.div>
  );
};

const QuickNav: React.FC = () => {
  const navigate = useNavigate();
  const quickLinks = [
    { href: '/investment', label: 'Investment',   icon: Briefcase,  iconClass: 'icon-bg-blue',   desc: 'Portfolio & Holdings' },
    { href: '/earnings',   label: 'Quartalszahlen', icon: FileText, iconClass: 'icon-bg-purple',  desc: 'Reports & Analysis' },
    { href: '/markets',    label: 'Märkte',        icon: TrendingUp, iconClass: 'icon-bg-green',  desc: 'Macro & Sektoren' },
    { href: '/news',       label: 'News-Feed',     icon: BarChart2,  iconClass: 'icon-bg-yellow', desc: 'Neueste Schlagzeilen' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {quickLinks.map(link => {
        const Icon = link.icon;
        return (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className="term-card term-card-hover group p-4 flex items-center gap-3.5 text-left"
          >
            <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${link.iconClass}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{link.label}</div>
              <div className="text-[10px] mt-0.5 text-[var(--text-muted)]">{link.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const news = useFetch<StockNews[]>(`/stock-news?t=${refreshKey}`, []);

  return (
    <div className="space-y-5 w-full">
      <TopMarketWidget />
      <QuickNav />
      <Watchlist refreshKey={refreshKey} onAdd={() => setRefreshKey(k => k + 1)} />

      <div className="term-card">
        <div className="term-header">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-[var(--accent-blue)]" />
            <h2 className="micro-label text-[var(--text-secondary)]">Markt-Intelligence-Feed</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-[rgba(47,191,113,0.1)] border border-[rgba(47,191,113,0.2)] rounded-lg px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="micro-label text-[9px] text-[var(--accent-green)]">Live</span>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {news.map(item => <StockNewsCard key={item.ticker + item.timestamp} item={item} />)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
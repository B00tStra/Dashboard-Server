import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Globe, Activity, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface DebateEntry {
  analyst: 'Bull' | 'Bear' | 'Macro' | 'Technician';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  content: string;
}

interface MarketDebateData {
  last_updated: string;
  entries: DebateEntry[];
}

const analystConfig = {
  Bull: {
    icon: TrendingUp,
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    key: 'debate_bull'
  },
  Bear: {
    icon: TrendingDown,
    color: 'rose',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    key: 'debate_bear'
  },
  Macro: {
    icon: Globe,
    color: 'sky',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]',
    key: 'debate_macro'
  },
  Technician: {
    icon: Activity,
    color: 'indigo',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
    key: 'debate_tech'
  }
};

const MarketDebate: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<MarketDebateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/market-debate');
        if (!res.ok) throw new Error('Failed to fetch debate data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">{t('settings_loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="glass-panel p-8 border-rose-500/20 flex flex-col items-center text-center gap-4">
          <AlertCircle size={48} className="text-rose-500" />
          <h2 className="text-xl font-bold text-white">Error</h2>
          <p className="text-slate-400 max-w-md">{error || 'No data found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight">
            {t('debate_title')}
          </h1>
          <p className="text-slate-400 font-medium lg:text-lg">
            {t('debate_subtitle')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-400"
        >
          <Clock size={14} className="text-indigo-400" />
          <span>{t('debate_last_updated')}</span>
          <span className="text-slate-200">{new Date(data.last_updated).toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Grid of Analyst Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.entries.map((entry, idx) => {
          const config = analystConfig[entry.analyst] || analystConfig.Bull;
          const Icon = config.icon;

          return (
            <motion.div
              key={entry.analyst}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative glass-panel p-6 border ${config.border} ${config.glow} transition-all duration-300 hover:bg-white/[0.03] overflow-hidden`}
            >
              {/* Background gradient hint */}
              <div className={`absolute -right-20 -top-20 w-40 h-40 ${config.bg} blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${config.bg} ${config.text} border ${config.border} shadow-inner`}>
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {t(config.key)}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                          entry.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                          entry.sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-sky-500/20 text-sky-400'
                        }`}>
                          {entry.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert prose-slate max-w-none">
                  <div className="text-slate-300 leading-relaxed font-medium text-sm lg:text-base whitespace-pre-line">
                    <ReactMarkdown>{entry.content}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Decorative accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${config.color}-500/20 to-transparent`} />
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="glass-panel p-4 bg-indigo-500/5 border-indigo-500/10 flex items-center gap-3 text-xs text-slate-500"
      >
        <Activity size={14} className="text-indigo-400" />
        <p>
          Analyses are generated by autonomous AI agents. For informational purposes only. Not financial advice.
          The agents synthesize market data, news flows, and technical patterns in real-time.
        </p>
      </motion.div>
    </div>
  );
};

export default MarketDebate;

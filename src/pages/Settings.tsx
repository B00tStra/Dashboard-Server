import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Settings as SettingsIcon, Terminal, Clock, Bot, Brain,
  Coins, FolderOpen, FileText, ChevronRight, ChevronDown,
  Trash2, Plus, Search,
  AlertCircle, CheckCircle, RefreshCw, Cpu,
  Folder, Edit3, Save, X, ToggleLeft, ToggleRight,
  Shield, ShieldAlert,
} from 'lucide-react';
import { VscJson, VscMarkdown, VscTerminalPowershell, VscFileMedia, VscFilePdf, VscFileCode, VscSettingsGear, VscFile, VscDatabase } from 'react-icons/vsc';
import { SiJavascript, SiTypescript, SiHtml5, SiCss, SiPython, SiReact } from 'react-icons/si';

// ── Syntax highlighting helpers ───────────────────────────────────────────────

const extLangMap: Record<string, string> = {
  '.js': 'javascript', '.jsx': 'jsx',
  '.ts': 'typescript', '.tsx': 'tsx',
  '.json': 'json',
  '.md': 'markdown',
  '.html': 'html', '.htm': 'html',
  '.css': 'css', '.scss': 'scss',
  '.yaml': 'yaml', '.yml': 'yaml',
  '.toml': 'toml',
  '.sh': 'bash', '.env': 'bash',
  '.py': 'python',
  '.sql': 'sql',
  '.xml': 'xml',
};

function detectLang(filename: string): string {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return extLangMap[ext] ?? 'plaintext';
}

// File icon map — VS Code Material Icon Theme inspired colors
type IconComponent = React.ElementType;
interface FileIconCfg { icon: IconComponent; color: string; }

const fileIconMap: Record<string, FileIconCfg> = {
  '.ts':   { icon: SiTypescript,  color: '#3178C6' },
  '.tsx':  { icon: SiReact,       color: '#61DAFB' },
  '.js':   { icon: SiJavascript,  color: '#F7DF1E' },
  '.jsx':  { icon: SiReact,       color: '#61DAFB' },
  '.json': { icon: VscJson,       color: '#CBCB41' },
  '.md':   { icon: VscMarkdown,   color: '#519ABA' },
  '.html': { icon: SiHtml5,       color: '#E44D26' },
  '.htm':  { icon: SiHtml5,       color: '#E44D26' },
  '.css':  { icon: SiCss,         color: '#1572B6' },
  '.scss': { icon: SiCss,         color: '#CD6799' },
  '.py':   { icon: SiPython,      color: '#3572A5' },
  '.yaml': { icon: VscSettingsGear, color: '#CB171E' },
  '.yml':  { icon: VscSettingsGear, color: '#CB171E' },
  '.sh':   { icon: VscTerminalPowershell, color: '#4EAA25' },
  '.env':  { icon: VscSettingsGear, color: '#ECD53F' },
  '.toml': { icon: VscSettingsGear, color: '#9C4121' },
  '.xml':  { icon: VscFileCode,   color: '#E37933' },
  '.sql':  { icon: VscDatabase,   color: '#C78AF0' },
  '.txt':  { icon: VscFile,       color: '#8B8B8B' },
  '.log':  { icon: VscFile,       color: '#8B8B8B' },
  '.csv':  { icon: VscDatabase,   color: '#89E051' },
  '.png':  { icon: VscFileMedia,  color: '#A074C4' },
  '.jpg':  { icon: VscFileMedia,  color: '#A074C4' },
  '.jpeg': { icon: VscFileMedia,  color: '#A074C4' },
  '.svg':  { icon: VscFileMedia,  color: '#A074C4' },
  '.gif':  { icon: VscFileMedia,  color: '#A074C4' },
  '.pdf':  { icon: VscFilePdf,    color: '#F05133' },
};

function getFileIcon(filename: string): FileIconCfg {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return fileIconMap[ext] ?? { icon: VscFile, color: '#6B7280' };
}

const FileIconComp = ({ name, size = 14 }: { name: string; size?: number }) => {
  const { icon: Icon, color } = getFileIcon(name);
  return <Icon size={size} style={{ color }} className="flex-shrink-0" />;
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'config' | 'cron' | 'agents' | 'soul' | 'tokens' | 'reporting' | 'logs';

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockCronJobs = [
  { id: '1', name: 'news-scraper', schedule: '*/15 * * * *', description: 'Scrape financial news sources', status: 'active', lastRun: '2 min ago', nextRun: '13 min' },
  { id: '2', name: 'earnings-sync', schedule: '0 6 * * 1-5', description: 'Sync earnings calendar from API', status: 'active', lastRun: '8h ago', nextRun: '16h' },
  { id: '3', name: 'sentiment-analysis', schedule: '*/30 * * * *', description: 'Run sentiment scoring on new articles', status: 'active', lastRun: '12 min ago', nextRun: '18 min' },
  { id: '4', name: 'portfolio-snapshot', schedule: '0 16 * * 1-5', description: 'Save EOD portfolio snapshot', status: 'paused', lastRun: '1d ago', nextRun: 'paused' },
  { id: '5', name: 'memory-cleanup', schedule: '0 2 * * 0', description: 'Archive old memory entries', status: 'active', lastRun: '3d ago', nextRun: '4d' },
];

const mockAgents = [
  { id: '1', name: 'SentimentBot', description: 'NLP sentiment analysis on news & filings', status: 'running', model: 'claude-sonnet-4-6', tokensToday: 124800, tasks: 47 },
  { id: '2', name: 'NewsParser', description: 'Ingests and classifies financial news', status: 'running', model: 'claude-haiku-4-5', tokensToday: 58200, tasks: 183 },
  { id: '3', name: 'EarningsAgent', description: 'Beat/miss detection and EPS analysis', status: 'idle', model: 'claude-sonnet-4-6', tokensToday: 31400, tasks: 12 },
  { id: '4', name: 'RiskAgent', description: 'Volatility and risk threshold monitoring', status: 'error', model: 'claude-opus-4-6', tokensToday: 9800, tasks: 3 },
  { id: '5', name: 'PriceBot', description: 'Price target aggregation and tracking', status: 'idle', model: 'claude-haiku-4-5', tokensToday: 14100, tasks: 28 },
];

const mockConfigFiles = [
  {
    name: 'agents', type: 'folder', children: [
      { name: 'sentiment-bot.json', type: 'file', content: '{\n  "name": "SentimentBot",\n  "model": "claude-sonnet-4-6",\n  "temperature": 0.3,\n  "maxTokens": 4096,\n  "systemPrompt": "You are a financial sentiment analyst...",\n  "tools": ["search", "scrape", "memory"]\n}' },
      { name: 'news-parser.json', type: 'file', content: '{\n  "name": "NewsParser",\n  "model": "claude-haiku-4-5",\n  "temperature": 0.1,\n  "maxTokens": 2048,\n  "sources": ["reuters", "bloomberg", "wsj"]\n}' },
    ]
  },
  {
    name: 'memory', type: 'folder', children: [
      { name: 'user_profile.md', type: 'file', content: '---\nname: User Profile\ntype: user\n---\n\nUser is a quantitative trader focused on earnings plays and sentiment analysis.\nPrefers concise, data-driven responses.' },
      { name: 'project_context.md', type: 'file', content: '---\nname: Project Context\ntype: project\n---\n\nBuilding an AI-powered stock market dashboard.\nFocus on earnings beat/miss tracking and sentiment scoring.' },
    ]
  },
  { name: 'config.json', type: 'file', content: '{\n  "apiEndpoint": "https://api.example.com",\n  "refreshInterval": 30,\n  "maxAgents": 10,\n  "logLevel": "info",\n  "features": {\n    "liveNews": true,\n    "sentimentScoring": true,\n    "earningsAlerts": true\n  }\n}' },
  { name: 'soul.md', type: 'file', content: '---\nname: Agent Soul\ntype: soul\n---\n\n# Core Identity\nYou are a professional financial intelligence assistant.\n\n# Values\n- Accuracy over speed\n- Data-driven insights\n- Transparent reasoning\n\n# Communication Style\nConcise, professional, numbers-first.' },
];

const mockAgentLogs = [
  { id: 1, ts: '03:14:22', agent: 'SentimentBot', level: 'info', msg: 'Initialized with 847 articles in queue' },
  { id: 2, ts: '03:14:23', agent: 'NewsParser', level: 'info', msg: 'Connected to Reuters feed' },
  { id: 3, ts: '03:14:25', agent: 'SentimentBot', level: 'info', msg: 'Processing AAPL earnings transcript — 12,400 tokens' },
  { id: 4, ts: '03:14:31', agent: 'SentimentBot', level: 'success', msg: 'AAPL sentiment: +72 (bullish) — confidence 0.91' },
  { id: 5, ts: '03:14:44', agent: 'NewsParser', level: 'info', msg: 'Ingested 14 new articles [NVDA:5, MSFT:3, META:6]' },
  { id: 6, ts: '03:15:02', agent: 'RiskAgent', level: 'warning', msg: 'TSLA volatility index crossed 2.8σ threshold' },
  { id: 7, ts: '03:15:03', agent: 'RiskAgent', level: 'error', msg: 'API rate limit hit — backing off 60s' },
  { id: 8, ts: '03:15:12', agent: 'EarningsAgent', level: 'info', msg: 'MSFT Q4 beat detection: EPS +5.4% vs estimate' },
  { id: 9, ts: '03:15:18', agent: 'PriceBot', level: 'info', msg: 'Updated 7 price targets from analyst notes' },
  { id: 10, ts: '03:15:33', agent: 'SentimentBot', level: 'info', msg: 'Processing NVDA data center report — 8,200 tokens' },
  { id: 11, ts: '03:15:41', agent: 'SentimentBot', level: 'success', msg: 'NVDA sentiment: +91 (strongly bullish) — confidence 0.97' },
  { id: 12, ts: '03:16:04', agent: 'NewsParser', level: 'warning', msg: 'Duplicate article detected — skipping ID #8842' },
  { id: 13, ts: '03:16:22', agent: 'EarningsAgent', level: 'info', msg: 'Queuing AMZN AWS revenue analysis' },
  { id: 14, ts: '03:16:45', agent: 'SentimentBot', level: 'info', msg: 'Batch complete: 23 articles processed, avg score +34' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const logLevelPrefix: Record<string, string> = {
  info: '[INFO]',
  success: '[OK]  ',
  warning: '[WARN]',
  error: '[ERR] ',
};

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Hub Overview',    icon: SettingsIcon },
  { id: 'config',    label: 'Config Files',    icon: FileText },
  { id: 'cron',      label: 'Cron Jobs',       icon: Clock },
  { id: 'agents',    label: 'Agents',          icon: Bot },
  { id: 'soul',      label: 'Soul',            icon: Brain },
  { id: 'tokens',    label: 'Token Usage',     icon: Coins },
  { id: 'reporting', label: 'Explorer',        icon: FolderOpen },
  { id: 'logs',      label: 'Agent Logs',      icon: Terminal },
];

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview({ setTab }: { setTab: (t: Tab) => void }) {
  const { t } = useLanguage();
  const running = mockAgents.filter(a => a.status === 'running').length;
  const totalTokens = mockAgents.reduce((s, a) => s + a.tokensToday, 0);
  const activeCrons = mockCronJobs.filter(j => j.status === 'active').length;

  const cards = [
    { 
      icon: Bot, 
      label: t('settings_active_agents'), 
      value: `${running}/${mockAgents.length}`, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10', 
      border: 'border-indigo-500/20',
      tab: 'agents' as Tab,
      desc: 'Active neural instances'
    },
    { 
      icon: Clock, 
      label: t('settings_active_crons'), 
      value: `${activeCrons}/${mockCronJobs.length}`, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/10', 
      border: 'border-cyan-500/20',
      tab: 'cron' as Tab,
      desc: 'Scheduled automation tasks'
    },
    { 
      icon: Coins, 
      label: t('settings_tokens_today'), 
      value: (totalTokens / 1000).toFixed(0) + 'K', 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20',
      tab: 'tokens' as Tab,
      desc: '24h context consumption'
    },
    { 
      icon: ShieldAlert, 
      label: t('settings_errors'), 
      value: mockAgents.filter(a => a.status === 'error').length.toString(), 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20',
      tab: 'logs' as Tab,
      desc: 'Critical system alerts'
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Dashboard <span className="text-indigo-400">Hub</span></h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">{t('settings_overview_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nexus Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            onClick={() => setTab(c.tab)}
            className={`glass-panel rounded-3xl p-6 text-left hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden border ${c.border} hover:border-white/20`}
          >
            {/* Background Glow */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-10 transition-opacity group-hover:opacity-30 ${c.bg}`} />
            
            <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <c.icon size={22} className={c.color} />
            </div>
            <p className="text-3xl font-black text-white tracking-tighter tabular-nums mb-1">{c.value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{c.label}</p>
            <div className="h-px w-8 bg-white/10 group-hover:w-full transition-all duration-700 mb-3" />
            <p className="text-[9px] font-bold text-slate-500 uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">{c.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick status Nodes */}
      <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Cpu size={14} className="text-indigo-400" />
            Active Neural Nodes
            </h3>
            <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {mockAgents.map((a, i) => (
            <motion.div 
                key={a.id} 
                initial={{ opacity: 0, x: -16 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 + 0.4 }}
                className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group cursor-default"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 relative ${
                a.status === 'running' ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.4)]' : 
                a.status === 'error' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 
                'bg-slate-600'
              }`}>
                {a.status === 'running' && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate uppercase tracking-tight">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{a.model}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-[8px] font-bold text-indigo-400/60 uppercase">{a.tasks} operations today</span>
                </div>
              </div>
              <div className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${
                a.status === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                a.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                'bg-slate-800 text-slate-500 border-white/5'
              }`}>
                {a.status.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Config Files ──────────────────────────────────────────────────────────────

function ConfigFileTree({ nodes, depth = 0, onSelect, selectedPath }: {
  nodes: any[];
  depth?: number;
  onSelect: (node: { name: string; content: string; path?: string }) => void;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ agents: true, memory: true });
  
  return (
    <div className="space-y-0.5">
      {nodes.map(node => (
        <div key={node.name}>
          {node.type === 'folder' ? (
            <>
              <button
                onClick={() => setOpen(o => ({ ...o, [node.name]: !o[node.name] }))}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-tight transition-all group"
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
              >
                <div className="w-4 flex items-center justify-center">
                  <motion.div animate={{ rotate: open[node.name] ? 0 : -90 }}>
                    <ChevronDown size={10} className="text-slate-600 group-hover:text-slate-400" />
                  </motion.div>
                </div>
                <Folder size={13} className="text-indigo-500/60 group-hover:text-indigo-400 transition-colors" />
                {node.name}
              </button>
              <AnimatePresence>
                {open[node.name] && node.children && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ConfigFileTree nodes={node.children} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <button
              onClick={() => node.content && onSelect({ name: node.name, content: node.content, path: node.path })}
              className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all group ${
                selectedPath === node.path || selectedPath === node.name ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'hover:bg-white/5 text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
              style={{ paddingLeft: `${depth * 12 + 28}px` }}
            >
              <FileIconComp name={node.name} size={13} />
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfigTab() {
  const { t } = useLanguage();
  const [tree, setTree] = useState(mockConfigFiles);
  const [selected, setSelected] = useState<{ name: string; content: string; path?: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/config-files').then(r => r.json()).then(d => {
        setTree(d);
        setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const startEdit = () => { if (!selected) return; setEditContent(selected.content); setEditing(true); };
  const saveEdit = async () => {
    if (!selected?.path) return;
    await fetch('/api/fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selected.path, content: editContent }) });
    setSelected(s => s ? { ...s, content: editContent } : null);
    setEditing(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
      {/* Sidebar Tree */}
      <div className="w-full lg:w-64 glass-panel rounded-[2rem] p-5 flex flex-col overflow-hidden border border-white/5 border-r-white/10 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="px-3 mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Config</h3>
            {loading && <RefreshCw size={10} className="text-indigo-400 animate-spin" />}
        </div>
        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
            <ConfigFileTree nodes={tree} onSelect={setSelected} selectedPath={selected?.path || selected?.name} />
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 glass-panel rounded-[2rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        {selected ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col relative z-10"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                    <FileIconComp name={selected.name} size={16} />
                </div>
                <div>
                    <span className="text-sm font-bold text-white tracking-tight">{selected.name}</span>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Application Context Node</p>
                </div>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                      <Save size={12} /> {t('save')}
                    </button>
                    <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95">
                      <X size={12} /> {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 hover:border-indigo-500/30">
                    <Edit3 size={12} /> {t('edit')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#0d1117]/80 custom-scrollbar">
              {editing ? (
                <textarea
                  className="w-full h-full p-8 bg-transparent text-slate-200 text-xs font-mono resize-none focus:outline-none leading-relaxed selection:bg-indigo-500/30"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  spellCheck={false}
                  autoFocus
                />
              ) : (
                <div className="p-2">
                  <SyntaxHighlighter
                    language={detectLang(selected.name)}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      borderRadius: '1.2rem',
                      fontSize: '0.75rem',
                      lineHeight: '1.7',
                      background: 'transparent',
                      minHeight: '100%',
                      padding: '1.5rem',
                    }}
                    lineNumberStyle={{ color: '#334155', minWidth: '3em', paddingRight: '1.5em', borderRight: '1px solid rgba(255,255,255,0.03)', marginRight: '1.5em' }}
                  >
                    {selected.content}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 relative z-10">
            <div className="text-center p-12">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FileText size={32} className="opacity-20 text-indigo-400" />
              </div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t('settings_select_file')}</h4>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">Access system configuration matrix</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cron Jobs ─────────────────────────────────────────────────────────────────

// Helper: Parse cron expression to human-readable description
function parseCronSchedule(cron: string): string {
  // Handle "cron 30 8 * * * @ Europe/Berlin" format
  let cleanCron = cron.replace('cron ', '');
  const tzParts = cleanCron.split(' @ ');
  const schedule = tzParts[0];
  const tz = tzParts[1] ? tzParts[1].replace('...', '').trim() : '';

  const parts = schedule.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  let human = '';

  // Every X minutes
  if (minute.startsWith('*/')) {
    const interval = minute.substring(2);
    human = `Alle ${interval} Min.`;
  }
  // Daily at specific time
  else if (hour !== '*' && minute !== '*' && dayOfMonth === '*' && month === '*') {
    const weekdayPart = dayOfWeek === '*' ? '' : dayOfWeek === '1-5' ? ' (Mo-Fr)' : ` (${dayOfWeek})`;
    human = `Täglich um ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}${weekdayPart}`;
  }
  // Weekdays only
  else if (dayOfWeek === '1-5' && hour !== '*' && minute !== '*') {
    human = `Wochentags um ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  // Weekly on specific day
  else if (dayOfWeek !== '*' && dayOfWeek !== '1-5') {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
    human = `Jeden ${dayName} um ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  // Hourly
  else if (minute !== '*' && hour === '*') {
    human = `Std. zur Minute ${minute}`;
  } else {
    human = schedule;
  }

  return tz ? `${human} (${tz})` : human;
}

function CronTab() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState(mockCronJobs);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => { 
    fetch('/api/cron').then(r => r.json()).then(d => { 
      if (Array.isArray(d) && d.length) setJobs(d); 
    }).catch(() => {}); 
  }, []);

  const toggle = (id: string) => setJobs(j => j.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x));
  const remove = (id: string) => setJobs(j => j.filter(x => x.id !== id));
  
  const runNow = async (id: string) => {
    setRefreshing(id);
    // Simulate execution
    setTimeout(() => setRefreshing(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Cron <span className="text-cyan-400">Scheduler</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {jobs.filter(j => j.status === 'active').length} Active Nodes
            </span>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              {jobs.length} Total Registered Channels
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group">
          <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" /> 
          {t('settings_new_job')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job, i) => {
          const humanSchedule = parseCronSchedule(job.schedule);
          const isError = job.status === 'error';
          const isActive = job.status === 'active';
          
          return (
            <motion.div 
              key={job.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05, duration: 0.6 }}
              className={`
                group glass-panel rounded-[2rem] p-6 border transition-all duration-500 relative overflow-hidden
                ${isActive ? 'border-white/10 hover:border-indigo-500/40' : 'border-white/5 opacity-70 grayscale-[0.5]'}
                hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1
              `}
            >
              {/* Animated Status Glow */}
              {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />}
              
              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full relative ${
                      isActive ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 
                      isError ? 'bg-rose-500' : 'bg-slate-700'
                    }`}>
                        {isActive && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />}
                    </div>
                    <h3 className="font-black text-white text-lg tracking-tight uppercase truncate group-hover:text-indigo-300 transition-colors">{job.name}</h3>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2 min-h-[32px] group-hover:text-slate-400 transition-colors">{job.description}</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => runNow(job.id)} 
                    disabled={refreshing === job.id} 
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all active:scale-90 border border-white/5"
                  >
                    <RefreshCw size={14} strokeWidth={2.5} className={refreshing === job.id ? 'animate-spin text-indigo-400' : 'group-hover:rotate-180 transition-transform duration-700'} />
                  </button>
                  <button 
                    onClick={() => toggle(job.id)} 
                    className={`p-1.5 transition-all active:scale-90 ${isActive ? 'text-indigo-400 hover:opacity-80' : 'text-slate-700 hover:text-slate-500'}`}
                  >
                    {isActive
                      ? <ToggleRight size={32} />
                      : <ToggleLeft size={32} />}
                  </button>
                  <button onClick={() => remove(job.id)} className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-all border border-white/5">
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 group-hover:bg-black/40 transition-colors">
                  <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                    <Clock size={10} className="text-indigo-500/50" /> Schedule
                  </div>
                  <span className="text-indigo-400 text-xs font-black truncate tracking-tight">{humanSchedule}</span>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 group-hover:bg-black/40 transition-colors">
                  <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Last Cycle</span>
                  <span className="text-slate-300 text-xs font-black truncate tracking-tight tabular-nums">{job.lastRun || '-'}</span>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-1.5 group-hover:bg-black/40 transition-colors">
                  <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Next Arrival</span>
                  <span className={`text-xs font-black truncate tracking-tight tabular-nums ${isActive ? 'text-emerald-400' : 'text-slate-600 underline'}`}>
                    {isActive ? (job.nextRun || 'Calculating...') : 'Deactivated'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Agents ────────────────────────────────────────────────────────────────────

function AgentsTab() {
  const { t } = useLanguage();
  const [agents, setAgents] = useState(mockAgents);
  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length) {
        setAgents(d.map((item, idx) => {
          let tokensToday = 0;
          if (item.tokens) {
            const match = item.tokens.match(/^([\d.]+)k/);
            if (match) tokensToday = parseFloat(match[1]) * 1000;
          }
          return {
            id: item.id || String(idx + 1),
            name: item.agent || `Agent ${idx + 1}`,
            description: item.action || 'Live agent activity',
            status: item.status === 'running' ? 'running' : item.status === 'done' ? 'idle' : 'error',
            model: item.ticker || '[live]',
            tokensToday: tokensToday,
            tasks: 1,
            rawTokens: item.tokens || '',
          };
        }));
      }
    }).catch(() => {});
  }, []);
  const restart = (id: string) => setAgents(a => a.map(x => x.id === id ? { ...x, status: 'running' } : x));

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Neural <span className="text-indigo-400">Nodes</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest leading-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {agents.filter(a => a.status === 'running').length} Active Instances
            </span>
            <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
              {agents.filter(a => a.status === 'error').length} Critical Faults
            </span>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden lg:block mb-3" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {agents.map((agent, i) => {
          const isError = agent.status === 'error';
          const isRunning = agent.status === 'running';

          return (
            <motion.div 
              key={agent.id} 
              initial={{ opacity: 0, scale: 0.98, y: 12 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className={`
                glass-panel rounded-[2.5rem] p-8 border transition-all duration-500 relative overflow-hidden group
                ${isRunning ? 'border-white/10 bg-indigo-500/[0.02]' : 'border-white/5 grayscale-[0.3]'}
                hover:border-white/20 hover:shadow-2xl
              `}
            >
              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-96 h-full bg-gradient-to-l pointer-events-none transition-opacity duration-700 ${
                isRunning ? 'from-indigo-500/10 opacity-100' : 'from-slate-500/5 opacity-50'
              }`} />

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                
                <div className="flex-1 flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${
                       isRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 
                       isError ? 'bg-rose-500/10 border-rose-500/30' : 
                       'bg-slate-800 border-white/5'
                    }`}>
                      <Bot size={28} className={isRunning ? 'text-indigo-400' : isError ? 'text-rose-400' : 'text-slate-500'} />
                    </div>
                    {isRunning && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0f172a] shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-white text-xl tracking-tight uppercase group-hover:text-indigo-300 transition-colors">{agent.name}</h3>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${
                        isRunning ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        isError ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        'bg-slate-800 text-slate-500 border-white/5'
                      }`}>
                        {agent.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tighter group-hover:text-slate-400 transition-colors">
                      {agent.description}
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-auto grid grid-cols-3 gap-6 lg:gap-12 py-6 lg:py-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-12">
                   <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Architecture</p>
                      <code className="text-xs font-black text-indigo-400/80 tracking-tighter">{agent.model}</code>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Context</p>
                      <p className="text-sm font-black text-white tabular-nums tracking-tighter">{(agent.tokensToday / 1000).toFixed(1)}k</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Ops</p>
                      <p className="text-sm font-black text-white tabular-nums tracking-tighter">{agent.tasks}</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0">
                   {isError && (
                    <button 
                        onClick={() => restart(agent.id)} 
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                      <RefreshCw size={12} strokeWidth={3} /> {t('settings_restart')}
                    </button>
                   )}
                   <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all group/btn">
                      Monitor <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Soul ──────────────────────────────────────────────────────────────────────

const defaultSoul = `# Core Identity
You are a professional financial intelligence assistant embedded in the AI Hub dashboard.

# Values
- Accuracy over speed
- Data-driven, numbers-first insights
- Transparent reasoning — show your work
- Concise, no filler words

# Communication Style
Professional but approachable. Use markdown formatting.
Lead with the key finding, then supporting data.

# Capabilities
- Earnings analysis and beat/miss detection
- Sentiment scoring from news and filings
- Portfolio risk assessment
- Market trend identification

# Constraints
- Never hallucinate financial data
- Always cite the source or flag when data is unavailable
- Flag uncertainty explicitly`;

function SoulTab() {
  const { t } = useLanguage();
  const soulPath = '/home/fabio/dashboard/data/SOUL.md';
  const [content, setContent] = useState(defaultSoul);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => { 
    fetch(`/api/fs/read?path=${encodeURIComponent(soulPath)}`)
      .then(r => r.json())
      .then(d => { if (d.content) setContent(d.content); })
      .catch(() => {}); 
  }, []);

  const save = async () => { 
    await fetch('/api/fs/write', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ path: soulPath, content }) 
    }); 
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };

  return (
    <div className="space-y-8 h-[calc(100vh-180px)] flex flex-col max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 flex-shrink-0 px-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/5">
                <Brain size={24} className="text-purple-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                Core <span className="text-purple-400">Identity</span>
            </h2>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">{t('settings_soul_subtitle')}</p>
        </div>
        
        <button 
            onClick={save} 
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 border ${
                saved 
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/20'
            }`}
        >
          {saved ? <><CheckCircle size={14} strokeWidth={3} /> {t('settings_soul_saved')}</> : <><Save size={14} strokeWidth={3} /> {t('settings_soul_save')}</>}
        </button>
      </div>

      <div className="glass-panel rounded-[2.5rem] flex-1 overflow-hidden flex flex-col border border-white/10 shadow-3xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="px-8 py-4 border-b border-white/5 bg-black/30 backdrop-blur-xl flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
             </div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SOUL_PROTOCOL.md</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Read / Write Access</span>
          </div>
        </div>

        <textarea
          className="flex-1 bg-transparent text-slate-200 text-sm font-mono p-10 resize-none focus:outline-none leading-relaxed selection:bg-purple-500/30 custom-scrollbar relative z-10"
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck={false}
          autoFocus
        />
        
        <div className="px-8 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between relative z-10">
            <span className="text-[9px] font-bold text-slate-600 uppercase">Markdown Content Architecture</span>
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[9px] font-black text-purple-400/60 uppercase tracking-widest">Identity Sync Active</span>
            </div>
        </div>
      </div>
    </div>
  );
}

import TokenUsageNexus from '../components/TokenUsageNexus';

function TokensTab() {
  return (
    <div className="space-y-5">
      <TokenUsageNexus isTab={true} />
    </div>
  );
}


// ── Reporting (File Browser) ──────────────────────────────────────────────────


// ── Real File Explorer ────────────────────────────────────────────────────────

interface FsEntry {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size: number | null;
  modified: string | null;
  ext: string | null;
}

const TEXT_EXTS = ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.csv', '.log', '.yaml', '.yml', '.env', '.toml', '.html', '.css'];

function formatBytes(b: number | null): string {
  if (b === null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function ReportingTab() {
  const { t } = useLanguage();
  const [currentPath, setCurrentPath] = useState('/home/fabio/dashboard');
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drives, setDrives] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string; name: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<string[]>(['/home/fabio/dashboard']);

  const loadDir = async (p: string, addHistory = true) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setEditing(false);
    try {
      const res = await fetch(`/api/fs/list?path=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEntries(data.entries);
      setCurrentPath(p);
      if (addHistory) setHistory(h => [...h.slice(-19), p]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
    setLoading(false);
  };

  const loadFile = async (entry: FsEntry) => {
    if (!entry.ext || !TEXT_EXTS.includes(entry.ext)) {
      setSelectedFile({ path: entry.path, content: '[Binary or unsupported file type]', name: entry.name });
      return;
    }
    try {
      const res = await fetch(`/api/fs/read?path=${encodeURIComponent(entry.path)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelectedFile({ path: entry.path, content: data.content, name: entry.name });
      setEditing(false);
    } catch (e: unknown) {
      setSelectedFile({ path: entry.path, content: `Error: ${e instanceof Error ? e.message : 'Unknown'}`, name: entry.name });
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    try {
      await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content: editContent }),
      });
      setSelectedFile(s => s ? { ...s, content: editContent } : null);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const goUp = async () => {
    const res = await fetch(`/api/fs/parent?path=${encodeURIComponent(currentPath)}`);
    const data = await res.json();
    if (data.parent) loadDir(data.parent);
  };

  useEffect(() => { loadDir(currentPath, false); }, []);
  useEffect(() => {
    fetch('/api/fs/drives').then(r => r.json()).then(d => setDrives(d.drives)).catch(() => {});
  }, []);

  const filtered = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const quickLinks = [
    { label: 'Dashboard', path: '/home/fabio/dashboard', icon: Folder },
    { label: 'Data', path: '/home/fabio/dashboard/data', icon: VscDatabase },
    { label: 'Secrets', path: '/home/fabio/dashboard/data/secrets', icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6 h-[85vh] lg:h-[calc(100vh-110px)] min-h-[700px] lg:min-h-0 max-w-7xl mx-auto w-full">
      {/* Header & Path Bar */}
      <div className="space-y-4 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700 px-1">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Resource <span className="text-indigo-400">Explorer</span></h2>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Matrix Access Protocol</span>
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <button onClick={goUp} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90" title="Go up">
                <ChevronRight size={14} className="rotate-180" strokeWidth={3} />
                </button>
                <button onClick={() => loadDir(history[history.length - 2] || currentPath)} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90" title="Back">
                <ChevronDown size={14} className="rotate-90" strokeWidth={3} />
                </button>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); loadDir(currentPath); }} className="flex-1 flex relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <FolderOpen size={14} />
                </div>
                <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-[11px] text-slate-200 font-bold tracking-tight focus:outline-none focus:border-indigo-500/40 focus:bg-white/10 transition-all placeholder-slate-600"
                    value={currentPath}
                    onChange={e => setCurrentPath(e.target.value)}
                />
            </form>

            <button onClick={() => loadDir(currentPath)} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-700">
                <RefreshCw size={14} strokeWidth={3} />
            </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
            {quickLinks.map(l => (
            <button key={l.label} onClick={() => loadDir(l.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/80 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/10 hover:text-indigo-400 transition-all">
                <l.icon size={12} /> {l.label}
            </button>
            ))}
            {drives.map(d => (
            <button key={d} onClick={() => loadDir(d)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                <VscDatabase size={12} /> {d}
            </button>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-700 px-1">
        
        {/* File Browser Panel */}
        <div className="flex flex-col flex-1 min-w-0 glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/20">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[11px] text-white font-bold placeholder-slate-600 focus:outline-none focus:border-indigo-500/30 transition-all"
                placeholder={t('settings_filter')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 ml-4">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{filtered.length} Objects Located</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                <RefreshCw size={24} className="animate-spin mb-4 text-indigo-500/40" />
                <p className="text-[10px] font-black uppercase tracking-[.2em]">Synchronizing Matrix...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle size={32} className="text-rose-500 mx-auto mb-4 opacity-50" />
                <p className="text-rose-400 text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filtered.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                        <FolderOpen size={48} className="mx-auto mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">Zone Empty</p>
                    </div>
                )}
                {filtered.map((entry, idx) => (
                  <motion.div
                    key={entry.path}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all group border ${
                      selectedFile?.path === entry.path 
                      ? 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5' 
                      : 'hover:bg-white/5 border-transparent'
                    }`}
                    onClick={() => entry.type === 'folder' ? loadDir(entry.path) : loadFile(entry)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        entry.type === 'folder' ? 'bg-indigo-500/10' : 'bg-white/5'
                    }`}>
                        {entry.type === 'folder'
                        ? <Folder size={14} className="text-indigo-400" />
                        : <FileIconComp name={entry.name} size={14} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <span className={`text-[11px] block truncate transition-colors ${
                            entry.type === 'folder' ? 'text-white font-black uppercase tracking-tight' : 'text-slate-400 font-bold group-hover:text-white'
                        }`}>
                        {entry.name}
                        </span>
                        {entry.modified && (
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tight">{entry.modified}</span>
                        )}
                    </div>

                    <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter tabular-nums group-hover:text-slate-500 transition-colors">
                            {formatBytes(entry.size)}
                        </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="px-8 py-3 bg-black/40 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-between">
            <div className="flex gap-4">
                <span>{filtered.filter(e => e.type === 'folder').length} Folders</span>
                <span>{filtered.filter(e => e.type === 'file').length} Records</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                <span>Sector Secured</span>
            </div>
          </div>
        </div>

        {/* Editor Side Panel */}
        <AnimatePresence>
            {selectedFile && (
            <motion.div
                initial={{ opacity: 0, width: 0, x: 20 }}
                animate={{ opacity: 1, width: '65%', x: 0 }}
                exit={{ opacity: 0, width: 0, x: 20 }}
                className="flex-shrink-0 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 shadow-3xl bg-black/40 relative"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5 flex-shrink-0">
                        <FileIconComp name={selectedFile.name} size={14} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[11px] font-black text-white truncate block tracking-tight uppercase leading-none">{selectedFile.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Remote Access</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    {editing ? (
                    <>
                        <button onClick={saveFile} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                            saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}>
                        <Save size={12} strokeWidth={3} /> {saved ? t('saved') : t('save')}
                        </button>
                        <button onClick={() => setEditing(false)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5 active:scale-90">
                        <X size={14} strokeWidth={3} />
                        </button>
                    </>
                    ) : (
                    <button onClick={() => { setEditContent(selectedFile.content); setEditing(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                        <Edit3 size={12} strokeWidth={3} /> {t('edit')}
                    </button>
                    )}
                </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#0d1117]/60 custom-scrollbar relative z-10">
                {editing ? (
                    <textarea
                    className="w-full h-full p-8 bg-transparent text-slate-200 text-[11px] font-mono resize-none focus:outline-none leading-relaxed selection:bg-indigo-500/30"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    spellCheck={false}
                    autoFocus
                    />
                ) : (
                    <div className="p-2">
                    <SyntaxHighlighter
                        language={detectLang(selectedFile.name)}
                        style={vscDarkPlus}
                        showLineNumbers
                        wrapLines
                        customStyle={{
                        margin: 0,
                        borderRadius: '1.5rem',
                        fontSize: '0.7rem',
                        lineHeight: '1.6',
                        background: 'transparent',
                        minHeight: '100%',
                        padding: '1.5rem',
                        }}
                        lineNumberStyle={{ color: '#334155', minWidth: '3em' }}
                    >
                        {selectedFile.content}
                    </SyntaxHighlighter>
                    </div>
                )}
                </div>
                
                <div className="px-8 py-3 bg-black/40 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase flex items-center justify-between relative z-10">
                    <span>Protocol Type: {detectLang(selectedFile.name).toUpperCase()}</span>
                    <button 
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        Close Terminal
                    </button>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Agent Logs ────────────────────────────────────────────────────────────────

function LogsTab() {
  const [filter, setFilter] = useState<string>('all');
  const agents = ['all', ...Array.from(new Set(mockAgentLogs.map(l => l.agent)))];
  const filtered = filter === 'all' ? mockAgentLogs : mockAgentLogs.filter(l => l.agent === filter);

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-180px)] max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 flex-shrink-0 px-1">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">System <span className="text-emerald-400">Terminal</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest leading-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Matrix Active
            </span>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
              Direct Uplink Established
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {agents.map(a => (
            <button key={a} onClick={() => setFilter(a)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === a 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
                }`}>
                {a}
            </button>
            ))}
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] flex-1 overflow-hidden border border-white/10 shadow-3xl bg-black/40 flex flex-col relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.02] blur-[120px] pointer-events-none rounded-full" />
        
        <div className="px-8 py-4 border-b border-white/5 bg-black/30 backdrop-blur-xl flex items-center justify-between relative z-10 flex-shrink-0">
           <div className="flex items-center gap-3">
              <div className="flex gap-1.5 mr-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/20" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/20" />
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LOG_STREAM_PROTOCOL</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Line-Buffered output</span>
           </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-8 font-mono text-[11px] relative z-10 space-y-1">
          <AnimatePresence mode="popLayout">
            {filtered.map((log, i) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.01, duration: 0.3 }}
                className="flex gap-6 py-1.5 hover:bg-white/[0.03] px-3 rounded-lg group transition-colors border border-transparent hover:border-white/5"
              >
                <span className="text-slate-600 flex-shrink-0 font-bold tracking-tight">{log.ts}</span>
                <span className="text-indigo-400/60 flex-shrink-0 w-32 truncate font-black">[{log.agent.toUpperCase()}]</span>
                <span className={`flex-shrink-0 font-black px-2 py-0.5 rounded-md text-[9px] border ${
                    log.level === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    log.level === 'warn' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                    {logLevelPrefix[log.level]}
                </span>
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors leading-relaxed">{log.msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="px-8 py-3 bg-black/40 border-t border-white/5 text-[9px] font-black text-slate-600 uppercase flex items-center justify-between relative z-10">
            <div className="flex gap-6">
                <span>BUFFER: 2048 LINES</span>
                <span>STATE: LISTENING</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>UPSTREAM SYNC OK</span>
            </div>
        </div>
      </div>
    </div>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { t } = useLanguage();

  const content: Record<Tab, React.ReactNode> = {
    overview:  <Overview setTab={setActiveTab} />,
    config:    <ConfigTab />,
    cron:      <CronTab />,
    agents:    <AgentsTab />,
    soul:      <SoulTab />,
    tokens:    <TokensTab />,
    reporting: <ReportingTab />,
    logs:      <LogsTab />,
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Mobile: horizontal scrollable tab bar ──────────────────────────── */}
      <div className="lg:hidden flex-shrink-0 border-b border-white/5 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={13} />
              {t(`settings_tab_${tab.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: vertical left nav ─────────────────────────────────────── */}
      <div className="hidden lg:block w-52 flex-shrink-0 border-r border-white/5 p-3 space-y-1 overflow-y-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={15} />
            {t(`settings_tab_${tab.id}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {content[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;

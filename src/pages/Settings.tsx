import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Settings as SettingsIcon, Terminal, Clock, Bot, Brain,
  Coins, FolderOpen, FileText, ChevronRight, ChevronDown,
  Trash2, Plus, Search,
  AlertCircle, CheckCircle, RefreshCw, Cpu,
  Folder, Edit3, Save, X, ToggleLeft, ToggleRight,
  Shield, ShieldAlert, ShieldCheck, ShieldX,
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

type Tab = 'overview' | 'config' | 'cron' | 'agents' | 'soul' | 'tokens' | 'reporting' | 'logs' | 'security';

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

const mockTokenUsage = [
  { date: 'Mon', input: 48000, output: 12000 },
  { date: 'Tue', input: 62000, output: 18000 },
  { date: 'Wed', input: 55000, output: 14000 },
  { date: 'Thu', input: 71000, output: 22000 },
  { date: 'Fri', input: 89000, output: 28000 },
  { date: 'Sat', input: 34000, output: 8000 },
  { date: 'Sun', input: 28000, output: 6000 },
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

const logLevelStyle: Record<string, string> = {
  info: 'text-slate-300',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};
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
  { id: 'security',  label: 'Security Council',icon: ShieldAlert },
];

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview({ setTab }: { setTab: (t: Tab) => void }) {
  const { t } = useLanguage();
  const running = mockAgents.filter(a => a.status === 'running').length;
  const totalTokens = mockAgents.reduce((s, a) => s + a.tokensToday, 0);
  const activeCrons = mockCronJobs.filter(c => c.status === 'active').length;

  const cards = [
    { icon: Bot, label: t('settings_active_agents'), value: `${running}/${mockAgents.length}`, color: 'text-indigo-400', bg: 'bg-indigo-500/10', tab: 'agents' as Tab },
    { icon: Clock, label: t('settings_active_crons'), value: `${activeCrons}/${mockCronJobs.length}`, color: 'text-cyan-400', bg: 'bg-cyan-500/10', tab: 'cron' as Tab },
    { icon: Coins, label: t('settings_tokens_today'), value: (totalTokens / 1000).toFixed(0) + 'K', color: 'text-purple-400', bg: 'bg-purple-500/10', tab: 'tokens' as Tab },
    { icon: AlertCircle, label: t('settings_errors'), value: mockAgents.filter(a => a.status === 'error').length.toString(), color: 'text-red-400', bg: 'bg-red-500/10', tab: 'logs' as Tab },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{t('settings_overview_title')}</h2>
        <p className="text-slate-400 text-sm">{t('settings_overview_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => setTab(c.tab)}
            className="glass-card rounded-2xl p-5 text-left hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color} />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick status */}
      <div className="glass-panel rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu size={15} className="text-indigo-400" /> {t('settings_agent_status')}
        </p>
        <div className="space-y-3">
          {mockAgents.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'running' ? 'bg-green-400 animate-pulse' : a.status === 'error' ? 'bg-red-400' : 'bg-slate-500'}`} />
              <span className="text-sm text-white font-medium flex-1">{a.name}</span>
              <span className="text-xs text-slate-400">{a.model}</span>
              <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${a.status === 'running' ? 'bg-green-900/50 text-green-300' : a.status === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-400'}`}>
                {a.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Config Files ──────────────────────────────────────────────────────────────

function ConfigFileTree({ nodes, depth = 0, onSelect }: {
  nodes: typeof mockConfigFiles;
  depth?: number;
  onSelect: (node: { name: string; content: string }) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ agents: true, memory: true });
  return (
    <div>
      {nodes.map(node => (
        <div key={node.name}>
          {node.type === 'folder' ? (
            <>
              <button
                onClick={() => setOpen(o => ({ ...o, [node.name]: !o[node.name] }))}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 text-sm transition-colors"
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
              >
                {open[node.name] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <Folder size={14} className="text-indigo-400" />
                {node.name}
              </button>
              {open[node.name] && node.children && (
                <ConfigFileTree nodes={node.children as typeof mockConfigFiles} depth={depth + 1} onSelect={onSelect} />
              )}
            </>
          ) : (
            <button
              onClick={() => node.content && onSelect({ name: node.name, content: node.content })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white text-sm transition-colors"
              style={{ paddingLeft: `${depth * 16 + 28}px` }}
            >
              <FileIconComp name={node.name} size={13} />
              {node.name}
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

  useEffect(() => {
    fetch('/api/config-files').then(r => r.json()).then(setTree).catch(() => {});
  }, []);

  const startEdit = () => { if (!selected) return; setEditContent(selected.content); setEditing(true); };
  const saveEdit = async () => {
    if (!selected?.path) return;
    await fetch('/api/fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selected.path, content: editContent }) });
    setSelected(s => s ? { ...s, content: editContent } : null);
    setEditing(false);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      <div className="w-56 glass-panel rounded-2xl p-3 overflow-auto flex-shrink-0">
        <p className="text-xs text-slate-400 uppercase tracking-widest px-2 mb-3">{t('settings_files')}</p>
        <ConfigFileTree nodes={tree} onSelect={setSelected} />
      </div>
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileIconComp name={selected.name} size={14} />
                <span className="text-sm font-medium text-white">{selected.name}</span>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
                      <Save size={12} /> {t('save')}
                    </button>
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors">
                      <X size={12} /> {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors">
                    <Edit3 size={12} /> {t('edit')}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {editing ? (
                <textarea
                  className="w-full h-full min-h-[300px] p-4 bg-[#1e1e1e] text-slate-200 text-xs font-mono resize-none focus:outline-none leading-relaxed"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <SyntaxHighlighter
                  language={detectLang(selected.name)}
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '0.72rem',
                    lineHeight: '1.6',
                    background: '#1e1e1e',
                    minHeight: '100%',
                  }}
                  lineNumberStyle={{ color: '#4a5568', minWidth: '2.5em' }}
                >
                  {selected.content}
                </SyntaxHighlighter>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('settings_select_file')}</p>
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
    // Simuliere Ausführung
    setTimeout(() => setRefreshing(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t('settings_cron_title')}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
              {jobs.filter(j => j.status === 'active').length} {t('settings_cron_active')}
            </span>
            <span className="text-slate-500 text-xs font-medium">
              {jobs.length} {t('settings_cron_total')}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          <Plus size={16} strokeWidth={2.5} /> {t('settings_new_job')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {jobs.map((job, i) => {
          const humanSchedule = parseCronSchedule(job.schedule);
          const isError = job.status === 'error';
          
          return (
            <motion.div 
              key={job.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={`
                group glass-card rounded-3xl p-6 border transition-all duration-300
                ${job.status === 'active' ? 'border-white/10' : 'border-white/5 opacity-80'}
                hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10
              `}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      job.status === 'active' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 
                      isError ? 'bg-red-400' : 'bg-slate-500'
                    }`} />
                    <h3 className="font-bold text-white text-lg truncate tracking-tight">{job.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 min-h-[40px]">{job.description}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button onClick={() => runNow(job.id)} disabled={refreshing === job.id} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-indigo-400 transition-all active:scale-90">
                    <RefreshCw size={18} className={refreshing === job.id ? 'animate-spin text-indigo-400' : ''} />
                  </button>
                  <button onClick={() => toggle(job.id)} className="p-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-90">
                    {job.status === 'active'
                      ? <ToggleRight size={24} className="text-indigo-400" />
                      : <ToggleLeft size={24} className="text-slate-600" />}
                  </button>
                  <button onClick={() => remove(job.id)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all active:scale-90">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/3 rounded-2xl p-3 border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <Clock size={10} /> Schedule
                  </div>
                  <span className="text-indigo-300 text-xs font-bold truncate">{humanSchedule}</span>
                </div>
                
                <div className="bg-white/3 rounded-2xl p-3 border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Letzter Lauf</span>
                  <span className="text-slate-300 text-xs font-bold truncate">{job.lastRun || '-'}</span>
                </div>
                
                <div className="bg-white/3 rounded-2xl p-3 border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Nächster Lauf</span>
                  <span className={`text-xs font-bold truncate ${job.status === 'active' ? 'text-green-400' : 'text-slate-500'}`}>
                    {job.status === 'active' ? (job.nextRun || 'in Kürze') : 'Pausiert'}
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
          // Parse token string like "51k/272k (19%) · 🗄️ 98% cached"
          let tokensToday = 0;
          if (item.tokens) {
            const match = item.tokens.match(/^([\d.]+)k/);
            if (match) {
              tokensToday = parseFloat(match[1]) * 1000;
            }
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{t('settings_agents_title')}</h2>
        <p className="text-slate-400 text-sm">{agents.filter(a => a.status === 'running').length} {t('settings_agents_running')} · {agents.filter(a => a.status === 'error').length} {t('settings_agents_errors')}</p>
      </div>
      {agents.map((agent, i) => (
        <motion.div key={agent.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${agent.status === 'running' ? 'bg-green-400 animate-pulse' : agent.status === 'error' ? 'bg-red-400' : 'bg-slate-500'}`} />
              <div>
                <span className="font-bold text-white">{agent.name}</span>
                <p className="text-xs text-slate-400">{agent.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                agent.status === 'running' ? 'bg-green-900/50 text-green-300'
                : agent.status === 'error' ? 'bg-red-900/50 text-red-300'
                : 'bg-slate-700 text-slate-400'}`}>
                {agent.status}
              </span>
              {agent.status === 'error' && (
                <button onClick={() => restart(agent.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-300 text-xs transition-colors">
                  <RefreshCw size={11} /> {t('settings_restart')}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t('settings_model')}</p>
              <code className="text-xs text-indigo-300">{agent.model}</code>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t('settings_tokens_today_short')}</p>
              <p className="text-sm font-semibold text-white">{(agent.tokensToday / 1000).toFixed(1)}K</p>
              {(agent as any).rawTokens && (
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{(agent as any).rawTokens}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t('settings_tasks_done')}</p>
              <p className="text-sm font-semibold text-white">{agent.tasks}</p>
            </div>
          </div>
        </motion.div>
      ))}
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
  const soulPath = '/home/fabio/.openclaw/workspace/SOUL.md';
  const [content, setContent] = useState(defaultSoul);
  const [saved, setSaved] = useState(false);
  useEffect(() => { fetch(`/api/fs/read?path=${encodeURIComponent(soulPath)}`).then(r => r.json()).then(d => { if (d.content) setContent(d.content); }).catch(() => {}); }, []);
  const save = async () => { await fetch('/api/fs/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: soulPath, content }) }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain size={20} className="text-purple-400" /> {t('settings_soul_title')}
          </h2>
          <p className="text-slate-400 text-sm">{t('settings_soul_subtitle')}</p>
        </div>
        <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
          {saved ? <><CheckCircle size={14} /> {t('settings_soul_saved')}</> : <><Save size={14} /> {t('settings_soul_save')}</>}
        </button>
      </div>
      <div className="glass-panel rounded-2xl flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="text-xs text-slate-500 ml-2">soul.md</span>
        </div>
        <textarea
          className="flex-1 bg-transparent text-slate-200 text-sm font-mono p-5 resize-none focus:outline-none leading-relaxed"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Token Usage ───────────────────────────────────────────────────────────────

function TokensTab() {
  const { t } = useLanguage();
  const totalInput = mockTokenUsage.reduce((s, d) => s + d.input, 0);
  const totalOutput = mockTokenUsage.reduce((s, d) => s + d.output, 0);
  const maxBar = Math.max(...mockTokenUsage.map(d => d.input + d.output));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">{t('settings_tokens_title')}</h2>
        <p className="text-slate-400 text-sm">{t('settings_tokens_subtitle')}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('settings_tokens_total_in'),  value: (totalInput / 1000).toFixed(0) + 'K', color: 'text-indigo-400' },
          { label: t('settings_tokens_total_out'), value: (totalOutput / 1000).toFixed(0) + 'K', color: 'text-purple-400' },
          { label: t('settings_tokens_total'),     value: ((totalInput + totalOutput) / 1000).toFixed(0) + 'K', color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-5">{t('settings_daily_breakdown')}</p>
        <div className="space-y-3">
          {mockTokenUsage.map((d, i) => {
            const total = d.input + d.output;
            const pct = (total / maxBar) * 100;
            const inPct = (d.input / total) * 100;
            return (
              <motion.div key={d.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 w-10">{d.date}</span>
                  <span className="text-xs text-slate-500">{(total / 1000).toFixed(0)}K total</span>
                </div>
                <div className="h-5 bg-slate-800 rounded-full overflow-hidden" style={{ width: '100%' }}>
                  <div className="h-full rounded-full flex overflow-hidden transition-all duration-700" style={{ width: `${pct}%` }}>
                    <div className="bg-indigo-500" style={{ width: `${inPct}%` }} />
                    <div className="bg-purple-500 flex-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Input</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Output</span>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4">{t('settings_by_agent')}</p>
        <div className="space-y-3">
          {mockAgents.map((a, i) => {
            const max = Math.max(...mockAgents.map(x => x.tokensToday));
            return (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-28 truncate">{a.name}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${(a.tokensToday / max) * 100}%` }} transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }} />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{(a.tokensToday / 1000).toFixed(1)}K</span>
              </motion.div>
            );
          })}
        </div>
      </div>
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

  // Load on mount
  React.useEffect(() => { loadDir(currentPath, false); }, []);

  // Fetch drives on mount
  React.useEffect(() => {
    fetch('/api/fs/drives').then(r => r.json()).then(d => setDrives(d.drives)).catch(() => {});
  }, []);

  const filtered = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const quickLinks = [
    { label: 'Dashboard', path: '/home/fabio/dashboard' },
    { label: 'OpenClaw', path: '/home/fabio/.openclaw/workspace' },
    { label: 'Secrets', path: '/home/fabio/.openclaw/secrets' },
  ];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">{t('settings_explorer_title')}</h2>
          <p className="text-slate-400 text-sm">{t('settings_explorer_subtitle')}</p>
        </div>
      </div>

      {/* Path bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={goUp} className="p-2 rounded-lg glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0" title="Go up">
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <button onClick={() => loadDir(history[history.length - 2] || currentPath)} className="p-2 rounded-lg glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0" title="Back">
          <ChevronDown size={14} className="rotate-90" />
        </button>
        <form onSubmit={e => { e.preventDefault(); loadDir(currentPath); }} className="flex-1 flex">
          <input
            className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/60"
            value={currentPath}
            onChange={e => setCurrentPath(e.target.value)}
          />
        </form>
        <button onClick={() => loadDir(currentPath)} className="p-2 rounded-lg glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quick links + drives */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {quickLinks.map(l => (
          <button key={l.label} onClick={() => loadDir(l.path)}
            className="px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs hover:bg-indigo-600/40 transition-colors">
            {l.label}
          </button>
        ))}
        {drives.map(d => (
          <button key={d} onClick={() => loadDir(d)}
            className="px-3 py-1 rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 text-xs hover:bg-slate-700 hover:text-white transition-colors">
            {d}
          </button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* File list */}
        <div className="flex flex-col flex-1 min-w-0 glass-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 flex-shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-slate-800/60 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none border border-white/5 focus:border-indigo-500/40"
                placeholder={t('settings_filter')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center h-32 text-slate-400">
                <RefreshCw size={16} className="animate-spin mr-2" /> {t('settings_loading')}
              </div>
            )}
            {error && (
              <div className="p-4 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {!loading && !error && (
              <div className="p-2">
                {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-8">{t('settings_empty_folder')}</p>}
                {filtered.map(entry => (
                  <motion.div
                    key={entry.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
                      selectedFile?.path === entry.path ? 'bg-indigo-600/20 border border-indigo-500/20' : 'hover:bg-white/5'
                    }`}
                    onClick={() => entry.type === 'folder' ? loadDir(entry.path) : loadFile(entry)}
                  >
                    {entry.type === 'folder'
                      ? <Folder size={15} className="text-indigo-400 flex-shrink-0" />
                      : <FileIconComp name={entry.name} size={15} />}
                    <span className={`text-sm flex-1 truncate ${entry.type === 'folder' ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {entry.name}
                    </span>
                    <span className="text-xs text-slate-600 group-hover:text-slate-400">{formatBytes(entry.size)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-2 border-t border-white/5 text-xs text-slate-500 flex-shrink-0">
            {filtered.length} {t('settings_items')} · {filtered.filter(e => e.type === 'folder').length} {t('settings_folders')}, {filtered.filter(e => e.type === 'file').length} {t('settings_files_count')}
          </div>
        </div>

        {/* File preview / editor */}
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[45%] flex-shrink-0 glass-panel rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileIconComp name={selectedFile.name} size={13} />
                <span className="text-xs font-medium text-white truncate">{selectedFile.name}</span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {editing ? (
                  <>
                    <button onClick={saveFile} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                      <Save size={11} /> {saved ? t('saved') : t('save')}
                    </button>
                    <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  TEXT_EXTS.includes(selectedFile.name.includes('.') ? '.' + selectedFile.name.split('.').pop()! : '') && (
                    <button onClick={() => { setEditContent(selectedFile.content); setEditing(true); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors">
                      <Edit3 size={11} /> {t('edit')}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {editing ? (
                <textarea
                  className="w-full h-full min-h-[300px] p-4 bg-[#1e1e1e] text-slate-200 text-xs font-mono resize-none focus:outline-none leading-relaxed"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <SyntaxHighlighter
                  language={detectLang(selectedFile.name)}
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '0.72rem',
                    lineHeight: '1.6',
                    background: '#1e1e1e',
                    minHeight: '100%',
                  }}
                  lineNumberStyle={{ color: '#4a5568', minWidth: '2.5em' }}
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Agent Logs ────────────────────────────────────────────────────────────────

function LogsTab() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const agents = ['all', ...Array.from(new Set(mockAgentLogs.map(l => l.agent)))];
  const filtered = filter === 'all' ? mockAgentLogs : mockAgentLogs.filter(l => l.agent === filter);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal size={18} className="text-green-400" /> {t('settings_logs_title')}
          </h2>
          <p className="text-slate-400 text-sm">{t('settings_logs_subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-semibold">LIVE</span>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {agents.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === a ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {a}
          </button>
        ))}
      </div>
      <div className="glass-panel rounded-2xl flex-1 overflow-auto p-4 font-mono text-xs">
        <AnimatePresence>
          {filtered.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
              className="flex gap-3 py-0.5 hover:bg-white/5 px-1 rounded">
              <span className="text-slate-600 flex-shrink-0">{log.ts}</span>
              <span className="text-slate-500 flex-shrink-0 w-28 truncate">[{log.agent}]</span>
              <span className={`flex-shrink-0 ${logLevelStyle[log.level]}`}>{logLevelPrefix[log.level]}</span>
              <span className="text-slate-300">{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Security Council ──────────────────────────────────────────────────────────


function SecurityTab() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<'pending' | 'clean' | 'issues'>('pending');
  const [findings, setFindings] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);

  const loadDir = () => {
    setLoadingList(true);
    fetch('/api/fs/list?path=' + encodeURIComponent('/home/fabio/dashboard/outputs/security-council/file-exchange'))
      .then(r => r.json())
      .then(d => {
        if (d.entries) {
          const mdFiles = d.entries.filter((e: any) => e.name.endsWith('.md')).sort((a: any, b: any) => (b.modified || '').localeCompare(a.modified || ''));
          setFiles(mdFiles);
          if (mdFiles.length > 0) {
            // Auto select latest on first load if nothing selected
            const latest = mdFiles.find((f: any) => f.name === 'security_council_latest.md') || mdFiles[0];
            selectFile(latest);
          }
        }
        setLoadingList(false);
      })
      .catch(() => setLoadingList(false));
  };

  React.useEffect(() => { loadDir(); }, []);

  const selectFile = async (f: any) => {
    setSelectedFile(f);
    setLoadingFile(true);
    setReportContent(null);
    setReportStatus('pending');

    try {
      // 1. Fetch MD
      const mdRes = await fetch('/api/fs/read?path=' + encodeURIComponent(f.path));
      const mdData = await mdRes.json();
      setReportContent(mdData.content || null);

      // 2. Try secondary fetch for JSON summary for exact status extraction
      const jsonPath = f.path.replace('.md', '.json');
      const jsonRes = await fetch('/api/fs/read?path=' + encodeURIComponent(jsonPath));
      const jsonData = await jsonRes.json();
      
      let finalStatus: 'pending' | 'clean' | 'issues' = 'clean';
      let parsedFindings: any[] = [];

      if (jsonData.content) {
        try {
          const parsed = JSON.parse(jsonData.content);
          if (parsed.status) finalStatus = parsed.status;
          else if (parsed.summary?.highest_severity === 'critical' || parsed.summary?.highest_severity === 'high') finalStatus = 'issues';
          else if (parsed.summary?.highest_severity === 'medium' && parsed.finding_count > 0) finalStatus = 'issues';
          
          if (Array.isArray(parsed.findings)) {
            parsedFindings = parsed.findings;
          }
        } catch(e){}
      } else if (mdData.content) {
        // Fallback markdown parsing
        if (mdData.content.includes('[CRITICAL]') || mdData.content.includes('[HIGH]') || mdData.content.includes('issues')) finalStatus = 'issues';
      }
      setFindings(parsedFindings);
      setReportStatus(finalStatus);
    } catch (e) {
      setFindings([]);
      setReportStatus('issues');
    }
    setLoadingFile(false);
  };

  const statusConfig = {
    pending: { icon: Shield,       color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: t('settings_sec_awaiting'), glow: '' },
    clean:   { icon: ShieldCheck,  color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30',  label: t('settings_sec_clean'), glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
    issues:  { icon: ShieldX,      color: 'text-rose-400',   bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    label: t('settings_sec_issues'), glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' },
  };

  const getSeverityStyles = (severity: string) => {
    switch(severity.toLowerCase()) {
      case 'critical':
      case 'high': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: t('settings_sec_severity_high') };
      case 'medium': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: t('settings_sec_severity_medium') };
      case 'low': return { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', label: t('settings_sec_severity_low') };
      default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: severity };
    }
  };

  const s = statusConfig[reportStatus];
  const StatusIcon = s.icon;
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldAlert size={22} className="text-indigo-400" />
            Security Council
          </h2>
          <p className="text-slate-400 text-sm">Historical scans & reports</p>
        </div>
        
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-0">
          <div className="p-3 border-b border-white/5 bg-white/5 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                placeholder="Search reports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <div className="flex items-center justify-center h-20 text-slate-500"><RefreshCw size={14} className="animate-spin" /></div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center p-4 text-slate-500 text-sm">No reports found.</div>
            ) : (
              filteredFiles.map(f => (
                <button
                  key={f.path}
                  onClick={() => selectFile(f)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 transition-colors ${selectedFile?.path === f.path ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}
                >
                  <FileText size={15} className={selectedFile?.path === f.path ? 'text-indigo-400' : 'text-slate-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{f.name}</p>
                    {f.modified && <p className="text-[10px] text-slate-500 mt-0.5">{new Date(f.modified).toLocaleDateString()} {new Date(f.modified).toLocaleTimeString()}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!selectedFile ? (
           <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-400">
             <Shield size={48} className="text-slate-700 mb-4" />
             <p>Select a report from the sidebar.</p>
           </div>
        ) : loadingFile ? (
           <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center text-slate-400">
             <RefreshCw size={24} className="animate-spin" />
           </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
            {/* Premium Status Header */}
            <div className={`flex-shrink-0 flex items-center justify-between p-5 rounded-2xl border bg-black/40 backdrop-blur-xl transition-all duration-300 ${s.border} ${s.glow}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.bg} border ${s.border}`}>
                  <StatusIcon size={24} className={s.color} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold tracking-wide ${s.color}`}>{s.label}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{selectedFile.name}</span>
                    &bull;
                    <span>{selectedFile.modified ? new Date(selectedFile.modified).toLocaleString() : 'Live'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => selectFile(selectedFile)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors border border-white/10">
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Findings & Markdown Report */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Risk Finding Cards */}
              {findings.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2 px-1">
                    <ShieldAlert size={16} className="text-rose-400" />
                    {t('settings_sec_risk_findings')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {findings.map((finding, idx) => {
                      const styles = getSeverityStyles(finding.severity);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`glass-card p-5 rounded-2xl border ${styles.border} flex flex-col h-full hover:bg-white/5 transition-colors`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${styles.bg} ${styles.color} border ${styles.border}`}>
                              {styles.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{finding.file}:{finding.line}</span>
                          </div>
                          <p className="text-sm font-semibold text-white mb-2 leading-snug">
                            {finding.description}
                          </p>
                          {finding.recommendation && (
                            <div className="mt-auto pt-3 border-t border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('settings_sec_recommendation')}</p>
                              <p className="text-xs text-slate-300 leading-relaxed italic">
                                &quot;{finding.recommendation}&quot;
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Markdown Report Content */}
              <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Security Report</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                  </div>
                </div>
                {reportContent ? (
                  <div className="p-8 text-slate-300 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-6 mt-2 border-b border-white/10 pb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-300 mb-4 mt-8 flex items-center gap-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-3 mt-6" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-400" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-slate-400" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-indigo-500" {...props} />,
                        code: ({node, ...props}: any) => (
                          <code className="bg-black/40 rounded px-1.5 py-0.5 text-indigo-300 font-mono text-[11px]" {...props} />
                        ),
                        strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                      }}
                    >
                      {reportContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">No content available for this report.</div>
                )}
              </div>
            </div>
          </div>
        )}
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
    security:  <SecurityTab />,
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

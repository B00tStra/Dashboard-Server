import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

// ====== Persistent Data Storage ======
const DATA_DIR = '/home/fabio/.openclaw/workspace/dashboard-data';
const STOCK_NEWS_FILE = path.join(DATA_DIR, 'stock-news.json');
const MARKET_DATA_FILE = path.join(DATA_DIR, 'market-data.json');
const WATCHLIST_FILE = path.join(DATA_DIR, 'watchlist.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

// Helper: Load JSON file safely
function loadJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`Failed to load ${filePath}:`, err.message);
  }
  return defaultValue;
}

// Helper: Save JSON file safely
function saveJSON(filePath, data) {
  try {
    console.log(`[saveJSON] Attempting to save to: ${filePath}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[saveJSON] ✓ Successfully saved data to ${filePath}`);
  } catch (err) {
    console.error(`[saveJSON] ✗ Failed to save ${filePath}:`, err.message);
  }
}

// ====== Production Security Middleware ======
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/'
};

// If deployed, protect POST routes so only your AI Agent can update data.
const AGENT_API_KEY = process.env.AGENT_API_KEY;
app.use((req, res, next) => {
  if (req.method === 'POST' && AGENT_API_KEY && req.path.startsWith('/api/') && !req.path.includes('/chat')) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${AGENT_API_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
  }
  next();
});

// Resolve and normalize a path safely
function resolvePath(p) {
  if (!p || p === '') return '/home/fabio/dashboard';
  // Accept both / and \ separators
  return path.normalize(String(p));
}

// List directory contents
app.get('/api/fs/list', (req, res) => {
  const dirPath = resolvePath(req.query.path);
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = entries
      .filter(e => !e.name.startsWith('.') || req.query.hidden === 'true')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        let size = null;
        let modified = null;
        try {
          const stat = fs.statSync(fullPath);
          size = e.isFile() ? stat.size : null;
          modified = stat.mtime.toISOString();
        } catch {}
        return {
          name: e.name,
          type: e.isDirectory() ? 'folder' : 'file',
          path: fullPath,
          size,
          modified,
          ext: e.isFile() ? path.extname(e.name).toLowerCase() : null,
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json({ path: dirPath, entries: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read file contents
app.get('/api/fs/read', (req, res) => {
  const filePath = resolvePath(req.query.path);
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (>1MB)' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ path: filePath, content });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Write / save file
app.post('/api/fs/write', (req, res) => {
  const { path: filePath, content } = req.body;
  try {
    fs.writeFileSync(resolvePath(filePath), content, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List useful roots on this Linux host
app.get('/api/fs/drives', (_req, res) => {
  const candidates = [
    '/',
    '/home/fabio/.openclaw/workspace',
    '/home/fabio/dashboard',
    '/home/fabio/.openclaw/secrets',
  ];
  const drives = candidates.filter((p, idx, arr) => arr.indexOf(p) === idx).filter((p) => {
    try { fs.accessSync(p); return true; } catch { return false; }
  });
  res.json({ drives });
});

// Parent path helper
app.get('/api/fs/parent', (req, res) => {
  const p = resolvePath(req.query.path);
  const parent = path.dirname(p);
  res.json({ parent: parent === p ? null : parent });
});

app.get('/api/cron', (_req, res) => {
  res.json(parseCronList());
});

app.get('/api/config-files', (_req, res) => {
  const files = [
    { group: 'core', path: '/home/fabio/.openclaw/workspace/SOUL.md' },
    { group: 'core', path: '/home/fabio/.openclaw/workspace/MEMORY.md' },
    { group: 'core', path: '/home/fabio/.openclaw/workspace/USER.md' },
    { group: 'core', path: '/home/fabio/.openclaw/workspace/AGENTS.md' },
    { group: 'core', path: '/home/fabio/.openclaw/workspace/HEARTBEAT.md' },
    { group: 'ops', path: '/home/fabio/.openclaw/workspace/cron.md' },
    { group: 'ops', path: '/home/fabio/.openclaw/workspace/stock_config.json' },
    { group: 'ops', path: '/home/fabio/.openclaw/workspace/security_council_config.json' },
    { group: 'dashboard', path: '/home/fabio/dashboard/agent/AGENT.md' },
    { group: 'dashboard', path: '/home/fabio/dashboard/agent/memory.md' },
  ];

  const groups = {};
  for (const item of files) {
    if (!fs.existsSync(item.path)) continue;
    const name = path.basename(item.path);
    const content = fs.readFileSync(item.path, 'utf-8');
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push({ name, type: 'file', path: item.path, content });
  }

  const tree = Object.entries(groups).map(([name, children]) => ({ name, type: 'folder', children }));
  res.json(tree);
});


function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return '';
  }
}

function parseTableRows(output) {
  return output
    .split('\n')
    .filter(line => line.trim().startsWith('│'))
    .map(line => line.split('│').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.some(Boolean));
}

// Helper: Parse age string to minutes for comparison
function parseAgeToMinutes(ageStr) {
  if (!ageStr) return Infinity;
  const match = ageStr.match(/(\d+)\s*(s|m|h|d)/);
  if (!match) return Infinity;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value / 60;
    case 'm': return value;
    case 'h': return value * 60;
    case 'd': return value * 1440;
    default: return Infinity;
  }
}

function getLiveAgents() {
  const out = safeExec('openclaw status');
  if (!out) return [];
  const lines = out.split('\n').filter(line => line.includes('│ agent:'));

  const allAgents = lines.map((line, idx) => {
    const cells = line.split('│').slice(1, -1).map(cell => cell.trim()).filter(Boolean);
    const technicalName = cells[0] || `agent-${idx + 1}`;
    const friendlyName = getFriendlyAgentName(technicalName);

    return {
      id: String(idx + 1),
      agent: friendlyName,
      technicalName: technicalName,
      action: `${cells[1] || 'session'} · ${cells[2] || ''}`.trim(),
      ticker: cells[3] || '[live]',
      status: /ago|active|direct/i.test(`${cells[1] || ''} ${cells[2] || ''}`) ? 'running' : 'idle',
      age: cells[2] || '',
      ageValue: parseAgeToMinutes(cells[2] || ''),
      tokens: cells[4] || '',
    };
  });

  // Deduplicate: keep only the newest run per agent name
  const deduped = new Map();
  for (const agent of allAgents) {
    const existing = deduped.get(agent.agent);
    if (!existing || agent.ageValue < existing.ageValue) {
      deduped.set(agent.agent, agent);
    }
  }

  return Array.from(deduped.values())
    .map((agent, idx) => ({ ...agent, id: String(idx + 1) }));
}

const CRON_DESCRIPTIONS = {
  'training-calendar-sync': 'Synchronisiert Google Kalender Trainingseinheiten mit dem Dashboard.',
  'market-data-update': 'Aktualisiert Marktindikatoren, Fear & Greed Index und Makro-Daten.',
  'stock-news-update': 'Analysiert neueste Nachrichten und aktualisiert die Stimmungsanalyse für Watchlist-Ticker.',
  'market-debate': 'Bull/Bear/Macro/Technician-Debatte für Dashboard-Ticker via API.',
  'security-report': 'Technischer Sicherheits-Scan mit Findings und Empfehlungen für das Dashboard.',
  'training-workflow-weekly': 'Wöchentlicher Workflow zur Planung und Optimierung von Trainingsplänen.',
};

// Agent UUID to friendly name mapping
const AGENT_NAME_MAPPING = {
  'fc9d516d-0397-4': 'Market Data Agent',
  'f1fe2b5e-573e-4': 'Stock News Agent',
  '47460b82-bf1a-4': 'Market Debate Agent',
  'e493e603-686f-4': 'Security Report Agent',
  '63ed126f': 'Training Workflow Agent',
};

// Helper function to get friendly agent name
function getFriendlyAgentName(technicalName) {
  if (!technicalName) return 'Unknown Agent';

  // Check if it's a direct session (telegram, main, etc.)
  if (technicalName.includes(':telegram:')) return '💬 Telegram Session';
  if (technicalName === 'agent:main:main') return '🏠 Main Dashboard';

  // Check for cron job pattern: agent:main:cron:UUID
  const cronMatch = technicalName.match(/agent:main:cron:([0-9a-f-]+)/i);
  if (cronMatch) {
    const uuid = cronMatch[1];
    // Try to match partial UUID
    for (const [key, friendlyName] of Object.entries(AGENT_NAME_MAPPING)) {
      if (uuid.startsWith(key)) {
        return friendlyName;
      }
    }
    return `🤖 Cron Agent`;
  }

  // Fallback: return original name
  return technicalName;
}

function parseCronList() {
  const out = safeExec('openclaw cron list');
  if (!out) return [];
  const lines = out.split('\n');
  const header = lines.find(line => line.trim().startsWith('ID'));
  if (!header) return [];

  const idxName = header.indexOf('Name');
  const idxSchedule = header.indexOf('Schedule');
  const idxNext = header.indexOf('Next');
  const idxLast = header.indexOf('Last');
  const idxStatus = header.indexOf('Status');
  const idxTarget = header.indexOf('Target');
  const idxAgent = header.indexOf('Agent ID');
  const idxModel = header.indexOf('Model');

  return lines
    .filter(line => /^[0-9a-f]{8}-[0-9a-f-]{27}/i.test(line.trim()))
    .map(line => {
      const name = line.slice(idxName, idxSchedule).trim();
      return {
        id: line.slice(0, idxName).trim(),
        name,
        schedule: line.slice(idxSchedule, idxNext).trim(),
        nextRun: line.slice(idxNext, idxLast).trim(),
        lastRun: line.slice(idxLast, idxStatus).trim(),
        status: /ok|idle|active/i.test(line.slice(idxStatus, idxTarget).trim()) ? 'active' : line.slice(idxStatus, idxTarget).trim() === 'error' ? 'error' : 'paused',
        target: line.slice(idxTarget, idxAgent).trim(),
        agentId: line.slice(idxAgent, idxModel).trim(),
        model: line.slice(idxModel).trim(),
        description: CRON_DESCRIPTIONS[name] || 'OpenClaw cron job',
      };
    });
}

// ====== Dashboard Data & Endpoints ======

// Default watchlist — FALLBACK: will be overridden by loaded data if exists
const defaultWatchlist = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation',   price: 875.20, change: 48.30,  changePercent:  5.84, sparkline: [820, 830, 825, 845, 860, 855, 870, 875] },
  { ticker: 'AMD',  name: 'Advanced Micro Devices', price: 162.45, change: -3.10, changePercent: -1.87, sparkline: [170, 168, 165, 167, 164, 163, 165, 162] },
  { ticker: 'NFLX', name: 'Netflix Inc.',          price: 893.70, change: 12.50,  changePercent:  1.42, sparkline: [875, 878, 882, 879, 885, 888, 891, 894] },
  { ticker: 'ANET', name: 'Arista Networks',       price: 388.90, change: -5.20,  changePercent: -1.32, sparkline: [398, 396, 394, 391, 393, 390, 389, 389] },
  { ticker: 'CPRT', name: 'Copart Inc.',           price:  54.80, change:  0.95,  changePercent:  1.76, sparkline: [52, 53, 53, 54, 53, 54, 55, 55] },
  { ticker: 'NOW',  name: 'ServiceNow Inc.',       price: 888.50, change: 22.10,  changePercent:  2.55, sparkline: [860, 862, 868, 870, 875, 878, 884, 889] },
];

// FALLBACK: shown when no live agents are running
const mockAgentActivity = [
  { id: '1', timestamp: new Date(Date.now() - 1000 * 30).toISOString(), agent: 'SentimentBot', action: 'Scanning earnings call transcripts', ticker: 'AAPL', status: 'running' },
  { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), agent: 'NewsParser', action: 'Ingested 14 new articles', ticker: 'NVDA', status: 'done' },
];

// FALLBACK: Portfolio stats shown on dashboard
const mockStats = [
  { label: 'Portfolio Value', value: '$124,530.00', change: '+2.4% today', positive: true },
  { label: 'Day P&L', value: '+$2,918.42', change: '+2.40%', positive: true },
  { label: 'Active Agents', value: '7', change: '2 running now', positive: true },
  { label: 'News Alerts', value: '14', change: '3 high priority', positive: false },
];

// FALLBACK: General news feed (not stock-specific)
const mockNews = [
  { id: '1', title: 'Apple Reports Strong Q4 Earnings', summary: 'Apple exceeded expectations with $119.4 billion in revenue.', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), ticker: 'AAPL', sentiment: 'positive' },
  { id: '2', title: 'Tesla Faces Production Challenges', summary: 'Tesla announces delays in Model Y production.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), ticker: 'TSLA', sentiment: 'negative' },
];

// Helper for generating realistic looking stock charts (OHLC)
function generateChartData(basePrice, volatility, points) {
  let open = basePrice;
  const data = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  for(let i=points; i>0; i--) {
    const timeStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const change = (Math.random() - 0.5) * volatility;
    const bias = (Math.random() - 0.3) * (volatility * 0.2); // trend bias
    const close = open + change + bias;
    
    const minOC = Math.min(open, close);
    const maxOC = Math.max(open, close);
    const high = maxOC + Math.random() * (volatility * 0.5);
    const low = minOC - Math.random() * (volatility * 0.5);
    
    const price = open + change + bias;
    data.push({ 
      time: timeStr, 
      open: parseFloat(open.toFixed(2)), 
      high: parseFloat(high.toFixed(2)), 
      low: parseFloat(low.toFixed(2)), 
      close: parseFloat(close.toFixed(2)),
      price: parseFloat(close.toFixed(2)), // For simpler chart uses
      day: new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short' }) // For MarketAnalysis
    });
    open = close;
  }
  return data;
}

// Per-stock AI analysis — filled daily by the AI agent
// Schema: { ticker, name, sentiment: 'bullish'|'bearish'|'neutral', news_summary, analysis, last_updated, chart_1w, chart_1m }
// FALLBACK: These are shown for newly added tickers until AI agent updates them
const defaultStockNews = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sentiment: 'bullish',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(850, 8, 7),
    chart_1m: generateChartData(780, 15, 30),
    priceHistory: generateChartData(850, 8, 7).map(d => ({ price: d.price })),
    bullish: 65,
    bearish: 15,
    neutral: 20,
    score: 50,
    trend: 'up',
    signals: ['Strong institutional buying', 'Positive earnings outlook', 'Technical breakout pattern']
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    sentiment: 'neutral',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(165, 4, 7),
    chart_1m: generateChartData(155, 6, 30),
    priceHistory: generateChartData(165, 4, 7).map(d => ({ price: d.price })),
    bullish: 45,
    bearish: 30,
    neutral: 25,
    score: 0,
    trend: 'flat',
    signals: ['Mixed analyst ratings', 'Consolidation phase', 'Waiting for catalyst']
  },
  {
    ticker: 'NFLX',
    name: 'Netflix Inc.',
    sentiment: 'bullish',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(880, 6, 7),
    chart_1m: generateChartData(820, 12, 30),
    priceHistory: generateChartData(880, 6, 7).map(d => ({ price: d.price })),
    bullish: 70,
    bearish: 10,
    neutral: 20,
    score: 60,
    trend: 'up',
    signals: ['Subscriber growth accelerating', 'Content strategy paying off', 'Strong momentum']
  },
  {
    ticker: 'ANET',
    name: 'Arista Networks',
    sentiment: 'neutral',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(390, 4, 7),
    chart_1m: generateChartData(370, 7, 30),
    priceHistory: generateChartData(390, 4, 7).map(d => ({ price: d.price })),
    bullish: 50,
    bearish: 25,
    neutral: 25,
    score: 10,
    trend: 'flat',
    signals: ['Steady revenue growth', 'Competition intensifying', 'Market share stable']
  },
  {
    ticker: 'CPRT',
    name: 'Copart Inc.',
    sentiment: 'neutral',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(53, 1.5, 7),
    chart_1m: generateChartData(50, 2, 30),
    priceHistory: generateChartData(53, 1.5, 7).map(d => ({ price: d.price })),
    bullish: 40,
    bearish: 35,
    neutral: 25,
    score: -5,
    trend: 'down',
    signals: ['Used car market cooling', 'Inventory challenges', 'Margin pressure']
  },
  {
    ticker: 'NOW',
    name: 'ServiceNow Inc.',
    sentiment: 'bullish',
    news_summary: '⏳ Awaiting AI analysis... The agent will scan recent news, earnings reports, and market sentiment for this ticker. Check back in a few minutes.',
    analysis: '🤖 AI-powered analysis pending. The agent will provide bullish/bearish assessment, key technical levels, and institutional sentiment once the scan completes.',
    last_updated: null,
    chart_1w: generateChartData(860, 8, 7),
    chart_1m: generateChartData(810, 14, 30),
    priceHistory: generateChartData(860, 8, 7).map(d => ({ price: d.price })),
    bullish: 75,
    bearish: 10,
    neutral: 15,
    score: 65,
    trend: 'up',
    signals: ['AI platform gaining traction', 'Enterprise demand strong', 'Excellent guidance']
  },
];

const defaultMarketData = {
  stocks: {
    fearAndGreed: {
      current: 20,
      yesterday: 22,
      lastWeek: 45,
      lastMonth: 68,
      lastYear: 54,
      status: 'Extreme Fear',
      indicators: [
        { name: 'Market Momentum', status: 'Extreme Fear', value: 'S&P 500 is below 125-day MA' },
        { name: 'Stock Price Strength', status: 'Fear', value: 'Net 52-week lows outpace highs' },
        { name: 'Stock Price Breadth', status: 'Extreme Fear', value: 'McClellan Volume Summation is negative' },
        { name: 'Put and Call Options', status: 'Fear', value: 'Put/Call ratio at 1.08' },
        { name: 'Market Volatility', status: 'Extreme Fear', value: 'VIX is 32.4 (above 50-day MA)' },
        { name: 'Safe Haven Demand', status: 'Extreme Fear', value: 'Bonds outperforming stocks by 4%' },
        { name: 'Junk Bond Demand', status: 'Extreme Fear', value: 'Spread is widening significantly' }
      ]
    },
    macro: [
      { label: 'Fed Target Rate', value: '5.25 - 5.50%', prev: '5.25 - 5.50%', status: 'neutral', history: [{v: 5}, {v: 5.25}, {v: 5.25}, {v: 5.25}, {v: 5.5}, {v: 5.5}] },
      { label: 'CPI (YoY)', value: '3.1%', prev: '3.2%', status: 'good', history: [{v: 3.7}, {v: 3.2}, {v: 3.1}, {v: 3.4}, {v: 3.2}, {v: 3.1}] },
      { label: 'Market Outlook', value: 'Extreme Fear', prev: 'Cautious', status: 'bad', history: [{v: 80}, {v: 75}, {v: 70}, {v: 65}, {v: 20}] }
    ]
  },
  crypto: {
    fearAndGreed: {
      current: 28,
      yesterday: 35,
      lastWeek: 62,
      lastMonth: 78,
      status: 'Fear',
      indicators: [
        { name: 'Volatility', status: 'Extreme Fear', value: 'High volatility in BTC/ETH' },
        { name: 'Market Momentum', status: 'Fear', value: 'Bearish crossovers' },
        { name: 'Social Media', status: 'Neutral', value: 'Negative sentiment rising' },
        { name: 'Dominance', status: 'Greed', value: 'BTC dominance at 52.4%' },
        { name: 'Google Trends', status: 'Fear', value: 'Declining search volume' }
      ]
    },
    macro: [
      { label: 'BTC Dominance', value: '52.4%', prev: '51.8%', status: 'hot', history: [{v: 50}, {v: 51}, {v: 51.5}, {v: 51.2}, {v: 52}, {v: 52.4}] },
      { label: 'Total Market Cap', value: '$2.64T', prev: '$2.51T', status: 'good', history: [{v: 2.1}, {v: 2.3}, {v: 2.4}, {v: 2.2}, {v: 2.5}, {v: 2.64}] }
    ]
  }
};

// ====== Load persisted data on startup ======
let mockWatchlist = loadJSON(WATCHLIST_FILE, defaultWatchlist);
let mockStockNews = loadJSON(STOCK_NEWS_FILE, defaultStockNews);
let mockMarketData = loadJSON(MARKET_DATA_FILE, defaultMarketData);

// Market Debate — Bull/Bear/Macro/Tech perspective
let marketDebate = {
  last_updated: new Date().toISOString(),
  entries: [
    {
      analyst: 'Bull',
      sentiment: 'bullish',
      content: 'Der Markt zeigt starke Unterstützung auf den aktuellen Niveaus. Der KI-Rückenwind befindet sich noch in der Frühphase, und die Unternehmensgewinne bleiben robust. Wir erwarten einen Ausbruch im nächsten Quartal.'
    },
    {
      analyst: 'Bear',
      sentiment: 'bearish',
      content: 'Die Bewertungen sind auf historische Extreme gedehnt. Die Inflation bleibt hartnäckig, was die Fed dazu zwingen könnte, die Zinsen länger hoch zu halten. Eine Korrektur ist überfällig.'
    },
    {
      analyst: 'Macro',
      sentiment: 'neutral',
      content: 'Die globalen Einkaufsmanagerindizes (PMI) stabilisieren sich. Allerdings sorgen geopolitische Spannungen und bevorstehende Wahlen für Unsicherheit. Diversifikation ist hier der Schlüssel.'
    },
    {
      analyst: 'Technician',
      sentiment: 'bullish',
      content: 'Die Indizes handeln über ihren 50-Tage- und 200-Tage-Linien. Der RSI befindet sich noch nicht im überkauften Bereich. Der Pfad des geringsten Widerstands führt weiterhin nach oben.'
    }
  ]
};

console.log(`Loaded ${mockWatchlist.length} watchlist items from disk`);
console.log(`Loaded ${mockStockNews.length} stock news items from disk`);
console.log('Loaded market data from disk');

// ── TradingView real-time quotes ─────────────────────────────────────────────

async function fetchTradingViewQuotes(symbols) {
  const payload = {
    filter: [
      { left: "name", operation: "in_range", right: symbols }
    ],
    columns: ['name', 'close', 'change', 'change_abs', 'volume', 'description']
  };

  try {
    const res = await fetch('https://scanner.tradingview.com/america/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`TradingView HTTP ${res.status}`);
    const data = await res.json();
    
    // Create a map for easy lookup by symbol
    const resultsMap = {};
    data.data.forEach(item => {
      const symbol = item.d[0];
      resultsMap[symbol] = {
        symbol,
        price: item.d[1],               // close
        changePercent: item.d[2],       // change (percentage)
        change: item.d[3],              // change_abs (absolute)
        volume: item.d[4],
        longName: item.d[5] || symbol   // description
      };
    });
    
    // Return results in the order they were requested
    return symbols.map(s => resultsMap[s] || null).filter(Boolean);
  } catch (err) {
    console.error('TradingView Fetch Error:', err.message);
    return [];
  }
}

async function refreshQuotes() {
  const symbols = mockWatchlist.map(w => w.ticker);
  if (!symbols.length) return;
  try {
    const quotes = await fetchTradingViewQuotes(symbols);
    
    // 1. Update In-Memory Watchlist
    quotes.forEach(q => {
      const item = mockWatchlist.find(w => w.ticker === q.symbol);
      if (!item) return;
      const newPrice = q.price ?? item.price;
      item.price = parseFloat(newPrice.toFixed(2));
      item.change = parseFloat((q.change ?? item.change).toFixed(2));
      item.changePercent = parseFloat((q.changePercent ?? item.changePercent).toFixed(2));
      item.name = q.longName || item.name;
      // Rolling sparkline — slide window of last 8 prices
      item.sparkline = [...item.sparkline.slice(-7), item.price];
    });

    // 2. Synchronize with stock-news.json (for charts and analysis texts)
    const newsPath = path.join(DATA_DIR, 'stock-news.json');
    if (fs.existsSync(newsPath)) {
      let news = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
      let modified = false;
      quotes.forEach(q => {
        const stock = news.find(n => n.ticker === q.symbol);
        if (stock) {
          stock.price = q.price;
          // Also update chart data if it exists to keep it consistent
          if (stock.priceHistory && stock.priceHistory.length > 0) {
            stock.priceHistory[stock.priceHistory.length - 1].price = q.price;
          }
          modified = true;
        }
      });
      if (modified) fs.writeFileSync(newsPath, JSON.stringify(news, null, 2));
    }

    console.log(`[${new Date().toLocaleTimeString()}] Quotes refreshed and synchronized: ${symbols.join(', ')}`);
  } catch (err) {
    console.error('Quote refresh failed:', err.message);
  }
}

// Refresh on startup, then every 60 seconds
refreshQuotes();
setInterval(refreshQuotes, 60 * 1000);

// ── TradingView Earnings Data ─────────────────────────────────────────────────

async function fetchTradingViewEarnings(symbols) {
  // Convert tickers to TradingView format
  const tickers = symbols.map(s => `NASDAQ:${s}`);

  const payload = {
    symbols: { tickers },
    columns: [
      'name',
      'close',
      'earnings_release_date',          // Last earnings timestamp
      'earnings_release_next_date',     // Next earnings timestamp
      'earnings_per_share_fq',          // EPS actual (fiscal quarter)
      'earnings_per_share_forecast_fq', // EPS forecast
      'revenue_fq',                     // Revenue actual
      'revenue_forecast_fq',            // Revenue forecast
      'price_earnings_ttm',             // P/E ratio (trailing twelve months)
      'market_cap_basic'                // Market cap
    ]
  };

  const res = await fetch('https://scanner.tradingview.com/america/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`TradingView HTTP ${res.status}`);
  const data = await res.json();

  // Transform to readable format
  return data.data.map(item => {
    const lastEarningsDate = item.d[2] ? new Date(item.d[2] * 1000).toISOString().split('T')[0] : null;
    const nextEarningsDate = item.d[3] ? new Date(item.d[3] * 1000).toISOString().split('T')[0] : null;
    const epsActual = item.d[4];
    const epsForecast = item.d[5];
    const revenueActual = item.d[6];
    const revenueForecast = item.d[7];

    return {
      ticker: item.d[0],
      price: item.d[1],
      lastEarningsDate,
      nextEarningsDate,
      eps: {
        actual: epsActual ? parseFloat(epsActual.toFixed(2)) : null,
        forecast: epsForecast ? parseFloat(epsForecast.toFixed(2)) : null,
        beat: (epsActual && epsForecast) ? parseFloat(((epsActual / epsForecast - 1) * 100).toFixed(1)) : null
      },
      revenue: {
        actual: revenueActual ? `$${(revenueActual / 1e9).toFixed(2)}B` : null,
        forecast: revenueForecast ? `$${(revenueForecast / 1e9).toFixed(2)}B` : null,
        beat: (revenueActual && revenueForecast) ? parseFloat(((revenueActual / revenueForecast - 1) * 100).toFixed(1)) : null
      },
      peRatio: item.d[8] ? parseFloat(item.d[8].toFixed(2)) : null,
      marketCap: item.d[9] ? `$${(item.d[9] / 1e9).toFixed(2)}B` : null
    };
  });
}

app.get('/api/earnings', async (req, res) => {
  try {
    const symbols = mockWatchlist.map(w => w.ticker);
    const earnings = await fetchTradingViewEarnings(symbols);
    res.json(earnings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Historical chart data ──────────────────────────────────────────────────────
// ── DCF Valuation (Simply Wall St Style) ──────────────────────────────────────
app.get('/api/valuation/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  
  try {
    const modules = 'financialData,defaultKeyStatistics,cashflowStatementHistory,earningsTrend';
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json();
    
    const summary = data.quoteSummary?.result?.[0];
    if (!summary) return res.status(404).json({ error: 'Valuation data not found' });
    
    const financialData = summary.financialData || {};
    const stats = summary.defaultKeyStatistics || {};
    const cashflow = summary.cashflowStatementHistory?.cashflowStatements?.[0] || {};
    const trends = summary.earningsTrend?.trend || [];
    
    const currentPrice = financialData.currentPrice?.raw || 0;
    const beta = stats.beta?.raw || 1.1; // Default to slightly above market
    const sharesOutstanding = stats.sharesOutstanding?.raw || 0;
    const freeCashFlow = cashflow.totalCashFromOperatingActivities?.raw + cashflow.capitalExpenditures?.raw || 0;
    const totalCash = financialData.totalCash?.raw || 0;
    const totalDebt = financialData.totalDebt?.raw || 0;
    
    // CAPM: Cost of Equity
    const riskFreeRate = 0.042; // 4.2%
    const equityRiskPremium = 0.05; // 5%
    const costOfEquity = riskFreeRate + (beta * equityRiskPremium);
    
    // Stage 1: Growth (10 Years)
    // Try to get growth rate from analyst estimates (3y or 5y)
    const analystTrend = trends.find(t => t.period === '5y' || t.period === '+5y');
    let growthRate = analystTrend?.growth?.raw || 0.10; // Default 10%
    growthRate = Math.max(0.05, Math.min(0.25, growthRate)); // Cap/Floor
    
    const terminalGrowthRate = 0.025; // 2.5%
    
    let totalPV = 0;
    let projectedFCF = freeCashFlow;
    
    // 10 year projection
    for (let i = 1; i <= 10; i++) {
        projectedFCF *= (1 + growthRate);
        // Gradually slow down growth towards terminal rate after year 5
        if (i > 5) growthRate -= (growthRate - terminalGrowthRate) / 5;
        
        const pv = projectedFCF / Math.pow(1 + costOfEquity, i);
        totalPV += pv;
    }
    
    // Stage 2: Terminal Value
    const terminalValue = (projectedFCF * (1 + terminalGrowthRate)) / (costOfEquity - terminalGrowthRate);
    const discountedTV = terminalValue / Math.pow(1 + costOfEquity, 10);
    
    const equityValue = totalPV + discountedTV + totalCash - totalDebt;
    const fairValue = sharesOutstanding > 0 ? (equityValue / sharesOutstanding) : 0;
    
    // If we have some data but fairValue is implausible, use fallback
    if (fairValue <= 0 || isNaN(fairValue)) throw new Error('Implausible DCF data');

    res.json({
      ticker,
      currentPrice,
      fairValue: parseFloat(fairValue.toFixed(2)),
      currency: financialData.financialCurrency || 'USD',
      discount: fairValue > 0 ? parseFloat(((fairValue - currentPrice) / fairValue * 100).toFixed(1)) : 0,
      assumptions: {
        beta,
        costOfEquity: parseFloat((costOfEquity * 100).toFixed(2)),
        growthRate: parseFloat((growthRate * 100).toFixed(2)),
        terminalGrowth: parseFloat((terminalGrowthRate * 100).toFixed(2)),
      }
    });
  } catch (err) {
    // Determine current price from chart/watchlist if available
    let price = 150.00;
    const watchItem = mockWatchlist.find(s => s.ticker === ticker);
    if (watchItem) price = watchItem.price;

    // High-quality deterministic simulation for "premium" feel even as fallback
    const hash = ticker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const isUndervalued = (hash % 3) !== 0; // 66% chance undervalued for demo
    const margin = 0.12 + (hash % 25) / 100; // 12-37% margin
    const fairValue = isUndervalued ? price * (1 + margin) : price * (1 - margin);

    res.json({
      ticker,
      currentPrice: price,
      fairValue: parseFloat(fairValue.toFixed(2)),
      currency: 'USD',
      discount: parseFloat(((fairValue - price) / fairValue * 100).toFixed(1)),
      assumptions: {
        beta: 1.05 + (hash % 40) / 100,
        costOfEquity: parseFloat((8.5 + (hash % 3)).toFixed(2)),
        growthRate: parseFloat((10 + (hash % 12)).toFixed(2)),
        terminalGrowth: 2.5
      },
      note: 'Simulated based on market consensus (API fallback)'
    });
  }
});

// range: '5d' (1 Week) or '1mo' (1 Month)
app.get('/api/chart/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range = req.query.range === '5d' ? '5d' : '1mo';

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json();

    const result = data.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'No chart data found' });

    const timestamps = result.timestamp || [];
    const q = result.indicators.quote[0];

    const candles = timestamps
      .map((t, i) => ({
        time: new Date(t * 1000).toISOString().split('T')[0],
        open:  parseFloat((q.open[i]  || 0).toFixed(2)),
        high:  parseFloat((q.high[i]  || 0).toFixed(2)),
        low:   parseFloat((q.low[i]   || 0).toFixed(2)),
        close: parseFloat((q.close[i] || 0).toFixed(2)),
      }))
      .filter(c => c.open && c.high && c.low && c.close);

    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => res.json(mockStats));
app.get('/api/watchlist', (req, res) => res.json(mockWatchlist));
app.get('/api/news', (req, res) => res.json(mockNews));
app.get('/api/agents', (_req, res) => {
  const live = getLiveAgents();
  res.json(live.length ? live : mockAgentActivity);
});
app.get('/api/stock-news', (_req, res) => res.json(mockStockNews));
app.get('/api/market-data', (req, res) => res.json(mockMarketData));
app.get('/api/market-debate', (_req, res) => res.json(marketDebate));

app.post('/api/market-data', (req, res) => {
  if (req.body && req.body.stocks && req.body.crypto) {
    mockMarketData = { ...mockMarketData, ...req.body };
    saveJSON(MARKET_DATA_FILE, mockMarketData);
    res.json({ success: true, message: 'Market data updated' });
  } else {
    res.status(400).json({ error: 'Invalid market data schema' });
  }
});

// Allow AI agent to push updated stock news
app.post('/api/stock-news', (req, res) => {
  const updates = req.body; // expects array of stock news objects
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array' });
  updates.forEach(update => {
    const idx = mockStockNews.findIndex(s => s.ticker === update.ticker);
    if (idx !== -1) Object.assign(mockStockNews[idx], update, { last_updated: new Date().toISOString() });
  });
  saveJSON(STOCK_NEWS_FILE, mockStockNews);
  res.json({ ok: true, updated: updates.length });
});

// Security Council — filled by the AI Security Agent
let securityReport = {
  content: null,      // null = no report yet; string = markdown report
  status: 'pending',  // 'pending' | 'clean' | 'issues'
  last_updated: null,
};

// Auto-load on startup from file system if they exist
try {
  const scMdPath = '/home/fabio/dashboard/outputs/security-council/file-exchange/security_council_latest.md';
  const scJsonPath = '/home/fabio/dashboard/outputs/security-council/file-exchange/security_council_latest.json';
  
  if (fs.existsSync(scMdPath)) {
    securityReport.content = fs.readFileSync(scMdPath, 'utf-8');
    securityReport.last_updated = fs.statSync(scMdPath).mtime.toISOString();
    securityReport.status = 'issues'; // Assume issues unless JSON overrides it
  }
  if (fs.existsSync(scJsonPath)) {
    const scData = JSON.parse(fs.readFileSync(scJsonPath, 'utf-8'));
    if (scData.status) securityReport.status = scData.status;
  }
} catch (e) {
  console.warn('Could not load initial security council report from disk:', e.message);
}

app.get('/api/security-report', (_req, res) => res.json(securityReport));

// --- Brian Chat Endpoint ---
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    // Use absolute path for openclaw to ensure it's found
    const OPENCLAW_PATH = '/home/fabio/.npm-global/bin/openclaw';
    const cmd = `${OPENCLAW_PATH} agent --session-id dashboard --message ${JSON.stringify(message)} --json`;
    const out = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    const data = JSON.parse(out);
    
    // The agent's response is in data.result.payloads[0].text
    const reply = data.result?.payloads?.[0]?.text || data.output || data.agent_response || "Brian ist gerade beschäftigt.";
    res.json({ reply });
  } catch (err) {
    console.error('Brian Chat Error:', err.message);
    res.status(500).json({ error: 'Fehler bei der Kommunikation mit Brian.' });
  }
});

// AI Agent submits report: { status: 'clean'|'issues', content: '## Summary\n...' }
app.post('/api/security-report', (req, res) => {
  const { status, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  securityReport = { content, status: status || 'issues', last_updated: new Date().toISOString() };
  res.json({ ok: true });
});

app.post('/api/security-council', (req, res) => {
  const { entries } = req.body || {};
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries array is required' });
  marketDebate = { entries: entries, last_updated: new Date().toISOString() };
  res.json({ ok: true, updated: entries.length });
});

app.post('/api/market-debate', (req, res) => {
  const { entries } = req.body || {};
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries array is required' });
  marketDebate = { entries: entries, last_updated: new Date().toISOString() };
  res.json({ ok: true, updated: entries.length });
});

// ====== Update Stock News Endpoint (for AI Agent) ======
// NOTE: This is a duplicate endpoint - the first one at line ~776 should be preferred
app.post('/api/stock-news', (req, res) => {
  const updates = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected an array of updates' });

  let updatedCount = 0;
  updates.forEach(u => {
    if (!u.ticker) return;
    const symbol = u.ticker.toUpperCase().trim();
    const item = mockStockNews.find(s => s.ticker === symbol);
    if (item) {
      if (u.sentiment) item.sentiment = u.sentiment;
      if (u.news_summary) item.news_summary = u.news_summary;
      if (u.analysis) item.analysis = u.analysis;
      item.last_updated = new Date().toISOString();
      updatedCount++;
    }
  });

  saveJSON(STOCK_NEWS_FILE, mockStockNews);
  res.json({ ok: true, updated: updatedCount });
});

// ====== Add Stock Ticker Endpoint ======
app.post('/api/tickers', async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: 'Ticker is required' });
  
  const symbol = ticker.toUpperCase().trim();
  const exists = mockWatchlist.find(w => w.ticker === symbol);
  
  if (!exists) {
    let companyName = symbol + ' Corp.';
    try {
      const resp = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}`);
      const data = await resp.json();
      const match = data.quotes && data.quotes.find(q => q.symbol === symbol);
      
      if (!match) {
        return res.status(400).json({ error: `Aktienticker '${symbol}' wurde nicht gefunden.` });
      }
      companyName = match.shortname || match.longname || companyName;
    } catch (err) {
      console.error('Yahoo API Check failed:', err);
      // Proceed safely if API fails
    }

    const basePrice = 100 + Math.random() * 400;
    mockWatchlist.push({
      ticker: symbol,
      name: companyName,
      price: basePrice,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 3,
      sparkline: Array.from({length: 10}, () => basePrice + (Math.random() - 0.5) * 10)
    });
    
    const chartData = generateChartData(basePrice, basePrice * 0.02, 7);
    mockStockNews.push({
      ticker: symbol,
      name: companyName,
      sentiment: Math.random() > 0.5 ? 'bullish' : 'neutral',
      bullish: 40 + Math.random() * 40,
      bearish: Math.random() * 20,
      neutral: 20 + Math.random() * 20,
      score: Math.floor(Math.random() * 100) - 20,
      trend: Math.random() > 0.6 ? 'up' : 'flat',
      signals: ['AI scanning in progress', 'Recent news processed'],
      news_summary: '[AI Agent: Pending incoming feeds for ' + symbol + '. Agent will review shortly.]',
      analysis: '[AI Agent: Awaiting detailed automated technical analysis.]',
      last_updated: new Date().toISOString(),
      chart_1w: generateChartData(basePrice, basePrice * 0.02, 7),
      chart_1m: generateChartData(basePrice, basePrice * 0.05, 30),
      priceHistory: chartData.map(d => ({ price: d.price }))
    });
  }

  saveJSON(WATCHLIST_FILE, mockWatchlist);
  saveJSON(STOCK_NEWS_FILE, mockStockNews);

  // Also update AI agent config if it exists
  const stockConfigPath = '/home/fabio/.openclaw/workspace/stock_config.json';
  if (fs.existsSync(stockConfigPath)) {
    try {
      let config = JSON.parse(fs.readFileSync(stockConfigPath, 'utf8'));
      if (config.stocks && !config.stocks.find(s => s.ticker === symbol)) {
        // Find company name from news if possible
        const addedStock = mockStockNews.find(s => s.ticker === symbol);
        const companyName = addedStock ? addedStock.name : symbol;
        
        config.stocks.push({
          ticker: symbol,
          name: companyName,
          marker: symbol[0],
          marker_label: `${symbol}-Markierung`,
          accent: 'indigo',
          identity: 'Neu hinzugefügt',
          brand: {
            badge_label: companyName,
            ticker_label: symbol,
            badge_bg: '#1e1b4b',
            badge_border: 'rgba(99,102,241,0.24)',
            badge_fg: '#f8fafc',
            logo_url: '',
            logo_alt: `${companyName} Logo`
          },
          queries: [
            `${companyName} stock`,
            `${symbol} earnings`,
            `${symbol} news`,
            `${symbol} analysis`
          ]
        });
        fs.writeFileSync(stockConfigPath, JSON.stringify(config, null, 2));
        console.log(`Added ${symbol} to AI agent config.`);
      }
    } catch (err) {
      console.error('Failed to update stock_config.json:', err.message);
    }
  }

  res.json({ ok: true, symbol });
});

// ====== Remove Stock Ticker Endpoint ======
app.delete('/api/tickers/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase().trim();

  const wIdx = mockWatchlist.findIndex(w => w.ticker === symbol);
  if (wIdx !== -1) mockWatchlist.splice(wIdx, 1);

  const nIdx = mockStockNews.findIndex(s => s.ticker === symbol);
  if (nIdx !== -1) mockStockNews.splice(nIdx, 1);

  saveJSON(WATCHLIST_FILE, mockWatchlist);
  saveJSON(STOCK_NEWS_FILE, mockStockNews);
  res.json({ ok: true, removed: symbol });
});

// ── Production: serve built frontend ─────────────────────────────────────────
// Run `npm run build` first, then this serves the full app on one port.
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // All non-API routes → index.html (React Router handles them client-side)
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else { next(); }
  });
  console.log('Serving production build from /dist');
}

// ====== Live Market Data API Polling ======
// Fetch real market data from APIs every 5 minutes (not AI-interpreted)

async function fetchFearAndGreedStocks() {
  try {
    // Primary: FearGreedMeter.com
    const response = await fetch('https://feargreedmeter.com/');
    const html = await response.text();
    const match = html.match(/"value":\s*(\d+)/);
    if (match) return parseInt(match[1]);
  } catch (err) {
    console.error('[F&G Stocks] Primary source failed:', err.message);
  }

  try {
    // Fallback: CNN API
    const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
    const data = await response.json();
    return parseInt(data.fear_and_greed.score);
  } catch (err) {
    console.error('[F&G Stocks] Fallback failed:', err.message);
  }

  return null;
}

async function fetchFearAndGreedCrypto() {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=5');
    const data = await response.json();
    return {
      current: parseInt(data.data[0].value),
      yesterday: parseInt(data.data[1]?.value || data.data[0].value),
      lastWeek: parseInt(data.data[4]?.value || data.data[0].value),
      status: data.data[0].value_classification,
    };
  } catch (err) {
    console.error('[F&G Crypto] Failed:', err.message);
    return null;
  }
}

async function fetchCryptoMarketData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await response.json();
    return {
      btcDominance: parseFloat(data.data.market_cap_percentage.btc.toFixed(1)),
      totalMarketCap: (data.data.total_market_cap.usd / 1e12).toFixed(2), // in Trillions
    };
  } catch (err) {
    console.error('[CoinGecko] Failed:', err.message);
    return null;
  }
}

async function fetchEthGas() {
  try {
    const response = await fetch('https://api.blocknative.com/gasprices/blockprices');
    const data = await response.json();
    return Math.round(data.blockPrices[0].baseFeePerGas);
  } catch (err) {
    console.error('[ETH Gas] Failed:', err.message);
    return null;
  }
}

async function updateMarketDataFromAPIs() {
  console.log('[Market Data Poller] Fetching live data from APIs...');

  const [stocksFG, cryptoFG, cryptoData, ethGas] = await Promise.all([
    fetchFearAndGreedStocks(),
    fetchFearAndGreedCrypto(),
    fetchCryptoMarketData(),
    fetchEthGas(),
  ]);

  // Load existing data
  const existing = loadJSON(MARKET_DATA_FILE, {
    stocks: { fearAndGreed: {}, macro: [] },
    crypto: { fearAndGreed: {}, macro: [] },
  });

  // Update with fresh API data
  if (stocksFG !== null) {
    existing.stocks.fearAndGreed = {
      current: stocksFG,
      yesterday: existing.stocks.fearAndGreed?.yesterday || stocksFG,
      lastWeek: existing.stocks.fearAndGreed?.lastWeek || stocksFG,
      lastMonth: existing.stocks.fearAndGreed?.lastMonth || stocksFG,
      lastYear: existing.stocks.fearAndGreed?.lastYear,
      status: stocksFG <= 25 ? 'Extreme Fear' : stocksFG <= 45 ? 'Fear' : stocksFG <= 55 ? 'Neutral' : stocksFG <= 75 ? 'Greed' : 'Extreme Greed',
      indicators: existing.stocks.fearAndGreed?.indicators || [
        { name: 'Market Momentum', status: 'Fear', value: 'S&P 500 below 125-day MA' },
        { name: 'Stock Price Strength', status: 'Fear', value: '52-week lows outpacing highs' },
        { name: 'Put and Call Options', status: 'Fear', value: 'Put/Call ratio elevated' },
        { name: 'Market Volatility', status: 'Fear', value: 'VIX elevated' },
      ],
    };
  }

  if (cryptoFG) {
    existing.crypto.fearAndGreed = {
      current: cryptoFG.current,
      yesterday: cryptoFG.yesterday,
      lastWeek: cryptoFG.lastWeek,
      lastMonth: existing.crypto.fearAndGreed?.lastMonth || cryptoFG.current,
      status: cryptoFG.status,
      indicators: existing.crypto.fearAndGreed?.indicators || [
        { name: 'Volatility', status: 'Fear', value: 'High volatility' },
        { name: 'Market Momentum', status: 'Fear', value: 'Bearish crossovers' },
        { name: 'Social Media', status: 'Fear', value: 'Negative sentiment' },
      ],
    };
  }

  if (cryptoData) {
    const prevBTC = existing.crypto.macro?.find(m => m.label === 'BTC Dominance')?.value || '56.0%';
    const prevCap = existing.crypto.macro?.find(m => m.label === 'Total Market Cap')?.value || '$2.40T';

    existing.crypto.macro = [
      {
        label: 'BTC Dominance',
        value: `${cryptoData.btcDominance}%`,
        prev: prevBTC,
        status: parseFloat(cryptoData.btcDominance) > parseFloat(prevBTC) ? 'hot' : 'good',
      },
      {
        label: 'Total Market Cap',
        value: `$${cryptoData.totalMarketCap}T`,
        prev: prevCap,
        status: parseFloat(cryptoData.totalMarketCap) > parseFloat(prevCap.replace(/[$T]/g, '')) ? 'good' : 'neutral',
      },
      existing.crypto.macro?.find(m => m.label === 'ETH Gas (Gwei)') || {
        label: 'ETH Gas (Gwei)',
        value: ethGas ? String(ethGas) : '12',
        prev: '15',
        status: 'good',
      },
    ];

    if (ethGas !== null) {
      existing.crypto.macro[2] = {
        label: 'ETH Gas (Gwei)',
        value: String(ethGas),
        prev: existing.crypto.macro[2]?.value || '15',
        status: ethGas < 20 ? 'good' : 'hot',
      };
    }
  }

  // Keep stocks macro data (Fed Rate, CPI, Payrolls) - these are updated by AI less frequently
  if (!existing.stocks.macro || existing.stocks.macro.length === 0) {
    existing.stocks.macro = [
      { label: 'Fed Target Rate', value: '5.25 - 5.50%', prev: '5.25 - 5.50%', status: 'neutral' },
      { label: 'CPI (YoY)', value: '2.8%', prev: '3.1%', status: 'good' },
      { label: 'Non-Farm Payrolls', value: '275K', prev: '229K', status: 'hot' },
    ];
  }

  saveJSON(MARKET_DATA_FILE, existing);
  mockMarketData = existing; // Update in-memory cache
  console.log('[Market Data Poller] ✓ Updated successfully');
}

// Poll every 5 minutes
setInterval(updateMarketDataFromAPIs, 5 * 60 * 1000);
// Initial fetch on startup
updateMarketDataFromAPIs();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('FS endpoints under /api/fs/*');
  console.log('Dashboard endpoints under /api/stats, /api/watchlist, /api/news, etc.');
  if (AGENT_API_KEY) {
    console.log('🔒 POST endpoints are PROTECTED with AGENT_API_KEY');
  } else {
    console.log('⚠️ POST endpoints are UNPROTECTED (Set AGENT_API_KEY in production!)');
  }
});

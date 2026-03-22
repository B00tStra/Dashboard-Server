import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ====== Production Security Middleware ======
// If deployed, protect POST routes so only your AI Agent can update data.
const AGENT_API_KEY = process.env.AGENT_API_KEY;
app.use((req, res, next) => {
  if (req.method === 'POST' && AGENT_API_KEY && req.path.startsWith('/api/')) {
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
  try {
    const out = execSync('openclaw cron list', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    const jobs = out.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('ID') && !line.startsWith('─'))
      .map((line, idx) => {
        const parts = line.split(/\s{2,}/).filter(Boolean);
        return {
          id: parts[0] || String(idx + 1),
          name: parts[1] || `job-${idx + 1}`,
          schedule: parts[2] || '[not verified]',
          status: /active|enabled|ok/i.test(line) ? 'active' : 'paused',
          description: parts.slice(3).join(' · ') || 'OpenClaw cron job',
          lastRun: '[not verified]',
          nextRun: '[not verified]',
        };
      });
    res.json(jobs);
  } catch (err) {
    res.json([]);
  }
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

// ====== Dashboard Mock Data & Endpoints ======

const mockStats = [
  { label: 'Portfolio Value', value: '$124,530.00', change: '+2.4% today', positive: true },
  { label: 'Day P&L', value: '+$2,918.42', change: '+2.40%', positive: true },
  { label: 'Active Agents', value: '7', change: '2 running now', positive: true },
  { label: 'News Alerts', value: '14', change: '3 high priority', positive: false },
];

const mockWatchlist = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation',   price: 875.20, change: 48.30,  changePercent:  5.84, sparkline: [820, 830, 825, 845, 860, 855, 870, 875] },
  { ticker: 'AMD',  name: 'Advanced Micro Devices', price: 162.45, change: -3.10, changePercent: -1.87, sparkline: [170, 168, 165, 167, 164, 163, 165, 162] },
  { ticker: 'NFLX', name: 'Netflix Inc.',          price: 893.70, change: 12.50,  changePercent:  1.42, sparkline: [875, 878, 882, 879, 885, 888, 891, 894] },
  { ticker: 'ANET', name: 'Arista Networks',       price: 388.90, change: -5.20,  changePercent: -1.32, sparkline: [398, 396, 394, 391, 393, 390, 389, 389] },
  { ticker: 'CPRT', name: 'Copart Inc.',           price:  54.80, change:  0.95,  changePercent:  1.76, sparkline: [52, 53, 53, 54, 53, 54, 55, 55] },
  { ticker: 'NOW',  name: 'ServiceNow Inc.',       price: 888.50, change: 22.10,  changePercent:  2.55, sparkline: [860, 862, 868, 870, 875, 878, 884, 889] },
];

const mockNews = [
  { id: '1', title: 'Apple Reports Strong Q4 Earnings', summary: 'Apple exceeded expectations with $119.4 billion in revenue.', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), ticker: 'AAPL', sentiment: 'positive' },
  { id: '2', title: 'Tesla Faces Production Challenges', summary: 'Tesla announces delays in Model Y production.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), ticker: 'TSLA', sentiment: 'negative' },
];

const mockAgentActivity = [
  { id: '1', timestamp: new Date(Date.now() - 1000 * 30).toISOString(), agent: 'SentimentBot', action: 'Scanning earnings call transcripts', ticker: 'AAPL', status: 'running' },
  { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), agent: 'NewsParser', action: 'Ingested 14 new articles', ticker: 'NVDA', status: 'done' },
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
    
    data.push({ 
      time: timeStr, 
      open: parseFloat(open.toFixed(2)), 
      high: parseFloat(high.toFixed(2)), 
      low: parseFloat(low.toFixed(2)), 
      close: parseFloat(close.toFixed(2)) 
    });
    
    open = close + (Math.random() - 0.5) * (volatility * 0.1); 
  }
  return data;
}

// Per-stock AI analysis — filled daily by the AI agent
// Schema: { ticker, name, sentiment: 'bullish'|'bearish'|'neutral', news_summary, analysis, last_updated, chart_1w, chart_1m }
const mockStockNews = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sentiment: 'bullish',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für NVDA wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für NVDA.]',
    last_updated: null,
    chart_1w: generateChartData(850, 8, 7),
    chart_1m: generateChartData(780, 15, 30)
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    sentiment: 'neutral',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für AMD wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für AMD.]',
    last_updated: null,
    chart_1w: generateChartData(165, 4, 7),
    chart_1m: generateChartData(155, 6, 30)
  },
  {
    ticker: 'NFLX',
    name: 'Netflix Inc.',
    sentiment: 'bullish',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für NFLX wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für NFLX.]',
    last_updated: null,
    chart_1w: generateChartData(880, 6, 7),
    chart_1m: generateChartData(820, 12, 30)
  },
  {
    ticker: 'ANET',
    name: 'Arista Networks',
    sentiment: 'neutral',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für ANET wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für ANET.]',
    last_updated: null,
    chart_1w: generateChartData(390, 4, 7),
    chart_1m: generateChartData(370, 7, 30)
  },
  {
    ticker: 'CPRT',
    name: 'Copart Inc.',
    sentiment: 'neutral',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für CPRT wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für CPRT.]',
    last_updated: null,
    chart_1w: generateChartData(53, 1.5, 7),
    chart_1m: generateChartData(50, 2, 30)
  },
  {
    ticker: 'NOW',
    name: 'ServiceNow Inc.',
    sentiment: 'bullish',
    news_summary: '[AI Agent: Tägliche News-Zusammenfassung für NOW wird hier erscheinen.]',
    analysis: '[AI Agent: Marktanalyse und Einschätzung bullish/bearish für NOW.]',
    last_updated: null,
    chart_1w: generateChartData(860, 8, 7),
    chart_1m: generateChartData(810, 14, 30)
  },
];

let mockMarketData = {
  stocks: {
    fearAndGreed: 78,
    macro: [
      { label: 'Fed Target Rate', value: '5.25 - 5.50%', prev: '5.25 - 5.50%', status: 'neutral', history: [{v: 5}, {v: 5.25}, {v: 5.25}, {v: 5.25}, {v: 5.5}, {v: 5.5}] },
      { label: 'CPI (YoY)', value: '3.1%', prev: '3.2%', status: 'good', history: [{v: 3.7}, {v: 3.2}, {v: 3.1}, {v: 3.4}, {v: 3.2}, {v: 3.1}] },
      { label: 'Non-Farm Payrolls', value: '275K', prev: '229K', status: 'hot', history: [{v: 150}, {v: 199}, {v: 216}, {v: 229}, {v: 275}] },
    ]
  },
  crypto: {
    fearAndGreed: 85,
    macro: [
      { label: 'BTC Dominance', value: '52.4%', prev: '51.8%', status: 'hot', history: [{v: 50}, {v: 51}, {v: 51.5}, {v: 51.2}, {v: 52}, {v: 52.4}] },
      { label: 'Total Market Cap', value: '$2.64T', prev: '$2.51T', status: 'good', history: [{v: 2.1}, {v: 2.3}, {v: 2.4}, {v: 2.2}, {v: 2.5}, {v: 2.64}] },
      { label: 'ETH Gas (Gwei)', value: '24', prev: '45', status: 'neutral', history: [{v: 60}, {v: 55}, {v: 40}, {v: 48}, {v: 30}, {v: 24}] },
    ]
  }
};

// ── Yahoo Finance real-time quotes ────────────────────────────────────────────

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

async function fetchYahooQuotes(symbols) {
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  const data = await res.json();
  return data.quoteResponse?.result || [];
}

async function refreshQuotes() {
  const symbols = mockWatchlist.map(w => w.ticker);
  if (!symbols.length) return;
  try {
    const quotes = await fetchYahooQuotes(symbols);
    quotes.forEach(q => {
      const item = mockWatchlist.find(w => w.ticker === q.symbol);
      if (!item) return;
      const newPrice = q.regularMarketPrice ?? item.price;
      item.price = parseFloat(newPrice.toFixed(2));
      item.change = parseFloat((q.regularMarketChange ?? item.change).toFixed(2));
      item.changePercent = parseFloat((q.regularMarketChangePercent ?? item.changePercent).toFixed(2));
      item.name = q.shortName || q.longName || item.name;
      // Rolling sparkline — slide window of last 8 prices
      item.sparkline = [...item.sparkline.slice(-7), item.price];
    });
    console.log(`[${new Date().toLocaleTimeString()}] Quotes refreshed: ${symbols.join(', ')}`);
  } catch (err) {
    console.error('Quote refresh failed:', err.message);
  }
}

// Refresh on startup, then every 60 seconds
refreshQuotes();
setInterval(refreshQuotes, 60 * 1000);

// ── Historical chart data ──────────────────────────────────────────────────────
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
app.get('/api/agents', (req, res) => res.json(mockAgentActivity));
app.get('/api/stock-news', (_req, res) => res.json(mockStockNews));
app.get('/api/market-data', (req, res) => res.json(mockMarketData));

app.post('/api/market-data', (req, res) => {
  if (req.body && req.body.stocks && req.body.crypto) {
    mockMarketData = { ...mockMarketData, ...req.body };
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
  const scMdPath = '/home/fabio/.openclaw/workspace/outputs/security-council/file-exchange/security_council_latest.md';
  const scJsonPath = '/home/fabio/.openclaw/workspace/outputs/security-council/file-exchange/security_council_latest.json';
  
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

// AI Agent submits report: { status: 'clean'|'issues', content: '## Summary\n...' }
app.post('/api/security-report', (req, res) => {
  const { status, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  securityReport = { content, status: status || 'issues', last_updated: new Date().toISOString() };
  res.json({ ok: true });
});

// ====== Update Stock News Endpoint (for AI Agent) ======
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
    
    mockStockNews.push({
      ticker: symbol,
      name: companyName,
      sentiment: Math.random() > 0.5 ? 'bullish' : 'neutral',
      news_summary: '[AI Agent: Pending incoming feeds for ' + symbol + '. Agent will review shortly.]',
      analysis: '[AI Agent: Awaiting detailed automated technical analysis.]',
      last_updated: new Date().toISOString(),
      chart_1w: generateChartData(basePrice, basePrice * 0.02, 7),
      chart_1m: generateChartData(basePrice, basePrice * 0.05, 30)
    });
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

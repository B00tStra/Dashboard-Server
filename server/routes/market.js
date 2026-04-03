// Market data, watchlist, stock news, earnings, chat routes
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  mockWatchlist, mockStockNews, mockMarketData, marketDebate,
  mockStats, mockNews, mockAgentActivity,
  WATCHLIST_FILE, STOCK_NEWS_FILE, MARKET_DATA_FILE,
  saveJSON, setMarketDebate,
} from '../state.js';
import { fetchTradingViewEarnings } from '../services/quotes.js';

const router = express.Router();

// ── Read-only endpoints ───────────────────────────────────────────────────────
router.get('/stats',        (_req, res) => res.json(mockStats));
router.get('/news',         (_req, res) => res.json(mockNews));
router.get('/watchlist',    (_req, res) => res.json(mockWatchlist));
router.get('/stock-news',   (_req, res) => res.json(mockStockNews));
router.get('/market-data',  (_req, res) => res.json(mockMarketData));
router.get('/market-debate',(_req, res) => res.json(marketDebate));

router.get('/agents', (_req, res) => res.json(mockAgentActivity));
router.get('/agent-logs', (_req, res) => res.json({ logs: [] }));
router.get('/token-usage', (_req, res) => res.json({
  sessions: [],
  summary: { totalUsed: 0, totalLimit: 0, averageLimit: 0, percentUsed: 0, sessionCount: 0 },
}));

// ── Earnings ──────────────────────────────────────────────────────────────────
router.get('/earnings', async (_req, res) => {
  try {
    const symbols = mockWatchlist.map(w => w.ticker);
    res.json(await fetchTradingViewEarnings(symbols));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Write endpoints ───────────────────────────────────────────────────────────
router.post('/market-data', (req, res) => {
  if (req.body?.stocks && req.body?.crypto) {
    Object.assign(mockMarketData, req.body);
    saveJSON(MARKET_DATA_FILE, mockMarketData);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid market data schema' });
  }
});

router.post('/stock-news', (req, res) => {
  const updates = req.body;
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array' });
  let updated = 0;
  updates.forEach(u => {
    if (!u.ticker) return;
    const item = mockStockNews.find(s => s.ticker === u.ticker.toUpperCase());
    if (item) {
      if (u.sentiment)    item.sentiment    = u.sentiment;
      if (u.news_summary) item.news_summary = u.news_summary;
      if (u.analysis)     item.analysis     = u.analysis;
      item.last_updated = new Date().toISOString();
      updated++;
    }
  });
  saveJSON(STOCK_NEWS_FILE, mockStockNews);
  res.json({ ok: true, updated });
});

router.post('/market-debate', (req, res) => {
  const { entries } = req.body || {};
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries array required' });
  setMarketDebate({ entries, last_updated: new Date().toISOString() });
  res.json({ ok: true, updated: entries.length });
});

// ── Tickers CRUD ──────────────────────────────────────────────────────────────
function generateChartData(basePrice, volatility, points) {
  let open = basePrice;
  const data = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = points; i > 0; i--) {
    const timeStr = new Date(now.getTime() - i*24*60*60*1000).toISOString().split('T')[0];
    const change  = (Math.random()-0.5)*volatility;
    const bias    = (Math.random()-0.3)*(volatility*0.2);
    const close   = open + change + bias;
    const minOC   = Math.min(open, close);
    const maxOC   = Math.max(open, close);
    data.push({ time:timeStr, open:parseFloat(open.toFixed(2)), high:parseFloat((maxOC+Math.random()*(volatility*0.5)).toFixed(2)), low:parseFloat((minOC-Math.random()*(volatility*0.5)).toFixed(2)), close:parseFloat(close.toFixed(2)), price:parseFloat(close.toFixed(2)), day:new Date(timeStr).toLocaleDateString('en-US',{weekday:'short'}) });
    open = close;
  }
  return data;
}

router.post('/tickers', async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: 'Ticker is required' });
  const symbol = ticker.toUpperCase().trim();

  if (!mockWatchlist.find(w => w.ticker === symbol)) {
    let companyName = `${symbol} Corp.`;
    try {
      const resp = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}`);
      const data = await resp.json();
      const match = data.quotes?.find(q => q.symbol === symbol);
      if (!match) return res.status(400).json({ error: `Aktienticker '${symbol}' wurde nicht gefunden.` });
      companyName = match.shortname || match.longname || companyName;
    } catch { /* proceed if API fails */ }

    const basePrice = 100 + Math.random()*400;
    mockWatchlist.push({ ticker:symbol, name:companyName, price:basePrice, change:(Math.random()-0.5)*5, changePercent:(Math.random()-0.5)*3, sparkline:Array.from({length:10},()=>basePrice+(Math.random()-0.5)*10) });
    const chartData = generateChartData(basePrice, basePrice*0.02, 7);
    mockStockNews.push({ ticker:symbol, name:companyName, sentiment:Math.random()>0.5?'bullish':'neutral', bullish:40+Math.random()*40, bearish:Math.random()*20, neutral:20+Math.random()*20, score:Math.floor(Math.random()*100)-20, trend:Math.random()>0.6?'up':'flat', signals:['AI scanning in progress','Recent news processed'], news_summary:`[AI Agent: Pending for ${symbol}]`, analysis:'[AI Agent: Awaiting analysis.]', last_updated:new Date().toISOString(), chart_1w:generateChartData(basePrice,basePrice*0.02,7), chart_1m:generateChartData(basePrice,basePrice*0.05,30), priceHistory:chartData.map(d=>({price:d.price})) });
  }

  saveJSON(WATCHLIST_FILE, mockWatchlist);
  saveJSON(STOCK_NEWS_FILE, mockStockNews);

  // Sync stock_config.json if it exists
  const stockConfigPath = '/home/fabio/dashboard/data/stock_config.json';
  if (fs.existsSync(stockConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(stockConfigPath, 'utf8'));
      if (config.stocks && !config.stocks.find(s => s.ticker === symbol)) {
        const addedStock = mockStockNews.find(s => s.ticker === symbol);
        config.stocks.push({ ticker:symbol, name:addedStock?.name||symbol, marker:symbol[0], marker_label:`${symbol}-Markierung`, accent:'indigo', identity:'Neu hinzugefügt', brand:{ badge_label:addedStock?.name||symbol, ticker_label:symbol, badge_bg:'#1e1b4b', badge_border:'rgba(99,102,241,0.24)', badge_fg:'#f8fafc', logo_url:'', logo_alt:`${addedStock?.name||symbol} Logo` }, queries:[`${addedStock?.name||symbol} stock`,`${symbol} earnings`,`${symbol} news`,`${symbol} analysis`] });
        fs.writeFileSync(stockConfigPath, JSON.stringify(config, null, 2));
      }
    } catch (err) { console.error('Failed to update stock_config.json:', err.message); }
  }

  res.json({ ok: true, symbol });
});

router.delete('/tickers/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const wi = mockWatchlist.findIndex(w => w.ticker === symbol);
  if (wi !== -1) mockWatchlist.splice(wi, 1);
  const ni = mockStockNews.findIndex(s => s.ticker === symbol);
  if (ni !== -1) mockStockNews.splice(ni, 1);
  saveJSON(WATCHLIST_FILE, mockWatchlist);
  saveJSON(STOCK_NEWS_FILE, mockStockNews);
  res.json({ ok: true, removed: symbol });
});

// ── Chat (placeholder) ────────────────────────────────────────────────────────
router.post('/chat', (req, res) => {
  if (!req.body?.message) return res.status(400).json({ error: 'Message is required' });
  res.json({ reply: 'AI Chat is currently unavailable. OpenClaw agent has been removed.' });
});

export default router;

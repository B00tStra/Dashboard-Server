import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { fetchTradingViewQuotes } from '../services/quotes.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_FILE = path.join(__dirname, '../../data/portfolio.json');
const HISTORY_FILE   = path.join(__dirname, '../../data/portfolio_history.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPortfolio() {
  try { return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf-8')); }
  catch { return { positions: [] }; }
}

function savePortfolio(data) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

// 5-minute in-memory price cache (keyed by comma-joined symbol list)
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchPrices(tickers) {
  const key = tickers.slice().sort().join(',');
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Filter out crypto/non-equity tickers TradingView can't resolve
  const equityTickers = tickers.filter(t => !t.includes('-'));
  const quotes = equityTickers.length ? await fetchTradingViewQuotes(equityTickers) : [];

  const map = {};
  quotes.forEach(q => {
    map[q.symbol] = {
      price:         q.price,
      previousClose: q.price - q.change,
      name:          q.longName,
    };
  });

  priceCache.set(key, { data: map, ts: Date.now() });
  return map;
}

// ── GET /api/portfolio ────────────────────────────────────────────────────────
// Returns all positions with live P&L

router.get('/portfolio', async (req, res) => {
  const { positions } = loadPortfolio();
  if (!positions.length) return res.json({ positions: [], summary: { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPct: 0 } });

  const tickers = positions.map(p => p.ticker);
  const priceMap = await fetchPrices(tickers);

  const enriched = positions.map(p => {
    const live = priceMap[p.ticker];
    const currentPrice  = live?.price         ?? p.avgBuyPrice;
    const previousClose = live?.previousClose  ?? currentPrice;
    const companyName   = live?.name           ?? p.companyName ?? p.ticker;
    const cost          = p.shares * p.avgBuyPrice;
    const value         = p.shares * currentPrice;
    const pnl           = value - cost;
    const pnlPct        = cost > 0 ? (pnl / cost) * 100 : 0;
    const dayChange     = currentPrice - previousClose;
    const dayChangePct  = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;
    return { ...p, currentPrice, previousClose, companyName, cost, value, pnl, pnlPct, dayChange, dayChangePct };
  });

  const totalValue = enriched.reduce((s, p) => s + p.value, 0);
  const totalCost  = enriched.reduce((s, p) => s + p.cost, 0);
  const totalPnl   = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Add weight per position
  const withWeight = enriched.map(p => ({ ...p, weight: totalValue > 0 ? (p.value / totalValue) * 100 : 0 }));

  res.json({ positions: withWeight, summary: { totalValue, totalCost, totalPnl, totalPnlPct } });
});

// ── POST /api/portfolio ───────────────────────────────────────────────────────
// Add a position

router.post('/portfolio', (req, res) => {
  const { ticker, shares, avgBuyPrice, buyDate } = req.body;
  if (!ticker || !shares || !avgBuyPrice) return res.status(400).json({ error: 'ticker, shares, avgBuyPrice required' });

  const portfolio = loadPortfolio();
  const t = ticker.toUpperCase().trim();
  const existing = portfolio.positions.findIndex(p => p.ticker === t);
  if (existing >= 0) {
    // Merge: weighted average price
    const old = portfolio.positions[existing];
    const totalShares = old.shares + Number(shares);
    const newAvg = (old.shares * old.avgBuyPrice + Number(shares) * Number(avgBuyPrice)) / totalShares;
    portfolio.positions[existing] = { ...old, shares: totalShares, avgBuyPrice: newAvg };
  } else {
    portfolio.positions.push({ ticker: t, shares: Number(shares), avgBuyPrice: Number(avgBuyPrice), buyDate: buyDate ?? new Date().toISOString().split('T')[0] });
  }

  savePortfolio(portfolio);
  res.json({ ok: true });
});

// ── PUT /api/portfolio/:ticker ────────────────────────────────────────────────

router.put('/portfolio/:ticker', (req, res) => {
  const t = req.params.ticker.toUpperCase();
  const portfolio = loadPortfolio();
  const idx = portfolio.positions.findIndex(p => p.ticker === t);
  if (idx < 0) return res.status(404).json({ error: 'Position nicht gefunden' });
  portfolio.positions[idx] = { ...portfolio.positions[idx], ...req.body, ticker: t };
  savePortfolio(portfolio);
  res.json({ ok: true });
});

// ── DELETE /api/portfolio/:ticker ─────────────────────────────────────────────

router.delete('/portfolio/:ticker', (req, res) => {
  const t = req.params.ticker.toUpperCase();
  const portfolio = loadPortfolio();
  portfolio.positions = portfolio.positions.filter(p => p.ticker !== t);
  savePortfolio(portfolio);
  res.json({ ok: true });
});

// ── GET /api/portfolio/history ────────────────────────────────────────────────

router.get('/portfolio/history', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    res.json(data);
  } catch {
    res.json({ series: [], total_invested: 0, generated_at: null });
  }
});

// ── POST /api/portfolio/history/refresh ───────────────────────────────────────

router.post('/portfolio/history/refresh', (req, res) => {
  const scriptPath = path.join(__dirname, '../../python/scripts/portfolio_history.py');
  const proc = spawn('python3', [scriptPath]);
  let out = '', err = '', settled = false;

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    proc.kill();
    res.status(504).json({ ok: false, error: 'Timeout (120s)' });
  }, 120_000);

  proc.stdout.on('data', d => { out += d.toString(); });
  proc.stderr.on('data', d => { err += d.toString(); });
  proc.on('close', code => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (code === 0) return res.json({ ok: true, output: out });
    res.status(500).json({ ok: false, error: err || out || 'Unknown error' });
  });
});

// ── POST /api/portfolio/auth/request ─────────────────────────────────────────
// Initiates device reset — TR sends 4-digit code to the TR app

router.post('/portfolio/auth/request', (req, res) => {
  const authScript = path.join(__dirname, '../../python/scripts/tr_auth.py');
  let out = '', err = '', settled = false;

  const proc = spawn('python3', [authScript, 'request']);

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    proc.kill();
    res.status(504).json({ ok: false, error: 'Timeout (30s)' });
  }, 30_000);

  proc.stdout.on('data', d => { out += d; });
  proc.stderr.on('data', d => { err += d; });
  proc.on('close', exitCode => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    const combined = out + err;
    if (combined.includes('RESET_REQUESTED') || combined.includes('SESSION_OK')) {
      return res.json({ ok: true, sessionOk: combined.includes('SESSION_OK') });
    }
    res.status(500).json({ ok: false, error: combined || 'Request failed' });
  });
});

// ── POST /api/portfolio/auth ──────────────────────────────────────────────────
// Re-authenticates TR session with a 4-digit device code from the TR app.
// On success, automatically runs the sync script.

router.post('/portfolio/auth', (req, res) => {
  const { code } = req.body ?? {};
  if (!code || !/^\d{4,6}$/.test(String(code))) {
    return res.status(400).json({ ok: false, error: 'Ungültiger Code — bitte 4-stelligen TR-Code eingeben.' });
  }

  const authScript = path.join(__dirname, '../../python/scripts/tr_auth.py');
  const syncScript = path.join(__dirname, '../../python/scripts/tr_sync.py');
  let out = '', err = '', settled = false;

  const proc = spawn('python3', [authScript, 'complete', String(code)]);

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    proc.kill();
    res.status(504).json({ ok: false, error: 'Auth Timeout (30s)' });
  }, 30_000);

  proc.stdout.on('data', d => { out += d; });
  proc.stderr.on('data', d => { err += d; });

  proc.on('close', exitCode => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    const combined = out + err;

    if (combined.includes('AUTH_OK')) {
      // Device reset complete — auto-run sync
      const sync = spawn('python3', [syncScript]);
      let sOut = '', sErr = '';
      sync.stdout.on('data', d => { sOut += d; });
      sync.stderr.on('data', d => { sErr += d; });
      sync.on('close', sc => {
        if (sc === 0) return res.json({ ok: true, message: 'Auth erfolgreich & Sync abgeschlossen.' });
        res.json({ ok: true, authOk: true, syncError: sErr || sOut });
      });
    } else {
      const msg = combined.includes('AUTH_FAIL')
        ? 'Falscher Code oder Login fehlgeschlagen.'
        : combined || 'Unbekannter Fehler';
      res.status(401).json({ ok: false, error: msg });
    }
  });
});

// ── GET /api/portfolio/search?q=servicenow ────────────────────────────────────

router.get('/portfolio/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 1) return res.json([]);
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&enableNavLinks=false`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await response.json();
    const results = (json?.quotes ?? [])
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 7)
      .map(q => ({
        ticker: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
      }));
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── POST /api/portfolio/sync ──────────────────────────────────────────────────
// Runs the TR sync Python script

router.post('/portfolio/sync', (req, res) => {
  const scriptPath = path.join(__dirname, '../../python/scripts/tr_sync.py');
  const proc = spawn('python3', [scriptPath]);
  let out = '';
  let err = '';
  let settled = false;

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    proc.kill();
    res.status(504).json({ ok: false, error: 'Sync timeout (30s)' });
  }, 30_000);

  proc.stdout.on('data', d => { out += d.toString(); });
  proc.stderr.on('data', d => { err += d.toString(); });

  proc.on('close', code => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (code === 0) return res.json({ ok: true, output: out });
    const combined = (out + err).toLowerCase();
    const isSessionExpired =
      code === 2 ||
      combined.includes('session_expired') ||
      combined.includes('waf') ||
      combined.includes('aws token') ||
      combined.includes('resume_websession') ||
      combined.includes('abgelaufen');
    if (isSessionExpired) {
      return res.status(401).json({
        ok: false,
        sessionExpired: true,
        error: 'TR-Session abgelaufen. Bitte im Terminal neu einloggen.',
        hint: 'pytr login --store_credentials',
      });
    }
    res.status(500).json({ ok: false, error: (out + err) || 'Unbekannter Fehler' });
  });
});

export default router;

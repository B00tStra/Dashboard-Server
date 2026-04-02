// TradingView real-time quotes + earnings data
import fs from 'fs';
import path from 'path';
import { mockWatchlist, STOCK_NEWS_FILE, saveJSON } from '../state.js';

const TV_URL = 'https://scanner.tradingview.com/america/scan';

export const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':     'application/json',
  'Referer':    'https://finance.yahoo.com/',
};

export async function fetchTradingViewQuotes(symbols) {
  const payload = {
    filter: [{ left: 'name', operation: 'in_range', right: symbols }],
    columns: ['name', 'close', 'change', 'change_abs', 'volume', 'description'],
  };
  try {
    const res = await fetch(TV_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`TradingView HTTP ${res.status}`);
    const data = await res.json();
    const map = {};
    data.data.forEach(item => {
      map[item.d[0]] = { symbol: item.d[0], price: item.d[1], changePercent: item.d[2], change: item.d[3], volume: item.d[4], longName: item.d[5] || item.d[0] };
    });
    return symbols.map(s => map[s] || null).filter(Boolean);
  } catch (err) {
    console.error('TradingView Fetch Error:', err.message);
    return [];
  }
}

export async function refreshQuotes() {
  const symbols = mockWatchlist.map(w => w.ticker);
  if (!symbols.length) return;
  try {
    const quotes = await fetchTradingViewQuotes(symbols);
    quotes.forEach(q => {
      const item = mockWatchlist.find(w => w.ticker === q.symbol);
      if (!item) return;
      item.price         = parseFloat((q.price ?? item.price).toFixed(2));
      item.change        = parseFloat((q.change ?? item.change).toFixed(2));
      item.changePercent = parseFloat((q.changePercent ?? item.changePercent).toFixed(2));
      item.name          = q.longName || item.name;
      item.sparkline     = [...item.sparkline.slice(-7), item.price];
    });

    if (fs.existsSync(STOCK_NEWS_FILE)) {
      const news = JSON.parse(fs.readFileSync(STOCK_NEWS_FILE, 'utf8'));
      let modified = false;
      quotes.forEach(q => {
        const stock = news.find(n => n.ticker === q.symbol);
        if (stock) {
          stock.price = q.price;
          if (stock.priceHistory?.length > 0) stock.priceHistory[stock.priceHistory.length - 1].price = q.price;
          modified = true;
        }
      });
      if (modified) fs.writeFileSync(STOCK_NEWS_FILE, JSON.stringify(news, null, 2));
    }

    console.log(`[${new Date().toLocaleTimeString()}] Quotes refreshed: ${symbols.join(', ')}`);
  } catch (err) {
    console.error('Quote refresh failed:', err.message);
  }
}

export async function fetchTradingViewEarnings(symbols) {
  const tickers = symbols.map(s => `NASDAQ:${s}`);
  const payload = {
    symbols: { tickers },
    columns: ['name','close','earnings_release_date','earnings_release_next_date','earnings_per_share_fq','earnings_per_share_forecast_fq','revenue_fq','revenue_forecast_fq','price_earnings_ttm','market_cap_basic'],
  };
  const res = await fetch(TV_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`TradingView HTTP ${res.status}`);
  const data = await res.json();

  return data.data.map(item => {
    const toDate = ts => ts ? new Date(ts*1000).toISOString().split('T')[0] : null;
    const eps = { actual: item.d[4] ? parseFloat(item.d[4].toFixed(2)) : null, forecast: item.d[5] ? parseFloat(item.d[5].toFixed(2)) : null };
    eps.beat = (eps.actual && eps.forecast) ? parseFloat(((eps.actual/eps.forecast-1)*100).toFixed(1)) : null;
    const rev = { actual: item.d[6] ? `$${(item.d[6]/1e9).toFixed(2)}B` : null, forecast: item.d[7] ? `$${(item.d[7]/1e9).toFixed(2)}B` : null };
    rev.beat = (item.d[6] && item.d[7]) ? parseFloat(((item.d[6]/item.d[7]-1)*100).toFixed(1)) : null;
    return {
      ticker:          item.d[0],
      price:           item.d[1],
      lastEarningsDate: toDate(item.d[2]),
      nextEarningsDate: toDate(item.d[3]),
      eps, revenue: rev,
      peRatio:    item.d[8] ? parseFloat(item.d[8].toFixed(2)) : null,
      marketCap:  item.d[9] ? `$${(item.d[9]/1e9).toFixed(2)}B` : null,
    };
  });
}

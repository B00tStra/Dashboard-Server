# Agent Instructions — Investment Tracker Dashboard

Read this before making any changes. Written for Claude and other AI agents.

---

## 1. Project Overview

Self-hosted financial dashboard on a Linux server:

- **Frontend:** React 18 + TypeScript + Vite → built to `/dist`, served by Express
- **Backend:** Node.js Express on port 3001 (`server/index.js`)
- **Python scripts:** `python/scripts/` — Trade Republic sync, portfolio history
- **Data store:** `data/*.json` — persistent JSON (no database)
- **Reverse proxy:** Nginx port 80 → localhost:3001
- **Process manager:** systemd service `dashboard`

---

## 2. Server Access

Working directory: `/home/fabio/dashboard`

```bash
sudo -n systemctl status dashboard    # check status
sudo -n systemctl restart dashboard   # restart after backend changes
sudo -n systemctl stop dashboard
sudo -n systemctl start dashboard
```

> Always use `sudo -n` (no TTY in Claude Code subprocess). Never use `--no-pager`.

---

## 3. Making Changes

### Frontend (src/)
```bash
# Edit files in src/, then:
npm run build
sudo -n systemctl restart dashboard
```
> Never edit files in `dist/` directly — overwritten on build.

### Backend (server/)
```bash
# Edit server/routes/*.js or server/services/*.js, then:
sudo -n systemctl restart dashboard
```
No build step needed for backend changes.

---

## 4. Adding Data

### Via REST API
```bash
# Update stock news
curl -X POST http://localhost:3001/api/stock-news \
  -H "Content-Type: application/json" \
  -d '[{"ticker":"NVDA","sentiment":"bullish","news_summary":"...","analysis":"..."}]'

# Sync Trade Republic portfolio
curl -X POST http://localhost:3001/api/portfolio/sync
```

### Edit data/*.json directly
| File | Contents |
|---|---|
| `data/portfolio.json` | Positions + cash balance |
| `data/portfolio_history.json` | Historical performance series |
| `data/market-data.json` | FRED macro data, Fear & Greed |

Server picks up changes on next API call (no restart needed).

### Python scripts
```bash
python3 python/scripts/tr_sync.py           # TR → portfolio.json
python3 python/scripts/portfolio_history.py # → portfolio_history.json
```

---

## 5. Price Data Sources

**CRITICAL — always use the correct source:**

| Asset Type | Source | Currency |
|---|---|---|
| US Equities | TradingView scanner API | USD → EUR |
| Crypto (BTC, SOL, ADA) | CoinGecko | EUR |
| EUR/USD Rate | Yahoo Finance (EURUSD=X) | — |

Code in `server/services/quotes.js`:
- `fetchTradingViewQuotes(symbols)` — equity prices in USD
- `fetchEurUsd()` — EUR/USD rate (cached 5 min)
- `fetchCryptoPricesEur(tickers)` — crypto EUR prices

**Never use Yahoo Finance for stock prices.**

---

## 6. Portfolio Calculations (EUR-based)

```
Einstiegswert = shares × avgBuyPrice          [EUR, from TR]
Aktueller Wert = shares × (usdPrice / eurUsd)  [EUR, converted]
Kursgewinn = Aktueller Wert − Einstiegswert
Kursgewinn % = Kursgewinn / Einstiegswert × 100
Gesamtwert = Σ(Aktueller Wert) + Cash
```

---

## 7. Trade Republic Sync

```bash
# Re-authenticate (when session expires)
pytr login --store_credentials
# or with WAF token from browser DevTools:
pytr login --waf-token <token> --store_credentials

# Run sync
python3 python/scripts/tr_sync.py
```

The sync script:
1. Connects to TR via websocket (pytr)
2. Fetches positions (ISIN, shares, avgBuyPrice in EUR)
3. Fetches cash balance (Verrechnungskonto)
4. Writes merged result to `data/portfolio.json`
5. Preserves manually-added positions (no `source: 'trade_republic'`)

---

## 8. Environment Variables

`/home/fabio/dashboard/.env` (not in git):
```env
FRED_API_KEY=your_key_here
```

---

## 9. Key File Map

```
dashboard/
├── server/
│   ├── index.js              # Express app, mounts routes, starts pollers
│   ├── state.js              # Shared in-memory state, file paths
│   ├── routes/
│   │   ├── portfolio.js      # /api/portfolio, /api/portfolio/sync, /api/portfolio/search
│   │   ├── market.js         # /api/market-data, /api/watchlist, /api/stock-news, /api/tickers, /api/earnings
│   │   ├── finance.js        # /api/valuation/:ticker, /api/chart/:ticker
│   │   └── fs.js             # /api/fs/*, /api/config-files
│   └── services/
│       ├── quotes.js         # TradingView + CoinGecko + EUR/USD
│       ├── fred.js           # FRED macro API
│       ├── fearAndGreed.js   # Fear & Greed index
│       ├── crypto.js         # Crypto market data
│       └── poller.js         # 5-min background refresh
│
├── src/
│   ├── App.tsx               # React Router — all routes
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Dashboard.tsx     # Watchlist + stock news
│   │   ├── Portfolio.tsx     # Investment tracker (/investment)
│   │   ├── MarketAnalysis.tsx# FRED + macro signals (/markets)
│   │   ├── NewsFeed.tsx      # News feed (/news)
│   │   ├── EarningsReports.tsx  # DCF + history (/earnings)
│   │   ├── EarningsCalendar.tsx # Upcoming earnings (/earnings-calendar)
│   │   └── FearAndGreedPage.tsx
│   ├── components/
│   │   ├── Layout.tsx        # Sidebar + header
│   │   ├── DCFChart.tsx
│   │   ├── FearAndGreedGauge.tsx
│   │   └── TopMarketWidget.tsx
│   └── utils/formatters.ts   # fmt, fmtEur, getLogoUrl, TV_LOGO_MAP
│
├── python/scripts/
│   ├── tr_sync.py            # TR → portfolio.json
│   ├── tr_auth.py            # TR authentication helper
│   └── portfolio_history.py  # → portfolio_history.json
│
├── data/                     # JSON data store
├── dist/                     # Built frontend (DO NOT EDIT)
├── instruction/              # Agent documentation (this folder)
└── .env                      # Secret keys
```

---

## 10. Common Commands

```bash
# Build + deploy frontend
npm run build && sudo -n systemctl restart dashboard

# Check server logs
journalctl -u dashboard -f

# Test API
curl -s http://localhost:3001/api/portfolio | python3 -m json.tool

# TR sync
python3 python/scripts/tr_sync.py

# Recalculate portfolio history
python3 python/scripts/portfolio_history.py

# Check port 3001
lsof -i :3001
```

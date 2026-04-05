# Dashboard Architecture

## 1. System Architecture & Data Flow

```mermaid
graph TD
    classDef frontend fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef backend  fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef external fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc;
    classDef db       fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff;

    Client["💻 React Frontend (Vite)"]:::frontend
    Server["⚙️ Node.js Express (server/index.js)"]:::backend

    API_FRED["📊 FRED API (Macro Data)"]:::external
    API_TV["📈 TradingView (Quotes, Earnings)"]:::external
    API_FNG["😱 Fear & Greed APIs"]:::external
    API_CRYPTO["🪙 CoinGecko"]:::external
    API_YAHOO["📉 Yahoo Finance (EUR/USD, DCF)"]:::external

    Config["📝 .env (FRED_API_KEY)"]:::db
    Data["💾 data/*.json (persistent)"]:::db

    Client -- "REST /api/*" --> Server
    Server -- "Macro KPIs + Yield Curve" --> API_FRED
    Server -- "Live Quotes + Earnings" --> API_TV
    Server -- "Stocks F&G Index" --> API_FNG
    Server -- "Crypto EUR prices" --> API_CRYPTO
    Server -- "EUR/USD rate, DCF, OHLC" --> API_YAHOO
    Server -. "Read API Key" .-> Config
    Server -. "Read/Write JSON" .-> Data
```

## 2. Project Folder Structure

```
dashboard/
├── server/                     # Node.js backend
│   ├── index.js                # Express setup, mounts routes, starts pollers
│   ├── state.js                # Shared in-memory state, file paths, I/O helpers
│   ├── routes/
│   │   ├── portfolio.js        # /api/portfolio, /api/portfolio/sync, /api/portfolio/search
│   │   ├── market.js           # /api/market-data, /api/watchlist, /api/stock-news, /api/tickers, /api/earnings
│   │   ├── finance.js          # /api/valuation/:ticker, /api/chart/:ticker
│   │   └── fs.js               # /api/fs/*, /api/cron, /api/config-files
│   └── services/
│       ├── fred.js             # fetchFREDMacroData() — 11 macro series + yield curve
│       ├── fearAndGreed.js     # fetchFearAndGreedStocks/Crypto()
│       ├── crypto.js           # fetchCryptoMarketData()
│       ├── quotes.js           # fetchTradingViewQuotes(), fetchEurUsd(), fetchCryptoPricesEur()
│       └── poller.js           # updateMarketDataFromAPIs() — runs every 5 min
│
├── src/                        # React frontend (TypeScript)
│   ├── App.tsx                 # React Router, all page routes
│   ├── context/
│   │   ├── ThemeContext.tsx    # Dark/light theme provider
│   │   └── LanguageContext.tsx # i18n context
│   ├── pages/
│   │   ├── Home.tsx            # Landing page (3D background + nav cards)
│   │   ├── Dashboard.tsx       # Watchlist + stock news feed
│   │   ├── Portfolio.tsx       # Investment tracker (/investment)
│   │   ├── MarketAnalysis.tsx  # FRED charts, Fear & Greed, recession signals
│   │   ├── NewsFeed.tsx        # News feed page
│   │   ├── EarningsReports.tsx # DCF valuation + EPS/Revenue history
│   │   ├── EarningsCalendar.tsx# Upcoming earnings calendar
│   │   └── FearAndGreedPage.tsx
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar + header
│   │   ├── FearAndGreedGauge.tsx
│   │   ├── DCFChart.tsx
│   │   └── TopMarketWidget.tsx
│   ├── utils/
│   │   └── formatters.ts       # fmt, fmtEur, getLogoUrl, TV_LOGO_MAP
│   └── language/
│       └── translations.ts
│
├── python/scripts/
│   ├── tr_sync.py              # Trade Republic → data/portfolio.json
│   ├── tr_auth.py              # TR authentication helper
│   └── portfolio_history.py    # Historical performance → data/portfolio_history.json
│
├── data/                       # Persistent JSON store
│   ├── market-data.json        # Fear & Greed, FRED charts, macro KPIs
│   ├── portfolio.json          # Positions + cash balance
│   └── portfolio_history.json  # Historical performance series
│
├── dist/                       # Production build output (npm run build)
├── public/                     # Static assets (favicon, background video)
├── instruction/                # Documentation for agents
├── nginx.conf                  # Nginx reverse proxy config
├── dashboard.service           # systemd service unit
├── .env                        # FRED_API_KEY (not committed)
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 3. Frontend Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home.tsx | Landing page with 3D animation |
| `/dashboard` | Dashboard.tsx | Watchlist + AI stock news |
| `/investment` | Portfolio.tsx | Trade Republic portfolio tracker |
| `/markets` | MarketAnalysis.tsx | FRED charts + macro signals |
| `/news` | NewsFeed.tsx | News feed |
| `/earnings` | EarningsReports.tsx | DCF + earnings history |
| `/earnings-calendar` | EarningsCalendar.tsx | Upcoming earnings |
| `/fear-and-greed` | FearAndGreedPage.tsx | Fear & Greed detail view |

## 4. Market Analysis — Section Layout (top → bottom)

| Section | Data Source | Charts |
|---|---|---|
| Marktstimmung & Rezessionsrisiko | Fear & Greed APIs + FRED signals | Flat panel + signal list |
| Geldpolitik & Zinsen | FRED: FEDFUNDS, T10Y2Y, WALCL | Area + Line + Area |
| Inflation & Rohstoffe | FRED: CPIAUCSL, T10YIE, DCOILWTICO | Area + Area + Area |
| Konjunktur & Arbeitsmarkt | FRED: GDP, PAYEMS, UNRATE, ICSA, UMCSENT | Bar + Bar + Area + Area + Area |
| Zinsstrukturkurve | FRED: DGS1MO → DGS30 | Full bar snapshot |

## 5. FRED Series Reference

| Series ID | Description | Frequency |
|---|---|---|
| FEDFUNDS | Fed Funds Rate | Monthly |
| CPIAUCSL | CPI All Urban (YoY computed) | Monthly |
| UNRATE | Unemployment Rate | Monthly |
| T10Y2Y | 10Y–2Y Treasury Spread | Daily |
| PAYEMS | Non-Farm Payrolls (MoM change) | Monthly |
| A191RL1Q225SBEA | Real GDP Growth | Quarterly |
| UMCSENT | U. Michigan Consumer Sentiment | Monthly |
| T10YIE | 10Y Breakeven Inflation | Daily |
| WALCL | Fed Balance Sheet (trillions) | Weekly |
| ICSA | Initial Jobless Claims (thousands) | Weekly |
| DCOILWTICO | WTI Crude Oil | Daily |
| DGS1MO/3MO/6MO/1/2/3/5/7/10/20/30 | Yield Curve Snapshot | Daily |

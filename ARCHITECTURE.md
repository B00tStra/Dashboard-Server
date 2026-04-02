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
    API_CRYPTO["🪙 CoinGecko / Blocknative"]:::external
    API_YAHOO["📉 Yahoo Finance (DCF, Chart)"]:::external

    Config["📝 .env (FRED_API_KEY)"]:::db
    Data["💾 data/*.json (persistent)"]:::db

    Client -- "REST /api/*" --> Server
    Server -- "Macro KPIs + Yield Curve" --> API_FRED
    Server -- "Live Quotes + Earnings" --> API_TV
    Server -- "Stocks F&G Index" --> API_FNG
    Server -- "BTC Dominance, ETH Gas" --> API_CRYPTO
    Server -- "DCF Valuation, OHLC Chart" --> API_YAHOO
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
│   │   ├── market.js           # /api/market-data, /api/watchlist, /api/stock-news, /api/tickers, ...
│   │   ├── finance.js          # /api/valuation/:ticker, /api/chart/:ticker
│   │   └── fs.js               # /api/fs/*, /api/cron, /api/config-files
│   └── services/
│       ├── fred.js             # fetchFREDMacroData() — 11 macro series + yield curve
│       ├── fearAndGreed.js     # fetchFearAndGreedStocks/Crypto()
│       ├── crypto.js           # fetchCryptoMarketData(), fetchEthGas()
│       ├── quotes.js           # fetchTradingViewQuotes/Earnings(), refreshQuotes()
│       └── poller.js           # updateMarketDataFromAPIs() — runs every 5 min
│
├── src/                        # React frontend (TypeScript)
│   ├── App.tsx                 # React Router, all page routes
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main hub
│   │   ├── MarketAnalysis.tsx  # FRED charts, Fear & Greed, Recession signals
│   │   ├── EarningsReports.tsx # DCF, EPS/Revenue history, timeline
│   │   ├── FearAndGreedPage.tsx
│   │   ├── MarketDebate.tsx
│   │   ├── AgentLogs.tsx
│   │   ├── TokenUsage.tsx
│   │   ├── Settings.tsx
│   │   └── Home.tsx
│   └── components/
│       ├── Layout.tsx
│       ├── FearAndGreedGauge.tsx
│       ├── DCFChart.tsx
│       ├── TokenUsageNexus.tsx
│       └── TopMarketWidget.tsx
│
├── data/                       # Persistent JSON store
│   ├── market-data.json        # Fear & Greed, FRED charts, macro KPIs
│   ├── watchlist.json          # Live watchlist with sparklines
│   └── stock-news.json         # Per-ticker AI analysis & sentiment
│
├── dist/                       # Production build output (npm run build)
├── public/
├── .env                        # FRED_API_KEY (not committed)
├── .env.example
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 3. Frontend Component Tree

```mermaid
graph TD
    classDef app  fill:#4f46e5,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef page fill:#0ea5e9,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef comp fill:#334155,stroke:#64748b,stroke-width:2px,color:#fff;

    App["App.tsx (React Router)"]:::app
    Layout["Layout.tsx (Sidebar + Header)"]:::comp

    Dashboard["Dashboard.tsx"]:::page
    MarketAnalysis["MarketAnalysis.tsx"]:::page
    Earnings["EarningsReports.tsx"]:::page
    FnG["FearAndGreedPage.tsx"]:::page
    Settings["Settings.tsx"]:::page

    App --> Layout
    Layout --> Dashboard
    Layout --> MarketAnalysis
    Layout --> Earnings
    Layout --> FnG
    Layout --> Settings

    Dashboard --> TopMarketWidget["TopMarketWidget.tsx"]:::comp
    Dashboard --> Watchlist["Watchlist (inline)"]:::comp
    Dashboard --> NewsFeed["StockNewsFeed (inline)"]:::comp

    MarketAnalysis --> FG_Panel["FearGreedPanel (flat)"]:::comp
    MarketAnalysis --> RecessionPanel["RecessionPanel"]:::comp
    MarketAnalysis --> Charts["FRED Charts (Recharts)"]:::comp
    MarketAnalysis --> YieldCurve["YieldCurvePanel (bar)"]:::comp

    Earnings --> DCFChart["DCFChart.tsx"]:::comp
    Earnings --> EarningsTable["EarningsTable (inline)"]:::comp

    Settings --> TokenUsageNexus["TokenUsageNexus.tsx"]:::comp
```

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

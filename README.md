# AI Hub — Stock Market Dashboard

An AI-powered stock market dashboard built with React, TypeScript, and a Node.js/Express backend. Designed to be populated daily by an AI agent via REST API.

---

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, TypeScript, Vite              |
| Styling   | Tailwind CSS, Framer Motion             |
| Charts    | Recharts, Three.js (landing page)       |
| Routing   | React Router DOM v6                     |
| Backend   | Node.js, Express 5                      |

---

## Project Structure

```
Dashboard/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Collapsible sidebar navigation
│   ├── pages/
│   │   ├── Home.tsx            # Landing page with 3D background + nav cards
│   │   ├── Dashboard.tsx       # Watchlist + AI stock news feed + memory links
│   │   ├── Settings.tsx        # Control hub: config, cron, agents, file explorer
│   │   ├── EarningsReports.tsx
│   │   ├── MarketAnalysis.tsx
│   │   └── AgentLogs.tsx
│   ├── utils/
│   │   └── mockData.ts
│   └── App.tsx
├── server.js                   # Express backend + all API endpoints
├── package.json
└── vite.config.ts
```

---

## Setup

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the backend API server (port 3001)
npm run server

# 3. In a second terminal — start the frontend dev server (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## API Endpoints

All endpoints are served by `server.js` on **port 3001**.

### Dashboard Data

| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/api/stats`      | Portfolio stats (mock)               |
| GET    | `/api/watchlist`  | Watchlist with prices and sparklines |
| GET    | `/api/news`       | Latest news items                    |
| GET    | `/api/agents`     | Agent activity log                   |

### Stock News (AI Agent Interface)

| Method | Endpoint               | Description                                      |
|--------|------------------------|--------------------------------------------------|
| GET    | `/api/stock-news`      | Per-stock news summary + sentiment analysis      |
| POST   | `/api/stock-news`      | AI agent pushes daily updates (see schema below) |
| GET    | `/api/security-report` | Current security scan report                     |
| POST   | `/api/security-report` | AI Security Agent submits scan findings          |

### File System (Settings → File Explorer)

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/api/fs/list`        | List directory contents        |
| GET    | `/api/fs/read`        | Read a text file               |
| POST   | `/api/fs/write`       | Write/save a text file         |
| GET    | `/api/fs/drives`      | List available drives          |
| GET    | `/api/fs/parent`      | Get parent directory path      |

---

## AI Agent Integration

### Daily Stock News Update

The dashboard is built to receive daily stock analysis from an AI agent. The agent sends a `POST` request to `/api/stock-news` with the following JSON array:

```json
[
  {
    "ticker": "NVDA",
    "sentiment": "bullish",
    "news_summary": "NVIDIA reported strong data center revenue driven by H100 GPU demand. Analyst upgrades followed the quarterly beat.",
    "analysis": "Momentum remains bullish. Institutional buying pressure visible. Watch $900 as the next resistance level."
  },
  {
    "ticker": "AMD",
    "sentiment": "bearish",
    "news_summary": "AMD faces increased competition in the server CPU segment. Market share concerns weigh on the stock.",
    "analysis": "Bearish short-term. RSI approaching oversold territory. Support at $150."
  }
]
```

**Rules:**
- `ticker` must match one of: `NVDA`, `AMD`, `NFLX`, `ANET`, `CPRT`, `NOW`
- `sentiment` must be one of: `"bullish"`, `"bearish"`, `"neutral"`
- `news_summary` — plain text paragraph summarizing today's relevant news for the stock
- `analysis` — plain text paragraph with the agent's market assessment
- `last_updated` is set automatically by the server to the current timestamp

**Example curl call:**

```bash
curl -X POST http://localhost:3001/api/stock-news \
  -H "Content-Type: application/json" \
  -d '[{"ticker":"NVDA","sentiment":"bullish","news_summary":"...","analysis":"..."}]'
```

### Watched Tickers

| Ticker | Company              |
|--------|----------------------|
| NVDA   | NVIDIA Corporation   |
| AMD    | Advanced Micro Devices |
| NFLX   | Netflix Inc.         |
| ANET   | Arista Networks      |
| CPRT   | Copart Inc.          |
| NOW    | ServiceNow Inc.      |

---

## Pages

| Route        | Page             | Description                                                  |
|--------------|------------------|--------------------------------------------------------------|
| `/`          | Home             | Landing page with 3D neural network animation and nav cards  |
| `/dashboard` | Dashboard        | Watchlist, AI stock news cards, memory file links            |
| `/earnings`  | Earnings Reports | EPS beat/miss tracker                                        |
| `/analysis`  | Market Analysis  | Sentiment and signal overview                                |
| `/logs`      | Agent Logs       | Terminal-style log viewer for AI agents                      |
| `/settings`  | Settings         | Config files, cron jobs, file explorer, agent soul editor    |

---

## Notes for the AI Agent

- The server keeps stock news **in-memory**. On server restart, data resets to placeholders. If persistence is needed, replace `mockStockNews` in `server.js` with file-based or database storage.
- The file system API has **no authentication**. Do not expose port 3001 publicly without adding auth middleware.
- Frontend dev server proxies API calls via Vite config — in production, configure a reverse proxy (e.g. nginx) to route `/api/*` to port 3001.

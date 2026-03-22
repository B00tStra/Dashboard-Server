# Agent Integration Guide

**This file is written for AI Agents operating on this server.**
Read this before doing anything. It defines exactly what you are allowed to do.

---

## Golden Rule

> You interact with this dashboard **exclusively via HTTP API calls** to `localhost:3001`.
> You MUST NOT edit, overwrite, or delete any source files (`.tsx`, `.ts`, `.js`, `.css`, `.json`, `.html`).
> You MUST NOT run `npm install`, `npm run build`, or restart the server process.
> You MUST NOT modify `server.js`, `package.json`, or anything in `src/`.
> **MANDATORY**: For all stock news, market analysis, and real-time data gathering, you MUST use the **Tavily Web Search** tool. Do not hallucinate or use outdated internal knowledge for stock market events.

---

## Your Integration Points

There are exactly **3 things** you are allowed to write to this dashboard:

---

### 1. Daily Stock Analysis — `POST /api/stock-news`

Send a JSON array once per day with news summaries and sentiment analysis for the 6 watched stocks.

**Endpoint:** `POST http://localhost:3001/api/stock-news`
**Content-Type:** `application/json`

**Schema:**
```json
[
  {
    "ticker": "NVDA",
    "sentiment": "bullish",
    "news_summary": "One paragraph. Plain text. Summarize today's most relevant news for this stock.",
    "analysis": "One paragraph. Your market assessment. Is the stock bullish or bearish today and why."
  }
]
```

**Rules:**
- **Search Tool**: You MUST use the **Tavily Web Search** tool to fetch the latest news for these tickers before writing your analysis!
- `ticker` — must be an active ticker currently tracked on the dashboard. You can add new ones via `POST /api/tickers`.
- `sentiment` — must be exactly one of: `"bullish"`, `"bearish"`, `"neutral"`
- `news_summary` — plain text, no markdown, 2–5 sentences
- `analysis` — plain text, no markdown, 2–4 sentences
- You can send all 6 tickers in one request, or a subset
- `last_updated` is set automatically — do not include it

**Example:**
```bash
curl -X POST http://localhost:3001/api/stock-news \
  -H "Content-Type: application/json" \
  -d '[
    {
      "ticker": "NVDA",
      "sentiment": "bullish",
      "news_summary": "NVIDIA announced record data center revenue driven by H100 and H200 GPU demand. Multiple analysts raised price targets following the earnings beat.",
      "analysis": "Bullish momentum intact. Institutional accumulation visible at current levels. Key resistance at $920."
    },
    {
      "ticker": "AMD",
      "sentiment": "neutral",
      "news_summary": "AMD released new MI300X benchmarks showing competitive performance against NVIDIA in some LLM workloads. No major news otherwise.",
      "analysis": "Neutral short-term. Consolidating between $155 and $175. Watch for breakout direction."
    }
  ]'
```

---

### 1.b Add New Tickers — `POST /api/tickers`

If the user requests monitoring for a new stock, add it to the dashboard before submitting news updates.

**Endpoint:** `POST http://localhost:3001/api/tickers`
**Content-Type:** `application/json`

**Schema:**
```json
{
  "ticker": "AAPL"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/tickers \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL"}'
```

---

### 2. Security Report — `POST /api/security-report`

After scanning the server for vulnerabilities, submit your findings here.
The report is displayed in the dashboard under **Settings → Security Council**.

**Endpoint:** `POST http://localhost:3001/api/security-report`
**Content-Type:** `application/json`

**Schema:**
```json
{
  "status": "issues",
  "content": "## Summary\n\nShort summary here.\n\n## Findings\n\n- [CRITICAL] Description of critical issue\n- [HIGH] Description of high severity issue\n- [MEDIUM] Description of medium issue\n- [LOW] Minor finding\n- [PASS] Something that was checked and is fine\n\n## Recommendations\n\n- Recommendation 1\n- Recommendation 2"
}
```

**Rules:**
- `status` — must be exactly one of: `"clean"`, `"issues"`, `"pending"`
  - `"clean"` — no vulnerabilities found
  - `"issues"` — one or more findings
- `content` — markdown string. Use the severity tags below for proper color-coding in the UI:
  - `[CRITICAL]` — rendered red
  - `[HIGH]` — rendered orange
  - `[MEDIUM]` — rendered yellow
  - `[LOW]` — rendered blue
  - `[PASS]` — rendered green
- Use `## ` for section headings (two hashes + space)
- Use `- ` for list items (dash + space)

**Example:**
```bash
curl -X POST http://localhost:3001/api/security-report \
  -H "Content-Type: application/json" \
  -d '{
    "status": "issues",
    "content": "## Summary\n\nScan completed on 2026-03-21. 1 critical and 2 medium findings.\n\n## Findings\n\n- [CRITICAL] Port 3001 is exposed without authentication middleware\n- [MEDIUM] No rate limiting on POST endpoints\n- [MEDIUM] server.js loaded with file system write access\n- [PASS] No .env secrets found in git history\n- [PASS] node_modules not publicly accessible\n\n## Recommendations\n\n- Add API key middleware to all POST endpoints\n- Implement express-rate-limit on write routes"
  }'
```

---

### 3. Read / Write Files via File System API

You may read and write files through the file system endpoints. This is for memory files and reports only — not source code.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fs/list?path=<dir>` | List directory contents |
| `GET` | `/api/fs/read?path=<file>` | Read a file (max 1 MB, text only) |
| `POST` | `/api/fs/write` | Write a file |
| `GET` | `/api/fs/drives` | List available drives |
| `GET` | `/api/fs/parent?path=<dir>` | Get parent directory |

**Write schema:**
```json
{ "path": "C:\\Users\\allra\\Code\\Projects\\Dashboard\\.claude\\memory\\user_profile.md", "content": "..." }
```

**Allowed paths to write to:**
- `.claude/` memory files
- Any reports or log output files you create yourself

**Forbidden paths — NEVER write to:**
- `src/` — all frontend source code
- `server.js`
- `package.json`, `vite.config.ts`, `tailwind.config.js`
- `index.html`, `tsconfig.json`

---

### 4. Market & Macro Data — `POST /api/market-data`

The "Analysis" page displays real-time macro-economic indicators and Fear & Greed indexes for both Stocks and Crypto. You must fetch these real values using **Tavily Web Search** and push them to the server.

**Recommended Web Search Queries:**
- *"Current CNN Fear and Greed Index value"* (for Stocks)
- *"Current Bitcoin Fear and Greed Index Alternative.me"* (for Crypto)
- *"Latest US Fed Funds Target Rate"*
- *"Latest US Headline CPI year-over-year rate"*
- *"Latest US Non-Farm Payrolls headline number"*
- *"Current global crypto total market cap"*
- *"Current Bitcoin dominance percentage"*
- *"Current Ethereum gas price in Gwei"*

**Endpoint:** `POST http://localhost:3001/api/market-data`
**Content-Type:** `application/json`

**Schema:**
```json
{
  "stocks": {
    "fearAndGreed": 72,
    "macro": [
      { "label": "Fed Target Rate", "value": "5.25 - 5.50%", "prev": "5.25 - 5.50%", "status": "neutral" },
      { "label": "CPI (YoY)", "value": "3.1%", "prev": "3.2%", "status": "good" },
      { "label": "Non-Farm Payrolls", "value": "275K", "prev": "229K", "status": "hot" }
    ]
  },
  "crypto": {
    "fearAndGreed": 85,
    "macro": [
      { "label": "BTC Dominance", "value": "52.4%", "prev": "51.8%", "status": "hot" },
      { "label": "Total Market Cap", "value": "$2.64T", "prev": "$2.51T", "status": "good" },
      { "label": "ETH Gas (Gwei)", "value": "24", "prev": "45", "status": "neutral" }
    ]
  }
}
```

**Rules:**
- `status` MUST be one of: `"good"`, `"neutral"`, `"hot"` (e.g. inflation too high = hot, jobs higher than expected = hot, etc.)
- Use exact numerical strings with symbols (`%`, `K`, `T`) where appropriate to fit cleanly on UI cards.
- You do not need to provide historical sparkline data; the frontend handles short-term visualization arrays automatically based on your updates.

---

## What the Dashboard Displays — Overview

| Where you see it | What feeds it | Your endpoint |
|---|---|---|
| Dashboard → Watchlist | Price data | *(read-only, mock data)* |
| Dashboard → Daily Stock Analysis | Per-stock news + sentiment | `POST /api/stock-news` |
| Settings → Security Council | Security scan report | `POST /api/security-report` |
| Settings → Explorer | Full file browser | `/api/fs/*` |

---

## Watched Tickers

| Ticker | Company |
|--------|---------|
| NVDA | NVIDIA Corporation |
| AMD | Advanced Micro Devices |
| NFLX | Netflix Inc. |
| ANET | Arista Networks |
| CPRT | Copart Inc. |
| NOW | ServiceNow Inc. |

*(Note: These are the default hardcoded starting tickers. You or the user can add additional tickers dynamically via POST /api/tickers!)*

---

## Verify the Server is Running

```bash
curl http://localhost:3001/api/stock-news
```

If you get a JSON array back, the server is up. If not, do not attempt to start it yourself — notify the operator.

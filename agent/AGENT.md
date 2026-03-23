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
- `news_summary` — **CRITICAL**: You must SUMMARIZE the news in your own words. Write 2–5 clear, concise sentences in plain text. DO NOT copy-paste raw HTML, article snippets, or search results. Extract the key information and write a clean summary as if you're explaining it to a human investor.
- `analysis` — plain text, no markdown, 2–4 sentences. Your expert opinion on whether this stock is bullish or bearish today based on the news.
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

The "Analysis" page displays real-time macro-economic indicators and Fear & Greed indexes for both Stocks and Crypto. You must fetch these real values using **direct API calls** (preferred) or Tavily Web Search (fallback only).

**Endpoint:** `POST http://localhost:3001/api/market-data`
**Content-Type:** `application/json`

**Schema:**
```json
{
  "stocks": {
    "fearAndGreed": {
      "current": 20,
      "yesterday": 22,
      "lastWeek": 45,
      "lastMonth": 68,
      "lastYear": 54,
      "status": "Extreme Fear",
      "indicators": [
        { "name": "Market Momentum", "status": "Extreme Fear", "value": "S&P 500 is below 125-day MA" },
        { "name": "Stock Price Strength", "status": "Fear", "value": "Net 52-week lows outpace highs" },
        { "name": "Stock Price Breadth", "status": "Extreme Fear", "value": "McClellan Volume Summation is negative" },
        { "name": "Put and Call Options", "status": "Fear", "value": "Put/Call ratio at 1.08" },
        { "name": "Market Volatility", "status": "Extreme Fear", "value": "VIX is 32.4" },
        { "name": "Safe Haven Demand", "status": "Extreme Fear", "value": "Bonds outperforming stocks" },
        { "name": "Junk Bond Demand", "status": "Extreme Fear", "value": "Spread is widening" }
      ]
    },
    "macro": [
      { "label": "Fed Target Rate", "value": "5.25 - 5.50%", "prev": "5.25 - 5.50%", "status": "neutral" },
      { "label": "CPI (YoY)", "value": "3.1%", "prev": "3.2%", "status": "good" }
    ]
  },
  "crypto": {
    "fearAndGreed": {
      "current": 28,
      "yesterday": 35,
      "lastWeek": 62,
      "lastMonth": 78,
      "status": "Fear",
      "indicators": [
        { "name": "Volatility", "status": "Extreme Fear", "value": "High volatility" },
        { "name": "Market Momentum", "status": "Fear", "value": "Bearish crossovers" }
      ]
    },
    "macro": [
      { "label": "BTC Dominance", "value": "52.4%", "prev": "51.8%", "status": "hot" },
      { "label": "Total Market Cap", "value": "$2.64T", "prev": "$2.51T", "status": "good" }
    ]
  }
}
```

---

#### **Data Sources — Use Direct APIs (MANDATORY)**

**CRITICAL: Do NOT use Tavily Web Search for market data extraction. The text-parsing approach produces unreliable results. Use these direct API endpoints instead:**

| Metric | API Endpoint | Extraction Logic | Valid Range |
|--------|--------------|------------------|-------------|
| **Stocks Fear & Greed** | **Primary**: `https://feargreedmeter.com/` (scrape HTML) <br/> **Fallback**: `https://production.dataviz.cnn.io/index/fearandgreed/graphdata` | **Primary**: Extract from HTML using regex `"value":\s*(\d+)` <br/> **Fallback**: Parse JSON `data.fear_and_greed.score` | **0-100** (integer) |
| **Crypto Fear & Greed** | `https://api.alternative.me/fng/?limit=1` | Parse JSON: `data[0].value` | **0-100** (integer) |
| **BTC Dominance** | `https://api.coingecko.com/api/v3/global` | Parse JSON: `data.market_cap_percentage.btc` | **0-100%** (round to 1 decimal) |
| **Total Crypto Market Cap** | `https://api.coingecko.com/api/v3/global` | Parse JSON: `data.total_market_cap.usd` | Format as `$X.XXT` (trillions) |
| **ETH Gas Price** | `https://api.blocknative.com/gasprices/blockprices` | Parse JSON: `blockPrices[0].baseFeePerGas` (round to integer) | **0-999 Gwei** (integer) |

**For US Economic Indicators (Fed Rate, CPI, Non-Farm Payrolls):**
- **Option A**: Use FRED API (requires free API key from https://fred.stlouisfed.org/docs/api/api_key.html)
  - Fed Rate: `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&api_key=YOUR_KEY&limit=1&sort_order=desc`
  - CPI: `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=YOUR_KEY&limit=1&sort_order=desc`
- **Option B**: Use Tavily **ONLY IF** you apply strict validation (see rules below)

---

#### **Validation Rules (MANDATORY)**

Before submitting data via `POST /api/market-data`, validate each value:

| Field | Validation Rule | Action on Failure |
|-------|-----------------|-------------------|
| `fearAndGreed` (Stocks) | Must be integer 0-100 | Skip update, log error |
| `fearAndGreed` (Crypto) | Must be integer 0-100 | Skip update, log error |
| Fed Target Rate | Must match pattern `X.XX - X.XX%` | Use previous value |
| CPI (YoY) | Must be `X.X%` (0.0% - 20.0%) | Use previous value |
| Non-Farm Payrolls | Must be `XXXK` (range: 50K - 500K) | Use previous value |
| BTC Dominance | Must be `XX.X%` (30.0% - 70.0%) | Skip update |
| Total Market Cap | Must be `$X.XXT` (0.5T - 10.0T) | Skip update |
| ETH Gas (Gwei) | Must be integer 1-999 | Skip update |

**If a value fails validation:**
1. DO NOT submit it to the dashboard
2. Log which metric failed and why
3. Retain the previous value from last successful update
4. Continue with other valid metrics

---

#### **Tavily Fallback Rules (ONLY if APIs fail)**

If direct APIs are unavailable, you may use Tavily **with these strict query patterns:**

| Metric | Exact Query | Extraction Pattern | Example |
|--------|-------------|-------------------|---------|
| Stocks Fear & Greed | `"CNN Fear and Greed Index current value site:cnn.com"` | Look for `"Fear & Greed Index: XX"` or `"score of XX"` | `72` |
| Crypto Fear & Greed | `"Bitcoin Fear and Greed Index today alternative.me"` | Look for `"Fear & Greed Index: XX"` in first sentence | `85` |
| Fed Target Rate | `"Federal Reserve target rate current 2026"` | Look for `"X.XX% to X.XX%"` pattern | `5.25 - 5.50%` |
| BTC Dominance | `"Bitcoin dominance percentage today"` | Look for `"BTC dominance: XX.X%"` | `52.4%` |

**Extraction Logic for Tavily:**
1. Search with the exact query above
2. Parse the **first 2 sentences** of the top result only
3. Apply regex specific to the metric (see validation table)
4. If multiple numbers are found, prefer the one closest to the expected range
5. If extraction fails validation → skip that metric entirely

---

#### **Example: Proper API-Based Update**

```python
import requests
import re

# Fetch Stocks Fear & Greed (with fallback)
try:
    # Primary: FearGreedMeter.com
    resp = requests.get("https://feargreedmeter.com/")
    match = re.search(r'"value":\s*(\d+)', resp.text)
    if match:
        stocks_fg = int(match.group(1))  # e.g. 15
    else:
        raise ValueError("Could not extract from FearGreedMeter")
except:
    # Fallback: CNN API (may have bot-detection)
    cnn_resp = requests.get("https://production.dataviz.cnn.io/index/fearandgreed/graphdata").json()
    stocks_fg = int(cnn_resp["fear_and_greed"]["score"])  # e.g. 72

# Fetch Crypto Fear & Greed
crypto_fg_resp = requests.get("https://api.alternative.me/fng/?limit=1").json()
crypto_fg = int(crypto_fg_resp["data"][0]["value"])  # e.g. 85

# Fetch Crypto Market Data
coingecko_resp = requests.get("https://api.coingecko.com/api/v3/global").json()
btc_dom = round(coingecko_resp["data"]["market_cap_percentage"]["btc"], 1)  # e.g. 52.4
total_cap_usd = coingecko_resp["data"]["total_market_cap"]["usd"]
total_cap_formatted = f"${total_cap_usd / 1e12:.2f}T"  # e.g. "$2.64T"

# Fetch ETH Gas
etherscan_resp = requests.get("https://api.etherscan.io/api?module=gastracker&action=gasoracle").json()
eth_gas = int(etherscan_resp["result"]["ProposeGasPrice"])  # e.g. 24

# Validate all values
if not (0 <= stocks_fg <= 100): raise ValueError("Invalid Stocks Fear & Greed")
if not (0 <= crypto_fg <= 100): raise ValueError("Invalid Crypto Fear & Greed")
if not (30.0 <= btc_dom <= 70.0): raise ValueError("Invalid BTC Dominance")

# Submit to dashboard
payload = {
  "stocks": {
    "fearAndGreed": stocks_fg,
    "macro": [
      {"label": "Fed Target Rate", "value": "5.25 - 5.50%", "prev": "5.25 - 5.50%", "status": "neutral"},
      {"label": "CPI (YoY)", "value": "3.1%", "prev": "3.2%", "status": "good"},
      {"label": "Non-Farm Payrolls", "value": "275K", "prev": "229K", "status": "hot"}
    ]
  },
  "crypto": {
    "fearAndGreed": crypto_fg,
    "macro": [
      {"label": "BTC Dominance", "value": f"{btc_dom}%", "prev": "51.8%", "status": "hot"},
      {"label": "Total Market Cap", "value": total_cap_formatted, "prev": "$2.51T", "status": "good"},
      {"label": "ETH Gas (Gwei)", "value": str(eth_gas), "prev": "45", "status": "neutral"}
    ]
  }
}

requests.post("http://localhost:3001/api/market-data", json=payload)
```

---

#### **Status Field Logic**

- `status` MUST be one of: `"good"`, `"neutral"`, `"hot"`
- **Logic**:
  - CPI decreasing = `"good"`, increasing = `"hot"`, stable = `"neutral"`
  - Non-Farm Payrolls higher than expected = `"hot"` (strong jobs), lower = `"good"` (cooling economy)
  - BTC Dominance increasing = `"hot"` (BTC gaining), decreasing = `"good"` (altcoins gaining)
  - Total Market Cap increasing = `"good"`, decreasing = `"hot"`
  - ETH Gas decreasing = `"good"`, increasing = `"hot"`

---

#### **Summary**

✅ **DO:**
- Use direct API endpoints for all crypto/market data
- Validate every value before submission
- Skip invalid metrics rather than submit garbage data
- Use structured JSON parsing, not text extraction

❌ **DO NOT:**
- Use Tavily Web Search for numeric market data (too unreliable)
- Submit values outside valid ranges
- Guess or hallucinate values if APIs fail
- Use the first number found in search results without validation

---

### 5. Earnings Data — `GET /api/earnings`

The dashboard now provides **real-time earnings data from TradingView** for all watchlist tickers. This endpoint returns earnings reports, EPS, revenue, P/E ratios, and next earnings dates.

**Endpoint:** `GET http://localhost:3001/api/earnings`

**Response Schema:**
```json
[
  {
    "ticker": "NVDA",
    "price": 172.7,
    "lastEarningsDate": "2026-02-25",
    "nextEarningsDate": "2026-05-20",
    "eps": {
      "actual": 1.62,
      "forecast": 1.54,
      "beat": 5.5
    },
    "revenue": {
      "actual": "$68.13B",
      "forecast": "$66.13B",
      "beat": 3.0
    },
    "peRatio": 35.23,
    "marketCap": "$4196.61B"
  }
]
```

**Fields Explained:**
- `lastEarningsDate` — Date of most recent earnings report (YYYY-MM-DD)
- `nextEarningsDate` — Date of next scheduled earnings report (YYYY-MM-DD)
- `eps.actual` — Actual earnings per share (last quarter)
- `eps.forecast` — Analyst forecast for EPS
- `eps.beat` — Percentage beat/miss vs forecast (+5.5 = beat by 5.5%)
- `revenue.actual` — Actual revenue (last quarter, in billions)
- `revenue.forecast` — Revenue forecast
- `revenue.beat` — Percentage beat/miss vs forecast
- `peRatio` — Price-to-Earnings ratio (TTM)
- `marketCap` — Total market capitalization

**Usage in Stock Analysis:**

When writing stock news analysis, you can now use **real earnings data** instead of Tavily searches:

```python
import requests

# Fetch real earnings data
earnings_data = requests.get("http://localhost:3001/api/earnings").json()

# Find NVDA earnings
nvda = next(e for e in earnings_data if e['ticker'] == 'NVDA')

# Use in analysis
if nvda['eps']['beat'] > 0:
    sentiment = "bullish"
    analysis = f"NVDA beat earnings by {nvda['eps']['beat']}% with EPS of ${nvda['eps']['actual']} vs ${nvda['eps']['forecast']} expected. Revenue came in at {nvda['revenue']['actual']} ({nvda['revenue']['beat']:+.1f}% beat). Next earnings: {nvda['nextEarningsDate']}."
```

**Benefits:**
- ✅ **No Tavily searches needed** for earnings/fundamentals
- ✅ **Structured, validated data** from TradingView
- ✅ **Real-time updates** — always current
- ✅ **Beat/miss percentages** calculated automatically
- ✅ **Next earnings dates** for forward-looking analysis

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

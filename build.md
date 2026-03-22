

## Changes


### Generell
- [x] Handy View hinzufügen

### Home 
- [x] Eventuell Video einfügen
- [x] Dashboard Landing Page Scrollbar 

### Seitenleiste
- [x] Agent Logs weggnehmen
- [x] Klappbare Seitenreiter verbessern
- [x] 3D Hologgramd größer machen


### AI Agent
- [x] Tavily API Key konfiguriert
- [x] Memory Files angelegt
  - [ ] Memory Promt einfügen 
  - [ ] Dateien des alten Dashboards löschen


### Market Analysis
- [x] Back zu Home Screen
- [x] Makro-Daten-Widget — Fed-Zinsentscheid, CPI, Jobs-Report als Kontext zur News
- [x] Earnings Calendar — wann sind die nächsten Earnings?  Als Zeitstrahl-View
- [x] Sektoren News für Techaktien - wichtigsten News
- [x] Logos der Aktien hinzufügen
- [ ] Fear and Greed SP500
- [ ] Fear and Gredd Bitcoin
- [ ] Unterschiedliche Unterreiter Crypto und Stocks

### Earnings Report

- [x] Kennzahlen werden eingefügt
- [x] Aufbau ähnlich wie in Trading View mit Diagrammen (Earning Revenue)


### Dashboard
- [x] Watchlist vorgeben
- [x] Ticker oder Chart darstellen
- [x] Dashboard News zu Wachtlist Ticker
- [x] Unternehmenslogo
- [x] Minimmalistische 3D Animation 
- [x] Ticker Aktien hinzufügen


### Github
- [x] Deploy to Github Repository
  

### Security Council
- [x] Securty Reports


läuft auf server, ich brauche jetzt eine prompt für de ai agent was er machen soll. vor allem hat er in letzter zeit versucht sich selber ein dashboard zu bauen, ich will das er die aktuellen cron jobs bezüglich dem dashboard auf das neue das wir geschrieben haben darauf anpasst. das er die memory die wir geschrieben haben ihm mitgeben. das er die agent.md file liest und abspeichert.
er soll sein programmiertes dashboard alles löschen, aber dort wichtige api key wie für tavily oder für notion und google calender soll alles behalten bleiben.



## Development


Terminal 1 — Backend:


```bash
npm run server
```


Terminal 2 — Frontend:

```bash
npm run dev
```





### Memory Promt

```
# AGENT MEMORY – WEB SEARCH & ANALYSIS PROTOCOL
Version: 1.0
Author: [Dein Name]
Last Updated: 2026-03-21

---

## CORE RULE
Whenever a web search or market analysis is required, you MUST use 
Tavily as the ONLY search platform. No other search tool is permitted.

---

## WORKFLOW: WEB SEARCH & ANALYSIS PIPELINE

### STEP 1 – TRIGGER DETECTION
Trigger this pipeline whenever:
- A user requests news, prices, earnings, market data
- A scheduled task requires fresh market information
- An analysis requires external data validation
- Any keyword detected: "search", "news", "latest", "current", "earnings",
  "report", "analyst", "forecast", "market", "stock update"

---

### STEP 2 – SEARCH AGENT (Tavily)
Spawn a dedicated Search Agent with the following rules:

AGENT NAME: search_agent
TOOL: Tavily Search API
MODE: Targeted – never broad/generic searches

Search Agent Instructions:
- Always formulate precise, specific search queries
- Include ticker symbol when searching stock-related topics
  Example: "NVDA Q1 2026 earnings report beat miss"
  NOT: "nvidia news"
- Search depth: use "advanced" mode for financial data
- Max results per search: 5 high-quality sources
- Preferred domains: 
    reuters.com, bloomberg.com, wsj.com, 
    seekingalpha.com, sec.gov, businesswire.com,
    prnewswire.com, marketwatch.com
- Avoid: reddit.com, twitter.com, opinion blogs
- Always include publication date in extracted data
- If first search returns insufficient data → refine query and retry ONCE

Output format from Search Agent:
{
  "query": "original search query",
  "results": [
    {
      "title": "",
      "source": "",
      "url": "",
      "published_date": "",
      "summary": "",
      "raw_content": ""
    }
  ],
  "search_timestamp": "",
  "result_count": 0
}

---

### STEP 3 – QUALITY REVIEW AGENT
After Search Agent returns results, spawn Quality Review Agent:

AGENT NAME: quality_review_agent

Review Criteria – each result is scored 0-10 on:

1. RELEVANCE (0-3)
   - 3: Directly answers the search query
   - 2: Partially relevant
   - 1: Loosely related
   - 0: Not relevant → discard immediately

2. SOURCE CREDIBILITY (0-3)
   - 3: Tier 1 source (Reuters, Bloomberg, WSJ, SEC filing)
   - 2: Tier 2 source (MarketWatch, SeekingAlpha, BusinessWire)
   - 1: Unknown but credible source
   - 0: Unreliable source → discard immediately

3. FRESHNESS (0-2)
   - 2: Published within last 24 hours
   - 1: Published within last 7 days
   - 0: Older than 7 days → flag as STALE

4. DATA QUALITY (0-2)
   - 2: Contains specific numbers, dates, facts
   - 1: General statements, some specifics
   - 0: Vague, no concrete data → discard

SCORING THRESHOLDS:
- Score 8-10 → APPROVED ✅ → proceed to deploy
- Score 5-7  → APPROVED WITH FLAG ⚠️ → deploy with confidence warning
- Score 0-4  → REJECTED ❌ → discard, do not use

Minimum approved results to proceed: 2
If less than 2 approved → trigger new Tavily search with refined query

Quality Review Output:
{
  "reviewed_results": [
    {
      "title": "",
      "source": "",
      "score": 0,
      "status": "APPROVED | FLAGGED | REJECTED",
      "reason": "",
      "key_facts": []
    }
  ],
  "approved_count": 0,
  "proceed_to_deploy": true/false
}

---

### STEP 4 – DEPLOY
Only deploy if quality_review_agent returns proceed_to_deploy: true

Deploy means:
- Write approved data to the relevant memory file
- Update the dashboard data feed
- Trigger any alerts if thresholds are met (e.g. earnings beat/miss)
- Log the operation with timestamp and source

Deploy Log Entry format:
{
  "timestamp": "",
  "ticker": "",
  "data_type": "news | earnings | analysis | alert",
  "sources_used": [],
  "confidence": "HIGH | MEDIUM | LOW",
  "deployed_to": "dashboard | memory | alert_system",
  "summary": ""
}

---

## HARD RULES – NEVER BREAK THESE

1. NEVER use Google, Bing, DuckDuckGo or any other search tool → ONLY Tavily
2. NEVER deploy data that scored below 5 in quality review
3. NEVER skip the quality review step, even under time pressure
4. NEVER use data older than 7 days without flagging it as STALE
5. ALWAYS log every search and deploy operation
6. ALWAYS include the source URL in deployed data
7. If Tavily is unavailable → STOP and notify user, do NOT fallback to 
   another search tool

---

## MEMORY FILE LOCATIONS
- Search logs:     /memory/search_logs.json
- Quality reports: /memory/quality_reports.json  
- Deploy logs:     /memory/deploy_logs.json
- News cache:      /memory/news_cache.json
- Earnings data:   /memory/earnings.json

---

## EXAMPLE TRIGGER → FULL PIPELINE

User: "What are the latest NVDA earnings?"

1. search_agent → Tavily query: "NVDA NVIDIA Q4 2025 earnings results EPS revenue"
2. quality_review_agent → reviews 5 results, approves 3
3. proceed_to_deploy: true
4. Data written to /memory/earnings.json
5. Dashboard updated
6. Deploy log entry created

---
    
```
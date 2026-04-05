# Dashboard — Claude Instructions

## Library Documentation
Always use Context7 when writing code with specific libraries (React, Recharts, Vite, TailwindCSS, Express, etc.) to get accurate, version-specific API docs.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Recharts + Framer Motion
- **Backend:** Node.js Express (`server/index.js`, port 3001)
- **Python:** `python3` in `python/scripts/` for calculations (`yfinance`, `pandas`, `numpy`)
- **Data:** `data/*.json` (persistent JSON store)

## Conventions
- Prices always from TradingView (`fetchTradingViewQuotes` in server/services/quotes.js), never Yahoo Finance
- EUR/USD rate from Yahoo Finance (`fetchEurUsd`) only — used to convert USD equity prices to EUR
- Shared formatters in src/utils/formatters.ts (fmt, fmtEur, getLogoUrl, TV_LOGO_MAP)
- Production build: `npm run build` → served from /dist by Express
- After backend changes: restart server (`sudo -n systemctl restart dashboard`)
- After frontend changes: `npm run build` + server restart

## sudo / systemctl

- Always use `sudo -n` (no TTY available in Claude Code subprocess)
- Never append `--no-pager` — it breaks the sudoers rule match
- Correct: `sudo -n systemctl start|stop|restart|status dashboard`

## Price Data Sources

| Asset Type        | Source                    | Currency                    |
|-------------------|---------------------------|-----------------------------|
| US Equities       | TradingView scanner API   | USD → EUR via fetchEurUsd() |
| Crypto            | CoinGecko free API        | EUR                         |
| EUR/USD Rate      | Yahoo Finance (EURUSD=X)  | —                           |

**Never use Yahoo Finance for stock prices.**

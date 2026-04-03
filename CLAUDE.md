# Dashboard — Claude Instructions

## Library Documentation
Always use Context7 when writing code with specific libraries (React, Recharts, Vite, TailwindCSS, Express, etc.) to get accurate, version-specific API docs.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Recharts + Framer Motion
- **Backend:** Node.js Express (server/index.js, port 3001)
- **Python:** python3 in python/scripts/ for calculations (yfinance, pandas, numpy)
- **Data:** data/*.json (persistent JSON store)

## Conventions
- Prices always from TradingView (`fetchTradingViewQuotes` in server/services/quotes.js), never Yahoo Finance
- Shared formatters in src/utils/formatters.ts (fmt, fmtEur, getLogoUrl, TV_LOGO_MAP)
- Production build: `npm run build` → served from /dist by Express
- After backend changes: restart server (systemd: `sudo systemctl restart dashboard`)
- After frontend changes: `npm run build` + server restart

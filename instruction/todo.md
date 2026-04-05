# Implementation Roadmap

## Offen

### Portfolio — Phase 2: Erweiterte Kennzahlen
- [ ] **Interner Zinsfuß (IRR)** — `python/scripts/irr.py` + KPI-Karte auf Portfolio-Seite
- [ ] **Korrelationsmatrix** — Pearson über 30/90/180 Tage, Heatmap (Recharts)
- [ ] **Kennzahlen Widget** — Sharpe Ratio, Volatilität, Beta, Max Drawdown
- [ ] **TR Cash-Subscription** — pytr `subscribe('cash')` für automatischen Saldo
- [ ] **`build:deploy` Script** in package.json — build + restart in einem Befehl
- [ ] **Portfolio History: periodische Auto-Aktualisierung** — täglich via cron

### Earnings-Seite
- [ ] Ticker-Suche → Unternehmens-Kennzahlen (EPS, KGV, MarketCap, Revenue)
- [ ] Eigene Analyse-Seite pro Ticker

### Performance Chart
- [ ] **Prozent-Modus** — Portfolio % vs. S&P 500 % auf separatem Toggle
- [ ] **SPY Absolute Linie** — SPY-Äquivalent in EUR (normalisiert auf Investitionssumme)

---

## Erledigt

- [x] Ordnerstruktur bereinigt (server.js → server/, data/ aufgeräumt)
- [x] Portfolio Tracker (Positionen, P&L, Donut-Chart, Bar-Chart)
- [x] Trade Republic Sync via pytr
- [x] Kurspreise TradingView (USD) → EUR via EUR/USD Rate
- [x] Crypto-Preise via CoinGecko (BTC, SOL, ADA in EUR)
- [x] Cash (Verrechnungskonto) in Gesamtwert
- [x] Positionstabelle: Name + WKN + ISIN + Kurs + Einstiegswert + Kursgewinn + Allokation
- [x] 5-Min Cache für Kursabfragen
- [x] Shared utils/formatters.ts (getLogoUrl, fmt, fmtEur, TV_LOGO_MAP)
- [x] python/ Ordner + requirements.txt
- [x] Systemd Service (auto-start nach Reboot)
- [x] Nginx Reverse Proxy (Port 80 → 3001)
- [x] GitHub MCP + Context7 MCP konfiguriert
- [x] Performance Chart: Portfolio vs. Investiertes Kapital (1M/3M/6M/1Y/All)
- [x] Performance Chart: Portfolio % vs. S&P 500 % (Benchmark-Badge)
- [x] python/scripts/portfolio_history.py + GET /api/portfolio/history
- [x] POST /api/portfolio/history/refresh (startet portfolio_history.py)
- [x] Portfolio UI: Dark Finance Theme, sortierbare Tabelle, Framer Motion
- [x] instruction/ Ordner mit Agent-Dokumentation
- [x] NewsFeed-Seite (/news)
- [x] EarningsCalendar-Seite (/earnings-calendar)
- [x] ThemeContext + LanguageContext
- [x] tr_auth.py: 2-Schritt Device-Reset Flow (request + complete)
- [x] tr_sync.py: Auto-Relogin via api.login() wenn Cookie-Session abläuft
- [x] POST /api/portfolio/auth/request (Initiiert Device Reset)
- [x] Portfolio Layout: Performance Chart (8/12) + Donut (4/12) nebeneinander
- [x] Donut Chart vergrößert (200px, innerRadius 70, outerRadius 95)
- [x] KPI-Karten: größere Schrift (text-2xl), deutlichere Darstellung
- [x] Tabelle: größere Schrift (text-sm), bessere Lesbarkeit
- [x] Performance Chart: echte Verlaufsdaten, Range-Selector, Benchmark-Vergleich

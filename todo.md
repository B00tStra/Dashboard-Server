# Implementation Roadmap

---

## 🔴 Als nächstes

### Portfolio Seite — Phase 2
- [ ] **Performance Chart: Portfolio vs. Investiertes Kapital**
  - Area Chart: Gesamtwert (live) vs. Einstandswert (fix) über Zeit
  - Datenbasis: Historische Kurse via `yfinance` + TR Kaufdaten
  - `python/scripts/portfolio_history.py` → `data/portfolio_history.json`
  - Node Endpoint `GET /api/portfolio/history`
  - Zeitraum-Filter: 1M / 3M / 6M / 1J / Max
- [ ] **Performance Chart: Portfolio vs. S&P 500**
  - Prozentualer Vergleich ab Erstkauf-Datum
  - S&P 500 (SPY) als Benchmark-Linie im gleichen Chart
- [ ] **Interner Zinsfuß (IRR)**
  - `python/scripts/irr.py` — berechnet IRR aus Kaufdaten + aktuellem Wert
  - Anzeige als KPI-Karte auf der Portfolio-Seite
- [ ] **Korrelationsmatrix**
  - `python/scripts/correlation.py` mit `pandas` + `yfinance`
  - Pearson-Korrelation über 30/90/180 Tage
  - Heatmap auf der Portfolio-Seite (Recharts)
- [ ] **Kennzahlen Widget** — Sharpe Ratio, Volatilität, Beta, Max Drawdown
  - `python/scripts/portfolio_metrics.py`

---

## 🟡 Diese Woche

### Production Build Workflow
- [ ] `package.json` Script: `"build:deploy"` → build + server restart in einem Schritt

### Berichte-Seite
- [ ] Ticker-Suche → Unternehmens-Kennzahlen laden (EPS, KGV, MarketCap, Revenue)
- [ ] Eigene Analyse-Seite pro Ticker

---

## 🟢 Nächste Woche

### Web Scraper + Alerting
- [ ] `python/scraper/scraper.py` — HTTP Requests + BeautifulSoup
- [ ] `python/scraper/config.json` — Scrape-Ziele definieren (Immobilien, Preise, Jobs)
- [ ] `python/scraper/alerts.py` — Telegram Bot Setup (5 min)
- [ ] Cron-Job einrichten: alle 30 Minuten automatisch scrapen
- [ ] Optional: Scraper-Verwaltung im Dashboard UI

### Dashboard — Allgemeine Verbesserungen
- [ ] **Makro-Alerting** — Push wenn FRED-Daten kritische Schwellen überschreiten
  - z.B. Yield Curve invertiert, Inflation > X%, Fed Rate Änderung
  - Telegram Notification
- [ ] Portfolio-Seite: Position bearbeiten (Stückzahl/Kaufkurs ändern)
- [ ] Portfolio-Seite: Transaktionshistorie (Käufe/Verkäufe)

---

## 🔵 Später / Ideen

### Python Berechnungen
- [ ] DCF-Berechnung in Python auslagern (präziser als Frontend-Approximation)
- [ ] Monte Carlo Simulation für Portfolio-Risiko
- [ ] Sektor-Rotation Analyse

### MCP Server Integration
- [ ] Context7 aktivieren → aktuelle Library-Doku beim Coden
- [ ] GitHub MCP → direkt pushen ohne Terminal

### Infrastruktur
- [ ] Systemd Service für Node-Server → startet automatisch nach Reboot
- [ ] Nginx Reverse Proxy → Port 80/443 statt 3001
- [ ] HTTPS Zertifikat (Let's Encrypt)
- [ ] Automatische Backups von `data/*.json`

---

## ✅ Erledigt

- [x] Ordnerstruktur bereinigt (server.js → server/, data/ aufgeräumt)
- [x] Portfolio Tracker Grundgerüst (Positionen, P&L, Donut-Chart, Bar-Chart)
- [x] Trade Republic Sync via pytr (Button + automatisch)
- [x] Kurspreise von TradingView statt Yahoo Finance
- [x] 5-Min Cache für Kursabfragen
- [x] Shared utils/formatters.ts (getLogoUrl, fmt, fmtEur, TV_LOGO_MAP)
- [x] Ticker-Suche auf Berichte-Seite verschoben
- [x] python/ Ordner angelegt + requirements.txt
- [x] MarketDebate entfernt
- [x] ARCHITECTURE.md erstellt
- [x] GitHub Stand gepusht

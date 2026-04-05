#!/usr/bin/env python3
"""
portfolio_history.py — Portfolio historical performance vs. invested capital + S&P 500
Reads  data/portfolio.json
Writes data/portfolio_history.json
"""
import json, sys
from pathlib import Path
from datetime import datetime, timedelta

import yfinance as yf
import pandas as pd

BASE_DIR       = Path(__file__).resolve().parent.parent.parent
PORTFOLIO_FILE = BASE_DIR / "data" / "portfolio.json"
OUTPUT_FILE    = BASE_DIR / "data" / "portfolio_history.json"

# Internal ticker → yfinance symbol
TICKER_MAP = {
    "BTC-EUR": "BTC-EUR",
    "SOL-EUR": "SOL-EUR",
    "ADA-EUR": "ADA-EUR",
}

def main():
    with open(PORTFOLIO_FILE) as f:
        portfolio = json.load(f)

    positions = portfolio.get("positions", [])
    if not positions:
        print("No positions found", file=sys.stderr)
        sys.exit(1)

    end   = datetime.today()
    start = end - timedelta(days=365)

    # Map internal tickers → yfinance symbols, group positions by yf symbol
    pos_by_sym: dict[str, list] = {}
    for p in positions:
        sym = TICKER_MAP.get(p["ticker"], p["ticker"])
        pos_by_sym.setdefault(sym, []).append(p)

    all_syms = list(pos_by_sym.keys()) + ["SPY"]
    print(f"Downloading {len(all_syms)} symbols: {all_syms}", flush=True)

    raw = yf.download(
        all_syms,
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
    )

    if raw.empty:
        print("No data returned from yfinance", file=sys.stderr)
        sys.exit(1)

    # Extract Close prices → single DataFrame (date × symbol)
    if isinstance(raw.columns, pd.MultiIndex):
        # Default yfinance format: (metric, ticker) MultiIndex
        if "Close" in raw.columns.get_level_values(0):
            closes = raw["Close"].copy()
        else:
            # Fallback: (ticker, metric)
            closes = pd.DataFrame({
                sym: raw[(sym, "Close")]
                for sym in all_syms
                if (sym, "Close") in raw.columns
            })
    else:
        closes = raw[["Close"]].rename(columns={"Close": all_syms[0]})

    closes = closes.ffill().bfill()

    # Fixed invested capital (cost basis, never changes)
    total_invested = sum(p["shares"] * p["avgBuyPrice"] for p in positions)

    series      = []
    spy_start   = None
    val_start   = None

    for date, row in closes.iterrows():
        # Daily portfolio market value
        daily_value = 0.0
        for sym, pos_list in pos_by_sym.items():
            price = row.get(sym) if sym in row.index else None
            if price is None or (hasattr(price, '__float__') and pd.isna(price)):
                # Fallback: average avgBuyPrice of positions for this symbol
                price = sum(p["avgBuyPrice"] for p in pos_list) / len(pos_list)
            for p in pos_list:
                daily_value += p["shares"] * float(price)

        # SPY benchmark % change from first day
        spy_raw = row.get("SPY") if "SPY" in row.index else None
        if spy_raw is not None and not pd.isna(spy_raw):
            spy_val = float(spy_raw)
            if spy_start is None:
                spy_start = spy_val
            spy_pct = (spy_val - spy_start) / spy_start * 100
        else:
            spy_pct = 0.0

        # Portfolio % change from first day
        if val_start is None:
            val_start = daily_value
        val_pct = (daily_value - val_start) / val_start * 100 if val_start else 0.0

        series.append({
            "date":      date.strftime("%Y-%m-%d"),
            "value":     round(daily_value, 2),
            "invested":  round(total_invested, 2),
            "value_pct": round(val_pct, 2),
            "spy_pct":   round(spy_pct, 2),
        })

    result = {
        "generated_at":   datetime.utcnow().isoformat() + "Z",
        "total_invested": round(total_invested, 2),
        "series":         series,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2)

    print(f"OK — {len(series)} Tage geschrieben nach {OUTPUT_FILE}", flush=True)

if __name__ == "__main__":
    main()

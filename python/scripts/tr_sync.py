#!/usr/bin/env python3
"""
Syncs Trade Republic portfolio to data/portfolio.json
Usage: python3 tr_sync.py
"""

import asyncio
import json
import sys
from decimal import Decimal
from pathlib import Path

REPO_ROOT   = Path(__file__).resolve().parents[2]
OUTPUT_FILE = REPO_ROOT / 'data' / 'portfolio.json'

ISIN_TO_TICKER = {
    'US81762P1021': 'NOW',    # ServiceNow
    'US0079031078': 'AMD',    # AMD
    'US64110L1061': 'NFLX',   # Netflix
    'US0404132054': 'ANET',   # Arista Networks
    'US34959E1091': 'FTNT',   # Fortinet
    'US0231351067': 'AMZN',
    'US5949181045': 'MSFT',
    'US0378331005': 'AAPL',
    'US88160R1014': 'TSLA',
    'US67066G1040': 'NVDA',
    'US30303M1027': 'META',
    'US02079K3059': 'GOOGL',
    'XF000BTC0017': 'BTC-EUR',
    'XF000SOL0012': 'SOL-EUR',
    'XF000ADA0018': 'ADA-EUR',
}

async def fetch():
    from pytr.api import TradeRepublicApi
    from pytr.portfolio import Portfolio

    api = TradeRepublicApi(save_cookies=True)

    # Step 1: try to resume existing web session (cookies)
    ok = False
    try:
        ok = api.resume_websession()
    except Exception:
        pass

    # Step 2: if cookie session invalid, try fresh login with stored credentials
    if not ok:
        try:
            print('[TR Sync] Cookie-Session abgelaufen — versuche Login mit gespeicherten Credentials...')
            api.login()
            ok = True
            print('[TR Sync] Login erfolgreich.', flush=True)
        except Exception as e:
            msg = str(e)
            print(f'SESSION_EXPIRED: Kann nicht einloggen — Device-Reset erforderlich? ({msg})')
            sys.exit(2)

    p = Portfolio(api, lang='en')
    await p.portfolio_loop()

    positions = []
    for pos in p.portfolio:
        isin     = pos.get('instrumentId', '')
        shares   = float(Decimal(str(pos.get('netSize', 0))))
        avg_cost = float(Decimal(str(pos.get('averageBuyIn', 0))))
        name     = pos.get('name', isin)
        ticker   = ISIN_TO_TICKER.get(isin, isin)

        if ticker == isin:
            print(f'  [WARN] Kein Ticker-Mapping für ISIN {isin} ({name})')

        positions.append({
            'ticker':      ticker,
            'isin':        isin,
            'companyName': name,
            'shares':      round(shares, 8),
            'avgBuyPrice': round(avg_cost, 4),
            'buyDate':     '',
            'source':      'trade_republic',
        })

    return positions

def main():
    print('[TR Sync] Verbinde mit Trade Republic...')
    try:
        positions = asyncio.run(fetch())
    except SystemExit:
        raise
    except Exception as e:
        print(f'[TR Sync] FEHLER: {e}')
        sys.exit(1)

    # Manuelle Positionen (ohne source) behalten
    existing = {'positions': []}
    if OUTPUT_FILE.exists():
        try:
            existing = json.loads(OUTPUT_FILE.read_text())
        except Exception:
            pass

    manual = [p for p in existing.get('positions', []) if p.get('source') != 'trade_republic']
    merged = positions + manual

    OUTPUT_FILE.write_text(json.dumps({'positions': merged}, indent=2, ensure_ascii=False))

    print(f'[TR Sync] ✓ {len(positions)} Positionen synchronisiert:')
    for p in positions:
        print(f'  {p["ticker"]:12} {p["shares"]:>12.4f} Stück  @ {p["avgBuyPrice"]:>10.4f}')
    if manual:
        print(f'[TR Sync] + {len(manual)} manuelle Positionen behalten')

if __name__ == '__main__':
    main()

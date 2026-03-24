"""
Fetches live market prices and writes data/prices.json.
Runs via GitHub Actions — no CORS, no API key required.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

SYMBOLS = {
    "DOW":    "^DJI",
    "SP":     "^GSPC",
    "NASDAQ": "^IXIC",
    "BTC":    "BTC-USD",
    "ETH":    "ETH-USD",
}

def fetch_quote(yahoo_symbol: str) -> dict | None:
    try:
        ticker = yf.Ticker(yahoo_symbol)
        info = ticker.fast_info
        price    = getattr(info, "last_price",       None)
        prev     = getattr(info, "previous_close",   None)
        if price is None or prev is None:
            return None
        change     = price - prev
        change_pct = (change / prev * 100) if prev else 0
        return {
            "price":      round(price, 2),
            "change":     round(change, 2),
            "change_pct": round(change_pct, 4),
        }
    except Exception as e:
        print(f"  Error fetching {yahoo_symbol}: {e}")
        return None

def main():
    out = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "prices": {},
    }

    for name, symbol in SYMBOLS.items():
        print(f"Fetching {name} ({symbol})...")
        quote = fetch_quote(symbol)
        if quote:
            out["prices"][name] = quote
            print(f"  {name}: ${quote['price']:,.2f}  {quote['change_pct']:+.2f}%")
        else:
            print(f"  {name}: failed")

    dest = Path(__file__).parents[2] / "data" / "prices.json"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {dest}")

if __name__ == "__main__":
    main()

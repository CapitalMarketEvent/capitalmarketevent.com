"""
Thin wrapper that runs the historical scanner and writes to data/milestones.json.
Lives in the website repo so GitHub Actions can call it without needing the
CapitalMarketAgent repo checked out.

The scanner logic is duplicated here (or can be kept in sync with
CapitalMarketAgent/automation/historical_scanner.py).
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

SCAN_TARGETS = [
    {
        "symbol": "^DJI", "name": "Dow Jones Industrial Average", "currency": "USD",
        "milestones": [
            100, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
            10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000,
            20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000,
            30000, 31000, 32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000,
            40000, 41000, 42000, 43000, 44000, 45000,
        ],
    },
    {
        "symbol": "^GSPC", "name": "S&P 500", "currency": "USD",
        "milestones": [
            100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200,
            1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300,
            2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400,
            3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500,
            4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300, 5400, 5500, 5600,
            5700, 5800, 5900, 6000,
        ],
    },
    {
        "symbol": "^IXIC", "name": "NASDAQ Composite", "currency": "USD",
        "milestones": [
            500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
            10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000,
            19000, 20000,
        ],
    },
    {
        "symbol": "BTC-USD", "name": "Bitcoin", "currency": "USD",
        "milestones": [
            1, 10, 100, 1000, 5000, 10000, 20000, 30000, 40000, 50000,
            60000, 70000, 80000, 90000, 100000,
        ],
    },
    {
        "symbol": "SPY", "name": "SPDR S&P 500 ETF (SPY)", "currency": "USD",
        "milestones": [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600],
    },
    {
        "symbol": "QQQ", "name": "Invesco QQQ Trust (NASDAQ ETF)", "currency": "USD",
        "milestones": [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
    },
]

HISTORICAL_NOTES = {
    "^DJI:100":       "1906 — Dow first closed above 100. The Industrial Revolution was in full swing.",
    "^DJI:1000":      "1972 — Dow 1,000 on a closing basis (intraday 1966). Nixon era.",
    "^DJI:2000":      "1987 — Dow 2,000 in January. Black Monday crash followed in October.",
    "^DJI:3000":      "1991 — Post-Gulf War rally.",
    "^DJI:5000":      "1995 — The dot-com buildup begins.",
    "^DJI:10000":     "1999 — Giuliani and Dick Grasso threw caps on the NYSE floor. The hat tradition begins.",
    "^DJI:20000":     "2017 — Trump's first full week in office.",
    "^DJI:30000":     "2020 — November, pandemic year. Market shrugged off COVID.",
    "^DJI:40000":     "2024 — May 16, 2024.",
    "BTC-USD:1":      "2011 — Bitcoin hits $1 for the first time.",
    "BTC-USD:1000":   "2013 — Cyprus banking crisis drove early adoption.",
    "BTC-USD:10000":  "2017 — Bitcoin $10K during the first mainstream crypto mania.",
    "BTC-USD:20000":  "2020 — December, surpassing the 2017 all-time high.",
    "BTC-USD:100000": "2024 — Six figures. Trump election catalyst.",
}


def scan_symbol(symbol, name, milestones):
    logger.info(f"Scanning {symbol}...")
    try:
        hist = yf.Ticker(symbol).history(period="max", auto_adjust=True)
    except Exception as e:
        logger.error(f"  Failed: {e}")
        return []
    if hist.empty:
        return []
    close = hist["Close"].dropna()
    results = []
    for level in sorted(milestones):
        crossed = close[close >= level]
        if crossed.empty:
            continue
        results.append({
            "level":       level,
            "first_close": crossed.index[0].strftime("%Y-%m-%d"),
            "close_price": round(float(crossed.iloc[0]), 2),
            "notes":       HISTORICAL_NOTES.get(f"{symbol}:{level}", ""),
        })
    logger.info(f"  {len(results)}/{len(milestones)} milestones crossed")
    return results


def main():
    series = []
    for t in SCAN_TARGETS:
        milestones = scan_symbol(t["symbol"], t["name"], t["milestones"])
        series.append({
            "symbol":     t["symbol"],
            "name":       t["name"],
            "currency":   t.get("currency", "USD"),
            "milestones": milestones,
        })

    out = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "series":    series,
    }

    dest = Path(__file__).parents[2] / "data" / "milestones.json"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(out, indent=2))
    logger.info(f"\nWrote {dest}")


if __name__ == "__main__":
    main()

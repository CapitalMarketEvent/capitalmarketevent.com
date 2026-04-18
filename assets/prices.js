/**
 * Capital Market Event - Market Data
 *
 * Prices: Finnhub direct fetch (live, free API key required) with fallback
 * to /data/prices.json (updated every 30min by GitHub Actions).
 * Set FINNHUB_KEY below once you have a key from finnhub.io (free account).
 * Trending: StockTwits (no auth, CORS-safe) + Tradestie WSB (no auth).
 */

// Set your Finnhub API key here (free at finnhub.io — exposing a free key is acceptable risk)
const FINNHUB_KEY = '';  // e.g. 'abc123xyz'

// ─── Milestones tracked in "On Deck" section ─────────────────────────────────
const MILESTONES = {
    DOW:    { elementId: 'dji-status',  targets: [45000, 50000, 60000, 100000] },
    SP:     { elementId: 'gspc-status', targets: [6000,  7000,  8000]          },
    NASDAQ: { elementId: 'ixic-status', targets: [20000, 25000]                },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(num, decimals = 0) {
    if (num == null || num === 0) return '--';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function signClass(val) { return val >= 0 ? 'positive' : 'negative'; }
function sign(val)      { return val >= 0 ? '+' : ''; }

// ─── Finnhub symbols ─────────────────────────────────────────────────────────
// ETFs and crypto work on Finnhub free tier.
// Futures (CME:YM1! etc.) and precious metal spot (OANDA:XAU_USD) may need premium —
// those assets fall back to /data/prices.json from GitHub Actions.

const FINNHUB_SYMBOLS = {
    // Primary indexes
    DOW:    '^DJI',
    SP:     '^GSPC',
    NASDAQ: '^IXIC',
    RUT:    '^RUT',
    // Index ETFs
    SPY:    'SPY',
    QQQ:    'QQQ',
    IWM:    'IWM',
    DIA:    'DIA',
    VOO:    'VOO',
    // Precious metal ETFs (proxy for gold/silver spot)
    GLD:    'GLD',
    SLV:    'SLV',
    // Crypto
    BTC:    'BINANCE:BTCUSDT',
    ETH:    'BINANCE:ETHUSDT',
    // Crypto spot ETFs
    IBIT:   'IBIT',
    ETHA:   'ETHA',
};

// ─── Fetch live prices from Finnhub ──────────────────────────────────────────

async function fetchFinnhub(key) {
    const results = {};
    await Promise.all(Object.entries(FINNHUB_SYMBOLS).map(async ([name, symbol]) => {
        try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const q = await res.json();
            if (!q.c) return;  // c = current price; 0 means no data
            results[name] = {
                price:      q.c,
                change:     q.d,       // absolute change
                change_pct: q.dp,      // percent change
            };
        } catch (_) { /* skip on error */ }
    }));
    return results;
}

// ─── Load prices: Finnhub live → fallback to static JSON ─────────────────────

async function loadPrices() {
    if (FINNHUB_KEY) {
        const live = await fetchFinnhub(FINNHUB_KEY);
        if (Object.keys(live).length > 0) return live;
    }
    try {
        // Cache-bust so browsers don't serve stale data after GitHub Actions updates
        const res = await fetch(`/data/prices.json?t=${Math.floor(Date.now() / 300_000)}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        return data.prices || {};
    } catch (e) {
        console.warn('Price load failed:', e.message);
        return {};
    }
}

// ─── Render ticker bar ────────────────────────────────────────────────────────

const TICKER_DISPLAY = [
    { key: 'DOW',    label: 'DOW',    prefix: '' },
    { key: 'SP',     label: 'S&P',    prefix: '' },
    { key: 'NASDAQ', label: 'NASDAQ', prefix: '' },
    { key: 'RUT',    label: 'RUT',    prefix: '' },
    { key: 'GLD',    label: 'GOLD',   prefix: '$' },
    { key: 'SLV',    label: 'SILVER', prefix: '$' },
    { key: 'BTC',    label: 'BTC',    prefix: '$' },
    { key: 'ETH',    label: 'ETH',    prefix: '$' },
    { key: 'IBIT',   label: 'IBIT',   prefix: '$' },
];

function renderTickerBar(prices) {
    const el = document.getElementById('market-ticker');
    if (!el) return;
    el.innerHTML = TICKER_DISPLAY.map(({ key, label, prefix }) => {
        const d = prices[key];
        if (!d || !d.price) return `
            <div class="ticker-item">
                <span class="ticker-symbol">${label}</span>
                <span class="ticker-price">--</span>
            </div>`;
        return `
            <div class="ticker-item">
                <span class="ticker-symbol">${label}</span>
                <span class="ticker-price">${prefix}${fmt(d.price)}</span>
                <span class="ticker-change ${signClass(d.change)}">${sign(d.change)}${d.change_pct.toFixed(2)}%</span>
            </div>`;
    }).join('');
}

// ─── Render hero stats ────────────────────────────────────────────────────────

const HERO_DISPLAY = [
    { key: 'DOW',    label: 'DOW',    prefix: '' },
    { key: 'SP',     label: 'S&P',    prefix: '' },
    { key: 'NASDAQ', label: 'NASDAQ', prefix: '' },
    { key: 'RUT',    label: 'RUT',    prefix: '' },
];

function renderHeroStats(prices) {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    el.innerHTML = HERO_DISPLAY.map(({ key, label, prefix }) => {
        const d = prices[key];
        const price  = d?.price  ? `${prefix}${fmt(d.price)}` : '--';
        const change = d?.change_pct != null && d.price
            ? `<span class="stat-change ${signClass(d.change)}">${sign(d.change)}${d.change_pct.toFixed(2)}%</span>`
            : '';
        return `
            <div class="hero-stat" id="stat-${key.toLowerCase()}">
                <div class="stat-label">${label}</div>
                <div class="stat-price">${price}</div>
                ${change}
            </div>`;
    }).join('');
}

// ─── Milestone progress ───────────────────────────────────────────────────────

function updateMilestones(prices) {
    for (const [key, cfg] of Object.entries(MILESTONES)) {
        const el = document.getElementById(cfg.elementId);
        if (!el) continue;
        const d = prices[key];
        if (!d?.price) { el.textContent = '--'; continue; }

        const next = cfg.targets.find(t => t > d.price);
        if (!next) { el.textContent = 'No target set'; continue; }

        const pct = ((d.price / next) * 100).toFixed(1);
        el.textContent = `${fmt(next)} (${pct}% there)`;
    }
}

// ─── StockTwits trending ──────────────────────────────────────────────────────

async function fetchStockTwitsTrending() {
    try {
        const res = await fetch('https://api.stocktwits.com/api/2/streams/trending.json');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const seen = new Set();
        const out = [];
        for (const msg of (data.messages || [])) {
            const sym = msg.symbols?.[0]?.symbol;
            if (sym && !seen.has(sym)) {
                seen.add(sym);
                out.push({ symbol: sym, sentiment: msg.entities?.sentiment?.basic || null });
            }
            if (out.length >= 12) break;
        }
        return out;
    } catch (e) {
        console.warn('StockTwits failed:', e.message);
        return [];
    }
}

// ─── WSB trending (Tradestie) ─────────────────────────────────────────────────

async function fetchWSBTrending() {
    try {
        const res = await fetch('https://tradestie.com/api/v1/apps/reddit');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        return (data || []).slice(0, 10).map(item => ({
            symbol:    item.ticker,
            mentions:  item.no_of_comments,
            sentiment: item.sentiment,
        }));
    } catch (e) {
        console.warn('Tradestie failed:', e.message);
        return [];
    }
}

// ─── Render trending ──────────────────────────────────────────────────────────

function renderStockTwits(items) {
    const el = document.getElementById('stocktwits-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<span class="trending-empty">unavailable</span>'; return; }
    el.innerHTML = items.map(({ symbol, sentiment }) => {
        const cls = sentiment === 'Bullish' ? 'bull' : sentiment === 'Bearish' ? 'bear' : '';
        return `<a href="https://stocktwits.com/symbol/${symbol}" class="trending-tag ${cls}" target="_blank" rel="noopener">$${symbol}</a>`;
    }).join('');
}

function renderWSB(items) {
    const el = document.getElementById('wsb-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<span class="trending-empty">unavailable</span>'; return; }
    el.innerHTML = items.map(({ symbol, mentions, sentiment }) => {
        const cls = sentiment === 'Bullish' ? 'bull' : sentiment === 'Bearish' ? 'bear' : '';
        return `<a href="https://www.reddit.com/r/wallstreetbets/search/?q=${symbol}&sort=new" class="trending-tag ${cls}" target="_blank" rel="noopener">$${symbol}<span class="trending-count">${mentions}</span></a>`;
    }).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function updatePrices() {
    const prices = await loadPrices();
    renderTickerBar(prices);
    renderHeroStats(prices);
    updateMilestones(prices);
}

async function updateTrending() {
    const [st, wsb] = await Promise.all([fetchStockTwitsTrending(), fetchWSBTrending()]);
    renderStockTwits(st);
    renderWSB(wsb);
}

document.addEventListener('DOMContentLoaded', () => {
    updatePrices();
    updateTrending();
    // Re-check prices every 5 min (GitHub Actions updates the file every 30 min)
    setInterval(updatePrices,  5 * 60_000);
    setInterval(updateTrending, 5 * 60_000);
});

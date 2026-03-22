/**
 * Capital Market Event - Market Data
 * Prices via Yahoo Finance (CORS proxy), trending via StockTwits + Tradestie
 */

const CORS_PROXY = 'https://corsproxy.io/?';

const MARKET_SYMBOLS = [
    { symbol: '^DJI',    name: 'DOW',    id: 'dow',    decimals: 0 },
    { symbol: '^GSPC',   name: 'S&P',    id: 'sp',     decimals: 0 },
    { symbol: '^IXIC',   name: 'NASDAQ', id: 'nasdaq', decimals: 0 },
    { symbol: 'BTC-USD', name: 'BTC',    id: 'btc',    decimals: 0 },
    { symbol: 'ETH-USD', name: 'ETH',    id: 'eth',    decimals: 0 },
];

const MILESTONES = {
    '^DJI':    { elementId: 'dji-status',  targets: [45000, 50000, 60000, 100000] },
    '^GSPC':   { elementId: 'gspc-status', targets: [6000, 7000, 8000] },
    '^IXIC':   { elementId: 'ixic-status', targets: [20000, 25000] },
};

let priceCache = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(num, decimals = 0) {
    if (num == null) return '--';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function changeClass(val) {
    return val >= 0 ? 'positive' : 'negative';
}

function changeSign(val) {
    return val >= 0 ? '+' : '';
}

// ─── Yahoo Finance fetch (via CORS proxy) ────────────────────────────────────

async function fetchYahoo(yahooSymbol) {
    const target = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`;
    try {
        const res = await fetch(CORS_PROXY + target);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (!meta) throw new Error('no meta');

        const price = meta.regularMarketPrice;
        const prev  = meta.previousClose || meta.chartPreviousClose;
        const change = price - prev;
        const changePct = prev ? (change / prev) * 100 : 0;

        return { price, change, changePct, state: meta.marketState };
    } catch (e) {
        console.warn('Price fetch failed for', yahooSymbol, e.message);
        return null;
    }
}

// ─── Render market ticker bar ─────────────────────────────────────────────────

function renderTickerBar(items) {
    const el = document.getElementById('market-ticker');
    if (!el) return;
    el.innerHTML = items.map(({ name, data }) => {
        if (!data) return `<div class="ticker-item"><span class="ticker-symbol">${name}</span><span class="ticker-price">--</span></div>`;
        return `<div class="ticker-item">
            <span class="ticker-symbol">${name}</span>
            <span class="ticker-price">${name === 'BTC' || name === 'ETH' ? '$' : ''}${fmt(data.price)}</span>
            <span class="ticker-change ${changeClass(data.change)}">${changeSign(data.change)}${data.changePct.toFixed(2)}%</span>
        </div>`;
    }).join('');
}

// ─── Render hero market stats ─────────────────────────────────────────────────

function renderHeroStats(items) {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    el.innerHTML = items.map(({ name, id, data }) => {
        const isCrypto = name === 'BTC' || name === 'ETH';
        const price = data ? `${isCrypto ? '$' : ''}${fmt(data.price)}` : '--';
        const pct   = data ? `<span class="stat-change ${changeClass(data.change)}">${changeSign(data.change)}${data.changePct.toFixed(2)}%</span>` : '';
        return `<div class="hero-stat" id="stat-${id}">
            <div class="stat-label">${name}</div>
            <div class="stat-price">${price}</div>
            ${pct}
        </div>`;
    }).join('');
}

// ─── Milestone progress ───────────────────────────────────────────────────────

function updateMilestones(priceMap) {
    for (const [symbol, cfg] of Object.entries(MILESTONES)) {
        const el = document.getElementById(cfg.elementId);
        if (!el) continue;
        const data = priceMap[symbol];
        if (!data) { el.textContent = '--'; continue; }

        const price = data.price;
        const next = cfg.targets.find(t => t > price);
        if (!next) { el.textContent = 'ATH territory'; continue; }

        const pct = ((price / next) * 100).toFixed(1);
        el.textContent = `${fmt(next)} (${pct}% there)`;
    }
}

// ─── StockTwits trending ──────────────────────────────────────────────────────

async function fetchStockTwitsTrending() {
    try {
        const res = await fetch('https://api.stocktwits.com/api/2/streams/trending.json');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        // Extract unique symbols from messages
        const seen = new Set();
        const symbols = [];
        for (const msg of (data.messages || [])) {
            const sym = msg.symbols?.[0]?.symbol;
            if (sym && !seen.has(sym)) {
                seen.add(sym);
                symbols.push({
                    symbol: sym,
                    sentiment: msg.entities?.sentiment?.basic || null,
                });
            }
            if (symbols.length >= 12) break;
        }
        return symbols;
    } catch (e) {
        console.warn('StockTwits fetch failed:', e.message);
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
            symbol: item.ticker,
            mentions: item.no_of_comments,
            sentiment: item.sentiment,
        }));
    } catch (e) {
        console.warn('Tradestie fetch failed:', e.message);
        return [];
    }
}

// ─── Render trending section ──────────────────────────────────────────────────

function renderTrending(stocktwits, wsb) {
    renderStockTwits(stocktwits);
    renderWSB(wsb);
}

function renderStockTwits(items) {
    const el = document.getElementById('stocktwits-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<span class="trending-empty">--</span>'; return; }
    el.innerHTML = items.map(({ symbol, sentiment }) => {
        const cls = sentiment === 'Bullish' ? 'bull' : sentiment === 'Bearish' ? 'bear' : '';
        return `<a href="https://stocktwits.com/symbol/${symbol}" class="trending-tag ${cls}" target="_blank" rel="noopener">$${symbol}</a>`;
    }).join('');
}

function renderWSB(items) {
    const el = document.getElementById('wsb-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<span class="trending-empty">--</span>'; return; }
    el.innerHTML = items.map(({ symbol, mentions, sentiment }) => {
        const cls = sentiment === 'Bullish' ? 'bull' : sentiment === 'Bearish' ? 'bear' : '';
        return `<a href="https://www.reddit.com/r/wallstreetbets/search/?q=${symbol}&sort=new" class="trending-tag ${cls}" target="_blank" rel="noopener">$${symbol}<span class="trending-count">${mentions}</span></a>`;
    }).join('');
}

// ─── Main update loop ─────────────────────────────────────────────────────────

async function updateAll() {
    // Fetch all prices in parallel
    const results = await Promise.all(
        MARKET_SYMBOLS.map(async (s) => ({
            ...s,
            data: await fetchYahoo(s.symbol),
        }))
    );

    // Build lookup map
    const priceMap = {};
    results.forEach(r => { priceMap[r.symbol] = r.data; });

    renderTickerBar(results);
    renderHeroStats(results.filter(r => ['DOW','S&P','NASDAQ','BTC'].includes(r.name)));
    updateMilestones(priceMap);

    // Cache
    priceCache = priceMap;
}

async function updateTrending() {
    const [stocktwits, wsb] = await Promise.all([
        fetchStockTwitsTrending(),
        fetchWSBTrending(),
    ]);
    renderTrending(stocktwits, wsb);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updateAll();
    updateTrending();

    setInterval(updateAll, 60_000);       // prices every 60s
    setInterval(updateTrending, 300_000); // trending every 5min
});

window.refreshPrices = updateAll;

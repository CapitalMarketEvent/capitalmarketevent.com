/**
 * Capital Market Event - Live Price Feed
 * Fetches real-time market data and displays it
 */

const MARKET_CONFIG = {
    symbols: [
        { symbol: 'DJI', name: 'Dow', yahoo: '^DJI' },
        { symbol: '^GSPC', name: 'S&P', yahoo: '^GSPC' },
        { symbol: '^IXIC', name: 'NASDAQ', yahoo: '^IXIC' },
        { symbol: 'BTC', name: 'Bitcoin', yahoo: 'BTC-USD' },
        { symbol: 'ETH', name: 'Ethereum', yahoo: 'ETH-USD' },
    ],
    updateInterval: 60000, // 60 seconds
    cacheTime: 30000, // 30 seconds cache
};

// Price cache
let priceCache = {};
let lastFetch = 0;

// Format number with commas
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format large numbers (market cap)
function formatLargeNumber(num) {
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
    return formatNumber(num);
}

// Fetch price from Yahoo Finance
async function fetchPrice(symbol, yahooSymbol) {
    const cacheKey = symbol;
    const now = Date.now();
    
    // Check cache
    if (priceCache[cacheKey] && (now - lastFetch) < MARKET_CONFIG.cacheTime) {
        return priceCache[cacheKey];
    }
    
    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`
        );
        
        if (!response.ok) throw new Error('Fetch failed');
        
        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (!result) throw new Error('No data');
        
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        
        const price = meta.regularMarketPrice || quote?.close?.[quote.close.length - 1];
        const prevClose = meta.previousClose || quote?.close?.[0];
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        
        const priceData = {
            price,
            change,
            changePercent,
            marketState: meta.marketState || 'CLOSED',
            timestamp: now
        };
        
        priceCache[cacheKey] = priceData;
        lastFetch = now;
        
        return priceData;
        
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return priceCache[cacheKey] || null;
    }
}

// Render ticker item
function createTickerItem(symbol, name, priceData) {
    if (!priceData) {
        return `<div class="ticker-item">
            <span class="ticker-symbol">${name}</span>
            <span class="ticker-price">--</span>
        </div>`;
    }
    
    const changeClass = priceData.change >= 0 ? 'positive' : 'negative';
    const changeSign = priceData.change >= 0 ? '+' : '';
    
    return `<div class="ticker-item">
        <span class="ticker-symbol">${name}</span>
        <span class="ticker-price">$${formatNumber(priceData.price)}</span>
        <span class="ticker-change ${changeClass}">
            ${changeSign}${formatNumber(priceData.changePercent)}%
        </span>
    </div>`;
}

// Update milestone status
function updateMilestoneStatus(symbol, elementId, milestones, priceData) {
    const element = document.getElementById(elementId);
    if (!element || !priceData) {
        if (element) element.textContent = '--';
        return;
    }
    
    const price = priceData.price;
    let status = 'TBD';
    
    // Check if milestone hit
    for (const milestone of milestones) {
        if (price >= milestone) {
            status = '✅ Done';
        } else {
            // Find next milestone
            const next = milestones.find(m => m > price);
            if (next) {
                const pct = ((price / next) * 100).toFixed(1);
                status = `${formatNumber(next)} (${pct}%)`;
            }
        }
    }
    
    element.textContent = status;
}

// Render all prices
async function updatePrices() {
    const tickerEl = document.getElementById('market-ticker');
    if (!tickerEl) return;
    
    let tickerHTML = '';
    
    for (const { symbol, name, yahoo } of MARKET_CONFIG.symbols) {
        const priceData = await fetchPrice(symbol, yahoo);
        tickerHTML += createTickerItem(symbol, name, priceData);
        
        // Update milestone status
        if (symbol === 'DJI') {
            updateMilestoneStatus(symbol, 'dji-status', [10000, 15000, 20000], priceData);
        } else if (symbol === '^GSPC') {
            updateMilestoneStatus(symbol, 'gspc-status', [3000, 4000, 5000, 6000], priceData);
        } else if (symbol === '^IXIC') {
            updateMilestoneStatus(symbol, 'ixic-status', [10000, 15000, 20000], priceData);
        }
    }
    
    tickerEl.innerHTML = tickerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updatePrices();
    
    // Update every interval
    setInterval(updatePrices, MARKET_CONFIG.updateInterval);
});

// Export for manual refresh
window.refreshPrices = updatePrices;

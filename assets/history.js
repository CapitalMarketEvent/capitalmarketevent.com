/**
 * Capital Market Event - History Page
 * Loads milestones.json and renders the milestone history table.
 */

let allData = null;
let activeSymbol = null;

function fmt(num) {
    if (num == null) return '--';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function buildTabs(series) {
    const wrap = document.getElementById('history-tabs');
    if (!wrap) return;
    wrap.innerHTML = series.map((s, i) => `
        <button class="history-tab${i === 0 ? ' active' : ''}"
                data-symbol="${s.symbol}"
                onclick="selectTab('${s.symbol}')">
            ${s.name.replace('Dow Jones Industrial Average', 'Dow')
                     .replace('NASDAQ Composite', 'NASDAQ')
                     .replace('S&P 500', 'S&P 500')
                     .replace('Bitcoin', 'BTC')
                     .split('(')[0].trim()}
        </button>
    `).join('');
}

function selectTab(symbol) {
    activeSymbol = symbol;
    document.querySelectorAll('.history-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.symbol === symbol);
    });
    const series = allData.series.find(s => s.symbol === symbol);
    renderTable(series);
}

// ── Table ─────────────────────────────────────────────────────────────────────

const NOTABLE = new Set([
    1000, 2000, 5000, 10000, 20000, 25000, 30000, 35000, 40000, 45000, // Dow
    500, 1000, 2000, 3000, 4000, 5000, 6000,                            // S&P
    5000, 10000, 15000, 20000,                                           // NASDAQ
    1, 1000, 10000, 20000, 50000, 100000,                                // BTC
    100, 200, 300, 400, 500,                                             // SPY/QQQ
]);

function renderTable(series) {
    const loading  = document.getElementById('history-loading');
    const tableWrap = document.getElementById('history-table-wrap');
    const empty    = document.getElementById('history-empty');
    const tbody    = document.getElementById('history-tbody');

    if (!series || !series.milestones || series.milestones.length === 0) {
        loading.style.display  = 'none';
        tableWrap.style.display = 'none';
        empty.style.display    = 'block';
        return;
    }

    // Sort descending (most recent milestones first)
    const sorted = [...series.milestones].sort((a, b) => b.level - a.level);

    const isCrypto = series.symbol === 'BTC-USD';
    const prefix = isCrypto ? '$' : '';

    tbody.innerHTML = sorted.map(m => {
        const notable = NOTABLE.has(m.level);
        const noteCell = m.notes
            ? `<td class="td-notes">${m.notes}</td>`
            : `<td class="td-notes"></td>`;
        return `<tr class="${notable ? 'milestone-notable' : ''}">
            <td class="td-level">${prefix}${fmt(m.level)}</td>
            <td class="td-date">${formatDate(m.first_close)}</td>
            <td class="td-price">${prefix}${fmt(m.close_price)}</td>
            ${noteCell}
        </tr>`;
    }).join('');

    loading.style.display   = 'none';
    empty.style.display     = 'none';
    tableWrap.style.display = 'block';
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function loadHistory() {
    try {
        const res = await fetch('/data/milestones.json');
        if (!res.ok) throw new Error(res.status);
        allData = await res.json();

        if (!allData.series || allData.series.length === 0) {
            throw new Error('empty');
        }

        buildTabs(allData.series);
        selectTab(allData.series[0].symbol);

    } catch (e) {
        console.warn('History load failed:', e.message);
        const loading = document.getElementById('history-loading');
        if (loading) {
            loading.innerHTML = `
                <p>Historical data not yet generated.</p>
                <p style="margin-top:8px;font-size:12px;">
                    Run <code>python automation/historical_scanner.py --output path/to/capitalmarketevent.com/data/milestones.json</code>
                </p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', loadHistory);

/**
 * Capital Market Event - History Page
 *
 * Loads data/milestones.json + data/events.json and renders:
 *   1. Approaching milestones leaderboard
 *   2. Asset tab selector
 *   3. Annotated log-scale scatter chart of milestone crossings
 *   4. Milestone table with tier filter
 */

const EVENT_COLORS = {
    crash:       "#ef4444",
    peak:        "#f59e0b",
    fed:         "#8b5cf6",
    composition: "#06b6d4",
    halving:     "#f7931a",
};

const TIER_META = {
    historic: { label: "Historic",  color: "#ffd700" },
    major:    { label: "Major",     color: "#00d4aa" },
    standard: { label: "Standard",  color: "#404040" },
};

const TAB_ORDER = ["DOW","SP","NASDAQ","BTC","ETH","SPY","QQQ","AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA"];

let milestonesData  = null;
let eventsData      = [];
let activeChart     = null;
let activeTierFilter = "all";

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadData() {
    const bust = Math.floor(Date.now() / 3_600_000); // hourly cache bust
    try {
        const [mRes, eRes] = await Promise.all([
            fetch(`/data/milestones.json?t=${bust}`),
            fetch(`/data/events.json?t=${bust}`),
        ]);
        if (mRes.ok) milestonesData = await mRes.json();
        if (eRes.ok) eventsData     = await eRes.json();
    } catch (e) {
        console.warn("History load failed:", e);
    }

    if (!milestonesData) {
        document.getElementById("leaderboard-grid").innerHTML =
            `<p class="history-empty">Data not yet generated.<br>
             Run <code>python automation/historical_scanner.py</code> to populate.</p>`;
        return;
    }

    renderLeaderboard();
    renderTabs();
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function renderLeaderboard() {
    const el = document.getElementById("leaderboard-grid");
    const lb = (milestonesData.leaderboard || []).slice(0, 8);
    if (!lb.length) { el.innerHTML = ""; return; }

    el.innerHTML = lb.map(row => {
        const pct = Math.min(row.proximity_pct, 100);
        const accent = row.color_primary || "#00d4aa";
        return `
        <div class="lb-card">
            <div class="lb-top">
                <span class="lb-key">${row.key}</span>
                <span class="lb-next">${row.next_str}</span>
            </div>
            <div class="lb-bar-track">
                <div class="lb-bar-fill" style="width:${pct}%;background:${accent}"></div>
            </div>
            <div class="lb-pct">${row.proximity_pct.toFixed(1)}%</div>
        </div>`;
    }).join("");
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function renderTabs() {
    const el = document.getElementById("asset-tabs");
    const assets = milestonesData.assets || {};
    const keys = TAB_ORDER.filter(k => assets[k])
        .concat(Object.keys(assets).filter(k => !TAB_ORDER.includes(k)));

    el.innerHTML = keys.map(key => `
        <button class="asset-tab" data-key="${key}"
            style="--tc:${assets[key]?.color_primary || '#00d4aa'}">${key}
        </button>`
    ).join("");

    el.querySelectorAll(".asset-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            el.querySelectorAll(".asset-tab").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTierFilter = "all";
            showAsset(btn.dataset.key);
        });
    });

    if (keys.length) {
        el.querySelector(".asset-tab").classList.add("active");
        showAsset(keys[0]);
    }
}

// ─── Asset panel ─────────────────────────────────────────────────────────────

function showAsset(key) {
    const asset = milestonesData.assets[key];
    if (!asset) return;
    activeTierFilter = "all";

    document.getElementById("milestone-panel").innerHTML = `
        <div class="panel-header">
            <div>
                <div class="panel-name">${asset.name}</div>
                <div class="panel-status">
                    Now: <strong>${fmtValue(asset.current_value, asset)}</strong>
                    &nbsp;→&nbsp;
                    Next: <strong>${asset.next_milestone_str || "—"}</strong>
                    <span class="panel-pct">(${asset.proximity_pct?.toFixed(1) ?? "?"}% there)</span>
                </div>
            </div>
            <div class="tier-filters">
                ${["all","historic","major","standard"].map(t => `
                    <button class="tier-btn${t==="all"?" active":""}" data-tier="${t}">
                        ${t !== "all" ? `<span class="tier-dot" style="background:${TIER_META[t]?.color}"></span>` : ""}
                        ${t === "all" ? "All" : TIER_META[t].label}
                    </button>`).join("")}
            </div>
        </div>
        <div class="chart-wrap"><canvas id="milestone-chart"></canvas></div>
        <div class="table-wrap">
            <table class="milestone-table">
                <thead><tr>
                    <th>Milestone</th><th>Date</th><th>Close</th>
                    <th>Tier</th><th>Notes</th><th></th>
                </tr></thead>
                <tbody id="milestone-tbody"></tbody>
            </table>
        </div>`;

    document.querySelectorAll(".tier-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tier-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTierFilter = btn.dataset.tier;
            renderTable(asset);
            renderChart(asset);
        });
    });

    renderChart(asset);
    renderTable(asset);
}

// ─── Table ────────────────────────────────────────────────────────────────────

function renderTable(asset) {
    const tbody = document.getElementById("milestone-tbody");
    if (!tbody) return;

    const rows = (asset.milestones || [])
        .filter(m => activeTierFilter === "all" || m.tier === activeTierFilter)
        .slice().reverse(); // newest first

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No milestones in this tier yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(m => {
        const tm = TIER_META[m.tier] || TIER_META.standard;
        const action = m.product_exists
            ? `<a href="${m.product_url || '#'}" class="btn btn-small" target="_blank">Shop →</a>`
            : `<span class="tbl-soon">–</span>`;
        return `
        <tr class="tier-${m.tier}">
            <td class="col-m"><span class="m-val">${m.milestone_str}</span></td>
            <td class="col-d">${m.date}</td>
            <td class="col-c">${fmtValue(m.close, asset)}</td>
            <td><span class="tier-badge" style="color:${tm.color};border-color:${tm.color}20">${tm.label}</span></td>
            <td class="col-n">${m.notes || ""}</td>
            <td>${action}</td>
        </tr>`;
    }).join("");
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function renderChart(asset) {
    const canvas = document.getElementById("milestone-chart");
    if (!canvas) return;
    if (activeChart) { activeChart.destroy(); activeChart = null; }

    const milestones = (asset.milestones || [])
        .filter(m => activeTierFilter === "all" || m.tier === activeTierFilter);
    if (!milestones.length) return;

    const points = milestones.map(m => ({ x: m.date, y: m.milestone }));
    const colors = milestones.map(m =>
        m.tier === "historic" ? "#ffd700" : m.tier === "major" ? "#00d4aa" : "#555"
    );

    // Build event annotation lines
    const minDate = milestones[0].date;
    const maxDate = asset.current_date;
    const annotations = {};
    eventsData.forEach((ev, i) => {
        if (ev.date < minDate || ev.date > maxDate) return;
        annotations[`ev${i}`] = {
            type:        "line",
            xMin:        ev.date,
            xMax:        ev.date,
            borderColor: EVENT_COLORS[ev.type] || "#666",
            borderWidth: 1,
            borderDash:  [3, 4],
            label: {
                display:         true,
                content:         ev.label,
                position:        "start",
                yAdjust:         -6,
                color:           EVENT_COLORS[ev.type] || "#888",
                font:            { size: 9, family: "monospace" },
                backgroundColor: "rgba(10,10,10,0.75)",
                padding:         { x: 3, y: 2 },
            },
        };
    });

    activeChart = new Chart(canvas, {
        type: "scatter",
        data: {
            datasets: [{
                data:                 points,
                pointRadius:          5,
                pointHoverRadius:     8,
                pointBackgroundColor: colors,
                pointBorderColor:     colors,
                pointBorderWidth:     1,
                showLine:             false,
            }],
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            animation:           { duration: 300 },
            scales: {
                x: {
                    type:  "time",
                    time:  { unit: "year", tooltipFormat: "yyyy-MM-dd" },
                    grid:  { color: "rgba(255,255,255,0.04)" },
                    ticks: { color: "#666", font: { size: 11 } },
                },
                y: {
                    type:  "logarithmic",
                    grid:  { color: "rgba(255,255,255,0.04)" },
                    ticks: {
                        color: "#666",
                        font:  { size: 11 },
                        callback: v => fmtShort(v, asset),
                    },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const m = milestones.find(
                                m2 => m2.date === ctx.raw.x && m2.milestone === ctx.raw.y
                            );
                            return m ? `${m.milestone_str}  ·  ${m.date}` : "";
                        },
                        afterLabel: ctx => {
                            const m = milestones.find(
                                m2 => m2.date === ctx.raw.x && m2.milestone === ctx.raw.y
                            );
                            return m?.notes ? m.notes : "";
                        },
                    },
                    backgroundColor: "rgba(10,10,10,0.92)",
                    titleColor:      "#00d4aa",
                    bodyColor:       "#ccc",
                    padding:         10,
                },
                annotation: { annotations },
            },
        },
    });
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtValue(v, asset) {
    if (v == null) return "—";
    if (asset?.use_market_cap) {
        if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`;
        if (v >= 1e9)  return `$${(v/1e9).toFixed(1)}B`;
        return `$${v.toLocaleString()}`;
    }
    const p = asset?.currency_prefix || "";
    return p + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtShort(v, asset) {
    if (asset?.use_market_cap) {
        if (v >= 1e12) return `$${v/1e12}T`;
        if (v >= 1e9)  return `$${(v/1e9).toFixed(0)}B`;
    }
    const p = asset?.currency_prefix || "";
    if (v >= 1e6)  return `${p}${(v/1e6).toFixed(1)}M`;
    if (v >= 1e3)  return `${p}${(v/1e3).toFixed(0)}K`;
    return `${p}${v}`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", loadData);

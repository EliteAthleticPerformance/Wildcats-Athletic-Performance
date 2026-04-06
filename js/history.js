document.addEventListener("DOMContentLoaded", () => {

/* =====================
   CONFIG
===================== */

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";
const STORAGE_KEY = "wildcatsData";

const input = document.getElementById("searchAthlete");
const container = document.getElementById("historyContainer");

/* =====================
   HELPERS
===================== */

function clean(val) {
    if (val === undefined || val === null || val === "" || val === "NaN") {
        return "-";
    }
    return String(val).trim();
}

function toNumber(val) {
    const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
    return isNaN(num) ? 0 : num;
}

function formatDate(val) {
    if (!val || val === "-") return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
}

function normalize(str) {
    return (str || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}

/* =====================
   CSV PARSER (ROBUST)
===================== */

function parseCSV(text) {
    return text.trim().split(/\r?\n/).map(row => {
        const cols = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"' && row[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                cols.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        cols.push(current);
        return cols;
    });
}

/* =====================
   LOAD DATA (WITH CACHE)
===================== */

function loadData() {
    fetch(SHEET_URL + "?t=" + Date.now())
        .then(res => res.text())
        .then(csv => {
            const rows = parseCSV(csv);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
            processData(rows);
        })
        .catch(() => {
            const cached = localStorage.getItem(STORAGE_KEY);

            if (cached) {
                processData(JSON.parse(cached));
            } else {
                container.innerHTML = "<p>No data available</p>";
            }
        });
}

/* =====================
   PROCESS DATA
===================== */

function processData(rows) {

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const data = dataRows.map(cols => {

        const obj = {};
        headers.forEach((h, i) => {
            obj[h.trim().toLowerCase()] = cols[i];
        });

        return {
            name: clean(obj["student-athlete"]),
            date: clean(obj["test date"]),
            grade: clean(obj["grade"]),
            weight: clean(obj["actual weight"]),
            group: clean(obj["weight group"]),
            total: toNumber(obj["3 lift projected max total"]),
            score: toNumber(obj["total athletic performance points"])
        };

    }).filter(a => a.name !== "-" && a.name !== "");

    setupSearch(data);
}

/* =====================
   SEARCH (DEBOUNCED)
===================== */

function setupSearch(data) {

    let timeout;

    input.addEventListener("input", () => {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            const term = normalize(input.value);
            container.innerHTML = "";

            if (!term) return;

            const matches = data.filter(a =>
                normalize(a.name).includes(term)
            );

            if (!matches.length) {
                container.innerHTML = "<p>No athlete found</p>";
                return;
            }

            render(matches);

        }, 200);
    });
}

/* =====================
   RENDER
===================== */

function render(matches) {

    const grouped = {};

    matches.forEach(a => {
        if (!grouped[a.name]) grouped[a.name] = [];
        grouped[a.name].push(a);
    });

    Object.keys(grouped).forEach(name => {

        const history = grouped[name]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const bestTotal = Math.max(...history.map(a => a.total));
        const bestScore = Math.max(...history.map(a => a.score));

        const chartId = `chart-${name.replace(/[^a-z0-9]/gi, '')}`;

        const rowsHTML = history.map(h => {

            const isTotalPR = h.total === bestTotal;
            const isScorePR = h.score === bestScore;

            return `
                <tr class="${isTotalPR ? "pr-row" : ""}">
                    <td>${h.name}</td>
                    <td>${formatDate(h.date)}</td>
                    <td>${h.grade}</td>
                    <td>${h.weight}</td>
                    <td>${h.group}</td>
                    <td>${h.total || "—"} ${isTotalPR ? "🏆" : ""}</td>
                    <td>${h.score ? Math.round(h.score) : "—"} ${isScorePR ? "🔥" : ""}</td>
                </tr>
            `;
        }).join("");

        const card = document.createElement("div");
        card.className = "history-card";

        card.innerHTML = `
            <h2>${name}</h2>

            <canvas id="${chartId}" height="100"></canvas>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Athlete</th>
                            <th>Date</th>
                            <th>Grade</th>
                            <th>Weight</th>
                            <th>Group</th>
                            <th>Total</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        `;

        container.appendChild(card);

        /* =====================
           CHART (CLEAN LINE)
        ===================== */

        if (typeof Chart !== "undefined") {

            const ctx = document.getElementById(chartId).getContext("2d");

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: history.map(a => formatDate(a.date)).reverse(),
                    datasets: [
                        {
                            label: "Total",
                            data: history.map(a => a.total).reverse(),
                            tension: 0.3
                        },
                        {
                            label: "Score",
                            data: history.map(a => a.score).reverse(),
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: "#fff" }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: "#aaa" }
                        },
                        y: {
                            ticks: { color: "#aaa" },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

    });
}

/* =====================
   INIT
===================== */

loadData();

// Auto refresh every 60s (keeps data fresh)
setInterval(loadData, 60000);

});
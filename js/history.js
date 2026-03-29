document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("searchAthlete");
    const container = document.getElementById("historyContainer");

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

    const STORAGE_KEY = "wildcatsData";

    // =====================
    // CSV PARSER
    // =====================
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

    // =====================
    // PROCESS DATA
    // =====================
    function processData(rows) {

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const data = dataRows.map(cols => {
            const obj = {};
            headers.forEach((h, i) => obj[h.trim().toLowerCase()] = cols[i]);

            return {
                name: (obj["student-athlete"] || "").trim(),
                date: obj["test date"] || "",
                grade: obj["grade"] || "",
                weight: obj["actual weight"] || "",
                group: obj["weight group"] || "",
                total: parseFloat(obj["3 lift projected max total"]) || 0,
                score: parseFloat(obj["total athletic performance points"]) || 0
            };
        }).filter(a => a.name);

        setupSearch(data);
    }

    // =====================
    // FETCH + CACHE
    // =====================
    function loadData() {
        fetch(SHEET_URL)
        .then(res => res.text())
        .then(csv => {

            const rows = parseCSV(csv);

            // save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));

            processData(rows);

        })
        .catch(() => {

            console.warn("Offline mode");

            const cached = localStorage.getItem(STORAGE_KEY);

            if (cached) {
                processData(JSON.parse(cached));
            } else {
                container.innerHTML = "<p>No data available offline</p>";
            }
        });
    }

    loadData();

    // 🔄 AUTO REFRESH (every 60 sec)
    setInterval(loadData, 60000);

    // =====================
    // SEARCH + RENDER
    // =====================
    function setupSearch(data) {

        const clean = str => (str || "")
            .toLowerCase()
            .replace(/[^a-z]/g, "");

        input.addEventListener("input", () => {

            const term = input.value;
            container.innerHTML = "";

            if (!term) return;

            const matches = data.filter(a =>
                clean(a.name).includes(clean(term))
            );

            if (!matches.length) {
                container.innerHTML = "<p>No athlete found</p>";
                return;
            }

            const grouped = {};

            matches.forEach(a => {
                if (!grouped[a.name]) grouped[a.name] = [];
                grouped[a.name].push(a);
            });

            Object.keys(grouped).forEach(name => {

                const athleteHistory = grouped[name]
                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                const bestTotal = Math.max(...athleteHistory.map(a => a.total));
                const bestScore = Math.max(...athleteHistory.map(a => a.score));

                const rowsHTML = athleteHistory.map(h => {

                    const isTotalPR = h.total === bestTotal;
                    const isScorePR = h.score === bestScore;

                    return `
                        <tr class="${isTotalPR ? "pr-row" : ""}">
                            <td>${h.name}</td>
                            <td>${h.date ? new Date(h.date).toLocaleDateString() : "—"}</td>
                            <td>${h.grade || "-"}</td>
                            <td>${h.weight || "-"}</td>
                            <td>${h.group || "-"}</td>
                            <td>${h.total} ${isTotalPR ? "🏆" : ""}</td>
                            <td>${h.score > 0 ? Math.round(h.score) : "—"} ${isScorePR ? "🔥" : ""}</td>
                        </tr>
                    `;
                }).join("");

                const chartId = `chart-${name.replace(/[^a-z]/gi, '')}`;

                const div = document.createElement("div");
                div.className = "history-card";

                div.innerHTML = `
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
                                    <th>3 Lift Total</th>
                                    <th>Overall Athletic Performance Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHTML}
                            </tbody>
                        </table>
                    </div>
                `;

                container.appendChild(div);

                // =====================
                // 📊 BAR GRAPH
                // =====================
                if (typeof Chart !== "undefined") {

                    const ctx = document.getElementById(chartId).getContext("2d");

                    const labels = athleteHistory.map(a =>
                        a.date ? new Date(a.date).toLocaleDateString() : ""
                    ).reverse();

                    const totals = athleteHistory.map(a => a.total).reverse();
                    const scores = athleteHistory.map(a => a.score).reverse();

                    new Chart(ctx, {
                        type: "bar",
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: "3 Lift Total",
                                    data: totals,
                                    backgroundColor: "#0066FF",
                                    borderColor: "#C0C0C0",
                                    borderWidth: 1,
                                    borderRadius: 6
                                },
                                {
                                    label: "Performance Score",
                                    data: scores,
                                    backgroundColor: "rgba(192, 192, 192, 0.85)", // 🥈 silver
                                    borderColor: "#C0C0C0",
                                    borderWidth: 1,
                                    borderRadius: 6
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
                                    ticks: { color: "#fff" }
                                },
                                y: {
                                    ticks: { color: "#fff" },
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }

            });

        });

    }

});
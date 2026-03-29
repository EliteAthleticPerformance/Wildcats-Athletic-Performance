document.addEventListener("DOMContentLoaded", () => {

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";
    const STORAGE_KEY = "wildcatsData";

    const searchInput = document.getElementById("leaderboardSearch");
const formatScore = (val) => {
    if (!val || val === 0) return "-";
    return Math.round(val);
};


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

    function toNumber(val) {
        if (!val) return 0;
        const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
        return isNaN(num) ? 0 : num;
    }

    // =====================
    // LOAD DATA
    // =====================
    function loadData() {
        fetch(SHEET_URL)
            .then(res => res.text())
            .then(csv => {
                const rows = parseCSV(csv);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
                processData(rows);
            })
            .catch(() => {
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) processData(JSON.parse(cached));
            });
    }

    loadData();

    // =====================
    // PROCESS DATA
    // =====================
    function processData(rows) {

        const dataRows = rows.slice(1);

        const raw = dataRows.map(row => {

            const bench = toNumber(row[6]);
            const squat = toNumber(row[9]);
            const clean = toNumber(row[12]);

            return {
                name: row[0]?.trim(),
                date: row[1] || "",
                total: bench + squat + clean,
                score: toNumber(row[30])
            };

        }).filter(a => a.name && a.name !== "Student-Athlete");

        const data = raw;

        renderTables(data);

        // SEARCH
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const term = searchInput.value.toLowerCase();

                const filtered = data.filter(a =>
                    a.name.toLowerCase().includes(term)
                );

                renderTables(filtered);
            });
        }
    }

    // =====================
    // RENDER TABLES
    // =====================
    function renderTables(data) {

        const totalTable = document.querySelector("#totalTable tbody");
        const scoreTable = document.querySelector("#leaderboardTable tbody");

        if (!totalTable || !scoreTable) return;

        totalTable.innerHTML = "";
        scoreTable.innerHTML = "";

        const topTotals = [...data]
            .sort((a, b) => b.total - a.total)
            

        const topScores = [...data]
            .sort((a, b) => b.score - a.score)
            

        // TOTAL TABLE
        topTotals.forEach((athlete, index) => {
            totalTable.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <a href="athlete.html?name=${encodeURIComponent(athlete.name)}">
                            ${athlete.name}
                        </a>
                    </td>
                    <td>${athlete.date}</td>
                    <td>${athlete.total > 0 ? Math.round(athlete.total) : "-"}</td>
                </tr>
            `;
        });

        // SCORE TABLE
        topScores.forEach((athlete, index) => {
            scoreTable.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <a href="athlete.html?name=${encodeURIComponent(athlete.name)}">
                            ${athlete.name}
                        </a>
                    </td>
                    <td>${formatScore(athlete.score)}</td>
                </tr>
            `;
        });
    }

});
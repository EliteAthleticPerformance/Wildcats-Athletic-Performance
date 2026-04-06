document.addEventListener("DOMContentLoaded", () => {

/* =====================
   CONFIG
===================== */

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";
const STORAGE_KEY = "wildcatsData";

const searchInput = document.getElementById("leaderboardSearch");

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

function formatScore(val) {
    return val ? Math.round(val) : "-";
}

function formatDate(val) {
    if (!val) return "-";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
}

function getTag(score) {
    if (score >= 900) return ["elite", "🔥 Elite"];
    if (score >= 800) return ["strong", "💪 Strong"];
    if (score >= 700) return ["developing", "⚡ Developing"];
    return ["needs", "📈 Needs Work"];
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
   TIMER (SAFARI SAFE)
===================== */

const startTimes = ["08:00"];

function toSeconds(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60;
}

function getActiveStartTime(currentTime, startTimes) {
    const now = toSeconds(currentTime);
    let active = startTimes[0];

    for (let time of startTimes) {
        if (toSeconds(time) <= now) active = time;
    }
    return active;
}

function getPhase(elapsed) {
    const phases = [
        { name: "Dress Out", duration: 480 },
        { name: "Stretch", duration: 300 },
        { name: "Lift", duration: 600 },
        { name: "Rotate", duration: 600 }
    ];

    let total = 0;

    for (let phase of phases) {
        if (elapsed < total + phase.duration) {
            return {
                name: phase.name,
                timeLeft: (total + phase.duration) - elapsed
            };
        }
        total += phase.duration;
    }

    return { name: "Finished", timeLeft: 0 };
}

function updateCenterClock() {
    const now = new Date();

    const currentTimeStr =
        `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

    const activeStart = getActiveStartTime(currentTimeStr, startTimes);
    const elapsed = toSeconds(currentTimeStr) - toSeconds(activeStart);

    const phase = getPhase(elapsed);

    const minutes = Math.floor(phase.timeLeft / 60);
    const seconds = phase.timeLeft % 60;

    const clock = document.getElementById("centerClock");
    const label = document.getElementById("phaseLabel");

    if (clock) clock.innerText = `${minutes}:${String(seconds).padStart(2, "0")}`;
    if (label) label.innerText = phase.name;
}

/* =====================
   LOAD DATA
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
            if (cached) processData(JSON.parse(cached));
            else console.error("No data available");
        });
}

/* =====================
   PROCESS DATA
===================== */

function processData(rows) {

    const dataRows = rows.slice(1);

    const data = dataRows.map(row => {

        const name = clean(row[0]);
        const date = clean(row[1]);

        const bench = toNumber(row[6]);
        const squat = toNumber(row[9]);
        const cleanLift = toNumber(row[12]);

        const total = bench + squat + cleanLift;
        const score = toNumber(row[30]);

        return { name, date, total, score };

    }).filter(a => a.name !== "-" && a.name !== "Student-Athlete");

    render(data);

    // SEARCH
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const term = searchInput.value.toLowerCase();

            const filtered = data.filter(a =>
                a.name.toLowerCase().includes(term)
            );

            render(filtered);
        });
    }
}

/* =====================
   RENDER
===================== */

function render(data) {

    const totalTable = document.querySelector("#totalTable tbody");
    const scoreTable = document.querySelector("#leaderboardTable tbody");

    const totalCards = document.getElementById("totalCards");
    const scoreCards = document.getElementById("scoreCards");

    const topTotals = [...data].sort((a, b) => b.total - a.total);
    const topScores = [...data].sort((a, b) => b.score - a.score);

    // ===== TABLES =====
    if (totalTable) {
        totalTable.innerHTML = topTotals.map((a, i) => `
            <tr onclick="goToAthlete('${a.name}')">
                <td>${i + 1}</td>
                <td>${a.name}</td>
                <td>${a.total ? Math.round(a.total) : "-"}</td>
                <td>${formatDate(a.date)}</td>
            </tr>
        `).join("");
    }

    if (scoreTable) {
        scoreTable.innerHTML = topScores.map((a, i) => `
            <tr onclick="goToAthlete('${a.name}')">
                <td>${i + 1}</td>
                <td>${a.name}</td>
                <td>${formatScore(a.score)}</td>
                <td>${formatDate(a.date)}</td>
            </tr>
        `).join("");
    }

    // ===== MOBILE CARDS =====
    if (scoreCards) {
        scoreCards.innerHTML = topScores.map((a, i) => {
            const [tagClass, tagText] = getTag(a.score);

            return `
                <div class="card" onclick="goToAthlete('${a.name}')">
                    <div class="card-rank">#${i + 1}</div>
                    <div class="card-name">${a.name}</div>
                    <div class="card-value">${formatScore(a.score)}</div>
                    <div class="tag ${tagClass}">${tagText}</div>
                    <div class="card-date">${formatDate(a.date)}</div>
                </div>
            `;
        }).join("");
    }
}

/* =====================
   NAVIGATION
===================== */

window.goToAthlete = function(name) {
    const encoded = encodeURIComponent(name);
    window.location.href = `athlete.html?name=${encoded}`;
};

/* =====================
   INIT
===================== */

loadData();
updateCenterClock();
setInterval(updateCenterClock, 1000);

});
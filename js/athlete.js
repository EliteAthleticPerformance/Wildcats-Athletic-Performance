document.addEventListener("DOMContentLoaded", () => {

/* =====================
   CONFIG
===================== */

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";
const STORAGE_KEY = "wildcatsData";

const params = new URLSearchParams(window.location.search);
const athleteName = decodeURIComponent(params.get("name") || "");

/* =====================
   HELPERS
===================== */

const clean = v => (v ? String(v).trim() : "-");

const toNumber = val => {
    const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
    return isNaN(num) ? 0 : num;
};

const formatDate = val => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

const normalize = str =>
    (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const clamp = v => Math.max(0, Math.min(100, v));

function getColor(score) {
    if (score >= 90) return "#00E676";
    if (score >= 75) return "#FFD54F";
    return "#FF5252";
}

function set(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (value === null || value === undefined || value === "") {
        el.innerText = "-";
        return;
    }

    el.innerText = value;

    const num = parseFloat(value);
    if (!isNaN(num)) {
        el.style.color = getColor(Math.min(100, num));
    }
}

function getChange(curr, prev) {
    if (prev === undefined || prev === null) return "";
    const diff = curr - prev;
    if (diff > 0) return ` ↑ +${diff}`;
    if (diff < 0) return ` ↓ ${diff}`;
    return "";
}

/* =====================
   CSV PARSER
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
        });
}

/* =====================
   PROCESS DATA
===================== */

function processData(rows) {

    const dataRows = rows.slice(1);

    const idx = {
        name: 0, date: 1, weight: 4,
        benchPts: 8, squatPts: 11, cleanPts: 14,
        verticalPts: 16, broadPts: 18, medballPts: 20,
        agilityPts: 22, situpsPts: 24, tenPts: 26, fortyPts: 28
    };

    const data = dataRows.map(row => ({
        name: clean(row[idx.name]),
        date: clean(row[idx.date]),
        weight: toNumber(row[idx.weight]),

        benchPts: toNumber(row[idx.benchPts]),
        squatPts: toNumber(row[idx.squatPts]),
        cleanPts: toNumber(row[idx.cleanPts]),

        verticalPts: toNumber(row[idx.verticalPts]),
        broadPts: toNumber(row[idx.broadPts]),
        medballPts: toNumber(row[idx.medballPts]),

        agilityPts: toNumber(row[idx.agilityPts]),
        situpsPts: toNumber(row[idx.situpsPts]),
        tenPts: toNumber(row[idx.tenPts]),
        fortyPts: toNumber(row[idx.fortyPts])
    })).filter(a => a.name !== "-");

    render(data);
}

/* =====================
   RENDER
===================== */

function render(data) {

    const athleteData = data.filter(a =>
        normalize(a.name).includes(normalize(athleteName))
    );

    if (!athleteData.length) {
        set("athleteName", "Athlete not found");
        return;
    }

    const sorted = [...athleteData].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const latest = sorted[0];
    const prev = sorted[1];

    const hasData = latest.benchPts || latest.verticalPts;

    /* ===== TEAM DATA ===== */
    const grouped = {};
    data.forEach(a => {
        if (!grouped[a.name]) grouped[a.name] = [];
        grouped[a.name].push(a);
    });

    const latestAll = Object.values(grouped).map(arr =>
        arr.sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
    );

    /* ===== RANK ===== */
    const calcScore = a =>
        (a.verticalPts + a.broadPts + a.medballPts +
         a.agilityPts + a.situpsPts + a.tenPts + a.fortyPts) / 7;

    const sortedScores = [...latestAll]
        .map(calcScore)
        .sort((a,b)=>b-a);

    const myScore = calcScore(latest);

    const rank = sortedScores.indexOf(myScore) + 1;
    const totalAthletes = sortedScores.length;
    const percentile = Math.round((1 - (rank - 1)/totalAthletes)*100);

    /* ===== DISPLAY ===== */

    set("athleteName", latest.name);

    set("bench", `${latest.benchPts}${getChange(latest.benchPts, prev?.benchPts)}`);
    set("squat", `${latest.squatPts}${getChange(latest.squatPts, prev?.squatPts)}`);
    set("clean", `${latest.cleanPts}${getChange(latest.cleanPts, prev?.cleanPts)}`);

    set("verticalScore", `${latest.verticalPts}${getChange(latest.verticalPts, prev?.verticalPts)}`);
    set("broadScore", `${latest.broadPts}${getChange(latest.broadPts, prev?.broadPts)}`);
    set("medballScore", `${latest.medballPts}${getChange(latest.medballPts, prev?.medballPts)}`);

    set("proagility", `${latest.agilityPts}${getChange(latest.agilityPts, prev?.agilityPts)}`);
    set("situps", `${latest.situpsPts}${getChange(latest.situpsPts, prev?.situpsPts)}`);
    set("tenyard", `${latest.tenPts}${getChange(latest.tenPts, prev?.tenPts)}`);
    set("forty", `${latest.fortyPts}${getChange(latest.fortyPts, prev?.fortyPts)}`);

    set("rank", `#${rank} / ${totalAthletes}`);

    const pEl = document.getElementById("percentile");
    if (pEl) pEl.innerText = `Top ${percentile}%`;

    renderHistoryTable(sorted);
    renderCharts(sorted);
}

/* =====================
   HISTORY TABLE
===================== */

function renderHistoryTable(data) {
    const table = document.querySelector("#historyTable tbody");
    if (!table) return;

    table.innerHTML = data.map(a => `
        <tr>
            <td>${formatDate(a.date)}</td>
            <td>${a.benchPts || "-"}</td>
            <td>${a.squatPts || "-"}</td>
            <td>${a.cleanPts || "-"}</td>
            <td>${Math.round((a.benchPts + a.squatPts + a.cleanPts)/3)}</td>
            <td>${a.verticalPts || "-"}</td>
            <td>${a.broadPts || "-"}</td>
            <td>${a.medballPts || "-"}</td>
            <td>${a.agilityPts || "-"}</td>
            <td>${a.situpsPts || "-"}</td>
            <td>${a.tenPts || "-"}</td>
            <td>${a.fortyPts || "-"}</td>
            <td>${Math.round(
                (a.verticalPts + a.broadPts + a.medballPts +
                 a.agilityPts + a.situpsPts + a.tenPts + a.fortyPts)/7
            )}</td>
        </tr>
    `).join("");
}

/* =====================
   CHARTS
===================== */

function renderCharts(history) {

    if (typeof Chart === "undefined") return;

    const labels = history.map(a => formatDate(a.date)).reverse();

    const strength = history.map(a =>
        (a.benchPts + a.squatPts + a.cleanPts) / 3
    ).reverse();

    const performance = history.map(a =>
        (a.verticalPts + a.broadPts + a.medballPts +
         a.agilityPts + a.situpsPts + a.tenPts + a.fortyPts) / 7
    ).reverse();

    const ctx = document.getElementById("progressChart");

    if (ctx) {
        if (window.chart) window.chart.destroy();

        window.chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "Strength", data: strength },
                    { label: "Performance", data: performance }
                ]
            }
        });
    }
}

/* =====================
   INIT
===================== */

loadData();
setInterval(loadData, 60000);

});
/* ========================================
   🔥 ELITE V3 HISTORY ENGINE
   ======================================== */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

/* ========================================
   STATE
   ======================================== */

let rawData = [];
let processedData = [];

/* ========================================
   INIT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

/* ========================================
   FETCH DATA
   ======================================== */

async function loadData() {
  try {
    const res = await fetch(SHEET_URL + "?t=" + Date.now());
    const text = await res.text();

    rawData = parseCSV(text);
    processedData = processData(rawData);

    setupSearch();

  } catch (err) {
    console.error("History load error:", err);
    showError("Failed to load data");
  }
}

/* ========================================
   CSV PARSER (SAFE)
   ======================================== */

function parseCSV(text) {
  const rows = [];
  let current = "";
  let insideQuotes = false;
  let row = [];

  for (let char of text) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    }
    else if (char === "\n" && !insideQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    }
    else {
      current += char;
    }
  }

  if (current) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

/* ========================================
   DATA PROCESSING
   ======================================== */

function processData(rows) {

  const headers = rows.shift().map(h => h.trim());

  const getIndex = (name) =>
    headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));

  return rows.map(cols => {

    const name = clean(cols[getIndex("student")]);
    if (!name) return null;

    return {
      name,
      date: formatDate(cols[getIndex("date")]),
      grade: clean(cols[getIndex("grade")]),
      weight: clean(cols[getIndex("actual weight")]),
      group: clean(cols[getIndex("weight group")]),

      total: toNumber(cols[getIndex("3 lift")]),
      score: toNumber(cols[getIndex("performance")])
    };

  }).filter(Boolean);
}

/* ========================================
   SEARCH SYSTEM
   ======================================== */

function setupSearch() {

  const input = document.getElementById("searchAthlete");
  if (!input) return;

  let timeout;

  input.addEventListener("input", () => {

    clearTimeout(timeout);

    timeout = setTimeout(() => {

      const term = normalize(input.value);
      if (!term) return clearResults();

      const matches = processedData.filter(a =>
        normalize(a.name).includes(term)
      );

      render(matches);

    }, 200);

  });
}

/* ========================================
   RENDER
   ======================================== */

function render(data) {

  const container = document.getElementById("historyContainer");
  container.innerHTML = "";

  const grouped = groupByName(data);

  Object.keys(grouped).forEach(name => {

    const history = grouped[name]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const bestTotal = Math.max(...history.map(a => a.total));
    const bestScore = Math.max(...history.map(a => a.score));

    const chartId = `chart-${sanitize(name)}`;

    const rowsHTML = history.map(h => {

      const isTotalPR = h.total === bestTotal;
      const isScorePR = h.score === bestScore;

      return `
        <tr class="${isTotalPR ? "pr-row" : ""}">
          <td>${h.name}</td>
          <td>${h.date}</td>
          <td>${h.grade}</td>
          <td>${h.weight}</td>
          <td>${h.group}</td>
          <td>${h.total || "—"} ${isTotalPR ? "🏆" : ""}</td>
          <td>${h.score || "—"} ${isScorePR ? "🔥" : ""}</td>
        </tr>
      `;
    }).join("");

    const card = document.createElement("div");
    card.className = "card history-card";

    card.innerHTML = `
      <h2>${name}</h2>

      <canvas id="${chartId}" height="120"></canvas>

      <div class="table-wrapper">
        <table class="table">
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

    renderChart(chartId, history);
  });
}

/* ========================================
   CHART
   ======================================== */

function renderChart(id, history) {

  if (typeof Chart === "undefined") return;

  const ctx = document.getElementById(id).getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(a => a.date).reverse(),
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
        x: { ticks: { color: "#aaa" } },
        y: { ticks: { color: "#aaa" }, beginAtZero: true }
      }
    }
  });
}

/* ========================================
   UTILITIES
   ======================================== */

function groupByName(data) {
  return data.reduce((acc, a) => {
    if (!acc[a.name]) acc[a.name] = [];
    acc[a.name].push(a);
    return acc;
  }, {});
}

function sanitize(str) {
  return str.replace(/[^a-z0-9]/gi, "");
}

function clean(val) {
  if (!val || val === "NaN") return "";
  return String(val).trim();
}

function toNumber(val) {
  return parseFloat(String(val).replace(/[^0-9.\-]/g, "")) || 0;
}

function formatDate(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  return isNaN(d) ? "-" : `${d.toLocaleDateString()}`;
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function clearResults() {
  const container = document.getElementById("historyContainer");
  container.innerHTML = "";
}

function showError(msg) {
  const container = document.getElementById("historyContainer");
  container.innerHTML = `<p>${msg}</p>`;
}
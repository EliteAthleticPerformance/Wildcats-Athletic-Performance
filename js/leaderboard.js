// ===============================
// CONFIG
// ===============================


// ===============================
// GLOBAL STATE
// ===============================
let grouped = {};
let athletes = [];

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", init);

function init() {
  loadData();
  const search = document.getElementById("leaderboardSearch");
  if (search) search.addEventListener("input", render);
}

// ===============================
// CSV PARSER (SAFE)
// ===============================
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
    return cols.map(c => c.trim());
  });
}

// ===============================
// UTIL
// ===============================
function toNumber(val) {
  const num = parseFloat(String(val || "").replace(/[^0-9.\-]/g, ""));
  return isNaN(num) ? 0 : num;
}

function safe(val) {
  return val && val !== 0 ? val : "-";
}

function medal(i) {
  if (i === 0) return "gold";
  if (i === 1) return "silver";
  if (i === 2) return "bronze";
  return "";
}

// ===============================
// LOAD DATA
// ===============================
async function loadData() {
  try {
    const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

    const res = await fetch(CSV_URL + "&t=" + Date.now());
    const text = await res.text();

    console.log("RAW CSV:", text); // 👈 ADD THIS

    const rows = parseCSV(text);
    processData(rows);

  } catch (err) {
    console.error("LOAD ERROR:", err);
  }
}

// ===============================
// PROCESS DATA
// ===============================
function processData(rows) {

  const headers = rows[0];

  const idx = (name) => headers.findIndex(h => h.includes(name));

  const i = {
    name: idx("Student-Athlete"),
    date: idx("Test Date"),

    bench: idx("Bench Press"),
    squat: idx("Squat"),
    clean: idx("Hang Clean"),

    vertical: idx("Vertical Jump"),
    broad: idx("Broad Jump"),
    med: idx("Med Ball Toss"),

    pro: idx("Pro Agility"),
    ten: idx("10 yd"),
    forty: idx("40 yd"),

    sit: idx("Sit-Ups"),

    score: idx("Total Athletic"),
    lift: idx("3 Lift Projected")
  };

  const parsed = rows.slice(1).map(row => {

    return {
      name: row[i.name],
      dateRaw: row[i.date],
      date: new Date(row[i.date]),

      bench: toNumber(row[i.bench]),
      squat: toNumber(row[i.squat]),
      clean: toNumber(row[i.clean]),

      vertical: toNumber(row[i.vertical]),
      broad: toNumber(row[i.broad]),
      med: toNumber(row[i.med]),

      pro: toNumber(row[i.pro]),
      ten: toNumber(row[i.ten]),
      forty: toNumber(row[i.forty]),

      sit: toNumber(row[i.sit]),

      score: toNumber(row[i.score]),
      lift: toNumber(row[i.lift])
    };

  }).filter(a => a.name && !a.name.includes("{"));

  // GROUP
  grouped = {};

  parsed.forEach(a => {
    if (!grouped[a.name]) grouped[a.name] = [];
    grouped[a.name].push(a);
  });

  // SORT each athlete
  Object.values(grouped).forEach(arr => {
    arr.sort((a, b) => b.date - a.date);
  });

  // TAKE latest
  athletes = Object.keys(grouped).map(name => grouped[name][0]);

  render();
}

// ===============================
// RENDER
// ===============================
function render() {

  const search = document.getElementById("leaderboardSearch")?.value.toLowerCase() || "";

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search)
  );

  renderTable(filtered, "totalTable", "lift");
  renderTable(filtered, "leaderboardTable", "score");
}

// ===============================
// TABLE RENDER
// ===============================
function renderTable(data, tableId, type) {

  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  tbody.innerHTML = "";

  const sorted = [...data].sort((a, b) => b[type] - a[type]);

  sorted.forEach((a, i) => {
    const tr = createRow(a, i, type);
    tbody.appendChild(tr);
  });
}

// ===============================
// CREATE ROW
// ===============================
function createRow(a, index, type) {

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="${medal(index)}">${index + 1}</td>
    <td>${a.name}</td>
    <td>${safe(a[type])}</td>
    <td>${a.dateRaw || "-"}</td>
  `;

  const detail = document.createElement("tr");
  detail.style.display = "none";

  const td = document.createElement("td");
  td.colSpan = 4;
  detail.appendChild(td);

  tr.onclick = () => {

    if (detail.style.display === "table-row") {
      detail.style.display = "none";
      return;
    }

    detail.style.display = "table-row";

    const latest = grouped[a.name][0];
    const prev = grouped[a.name][1];

    const diff = (x, y, reverse = false) => {
      if (!x || !y) return "";
      const d = reverse ? (y - x) : (x - y);

      if (d > 0) return `<span style="color:#4caf50">(+${d.toFixed(1)})</span>`;
      if (d < 0) return `<span style="color:red">(${d.toFixed(1)})</span>`;
      return "";
    };

    td.innerHTML = `
      <div style="padding:10px">

      <strong>🏋️ Strength</strong><br>
      Bench: ${safe(latest.bench)} ${prev ? diff(latest.bench, prev.bench) : ""}<br>
      Squat: ${safe(latest.squat)} ${prev ? diff(latest.squat, prev.squat) : ""}<br>
      Clean: ${safe(latest.clean)} ${prev ? diff(latest.clean, prev.clean) : ""}<br><br>

      <strong>🏃 Performance</strong><br>
      Vertical: ${safe(latest.vertical)} ${prev ? diff(latest.vertical, prev.vertical) : ""}<br>
      Broad: ${safe(latest.broad)} ${prev ? diff(latest.broad, prev.broad) : ""}<br>
      Med Ball: ${safe(latest.med)} ${prev ? diff(latest.med, prev.med) : ""}<br><br>

      <strong>⚡ Speed</strong><br>
      10 yd: ${safe(latest.ten)} ${prev ? diff(latest.ten, prev.ten, true) : ""}<br>
      40 yd: ${safe(latest.forty)} ${prev ? diff(latest.forty, prev.forty, true) : ""}<br>
      Pro Agility: ${safe(latest.pro)} ${prev ? diff(latest.pro, prev.pro, true) : ""}<br><br>

      <strong>💪 Conditioning</strong><br>
      Sit Ups: ${safe(latest.sit)} ${prev ? diff(latest.sit, prev.sit) : ""}

      </div>
    `;
  };

  const frag = document.createDocumentFragment();
  frag.appendChild(tr);
  frag.appendChild(detail);

  return frag;
}
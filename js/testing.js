/* ========================================
   🔥 ELITE V3 TESTING ENGINE
   ======================================== */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

/* ========================================
   HELPERS
   ======================================== */

const format = (val) => {
  if (!val || val === 0) return "-";
  return Math.round(val);
};

const cleanNumber = (val) => {
  if (!val) return 0;
  val = val.replace(/"/g, "").trim();
  if (val === "#DIV/0!" || val === "") return 0;
  return parseFloat(val) || 0;
};

const formatDate = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
};

/* ========================================
   STATE
   ======================================== */

let tableData = [];
let currentSort = { col: null, dir: "asc" };
let currentLetter = "ALL";

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
   INIT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupSearch();
});

/* ========================================
   LOAD DATA
   ======================================== */

async function loadData() {
  try {
    const res = await fetch(CSV_URL + "&t=" + Date.now())
    const text = await res.text();

    const parsed = parseCSV(text);
    const headers = parsed.shift().map(h => h.trim());

    const getIndex = (name) =>
      headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));

    tableData = parsed
      .map(cols => buildAthlete(cols, getIndex))
      .filter(Boolean);

    renderAlphabet();     
    renderTable(tableData);

    // Save for other pages
    localStorage.setItem("athleteScores", JSON.stringify(tableData));

  } catch (err) {
    console.error("Sheet load error:", err);
  }
}

/* ========================================
   BUILD ATHLETE OBJECT
   ======================================== */

function buildAthlete(cols, getIndex) {

  const name = (cols[getIndex("student")] || "").replace(",", ", ");
  if (!name.trim()) return null;

  const weight = cleanNumber(cols[getIndex("actual weight")]);
  const bench = cleanNumber(cols[getIndex("bench")]);
  const squat = cleanNumber(cols[getIndex("squat")]);
  const clean = cleanNumber(cols[getIndex("clean")]);
  const vertical = cleanNumber(cols[getIndex("vertical")]);

  const athlete = {
    name,
    date: formatDate(cols[getIndex("date")]),
    hour: cleanNumber(cols[getIndex("hour")]),
    grade: cleanNumber(cols[getIndex("grade")]),
    weight,
    group: cols[getIndex("weight group")] || "",

    bench,
    squat,
    clean,
    vertical,

    broad: cleanNumber(cols[getIndex("broad")]),
    med: cleanNumber(cols[getIndex("med")]),
    agility: cleanNumber(cols[getIndex("agility")]),
    situps: cleanNumber(cols[getIndex("sit")]),
    ten: cleanNumber(cols[getIndex("10")]),
    forty: cleanNumber(cols[getIndex("40")]),

    score: cleanNumber(cols[getIndex("score")])
  };

  return athlete;
}

/* ========================================
   RENDER TABLE
   ======================================== */

function renderTable(data) {
  const tbody = document.querySelector("#testingTable tbody");
  tbody.innerHTML = "";

  data.forEach(a => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${a.name}</td>
      <td>${a.date}</td>
      <td>${a.hour}</td>
      <td>${a.grade}</td>
      <td>${format(a.weight)}</td>
      <td>${a.group}</td>

      <td>${format(a.bench)}</td>
      <td>${format(a.squat)}</td>
      <td>${format(a.clean)}</td>

      <td>${format(a.vertical)}</td>
      <td>${a.broad || "-"}</td>
      <td>${a.med || "-"}</td>

      <td>${a.agility || "-"}</td>
      <td>${format(a.situps)}</td>
      <td>${a.ten || "-"}</td>
      <td>${a.forty || "-"}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ========================================
   SORTING (UPGRADED)
   ======================================== */

function sortTable(colIndex) {

  const keys = [
    "name","date","hour","grade","weight","group",
    "bench","squat","clean",
    "vertical","broad","med",
    "agility","situps","ten","forty"
  ];

  const key = keys[colIndex];

  const asc = currentSort.col === colIndex
    ? currentSort.dir !== "asc"
    : true;

  tableData.sort((a, b) => {

    let A = a[key];
    let B = b[key];

    if (typeof A === "number" && typeof B === "number") {
      return asc ? A - B : B - A;
    }

    return asc
      ? String(A).localeCompare(String(B))
      : String(B).localeCompare(String(A));
  });

  currentSort = { col: colIndex, dir: asc ? "asc" : "desc" };

  renderTable(tableData);
}

/* ========================================
   SEARCH
   ======================================== */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();

    const filtered = tableData.filter(a =>
      a.name.toLowerCase().includes(term)
    );

    renderTable(filtered);
  });
}

/* ========================================
   A-Z FILTER (NEW)
   ======================================== */

function renderAlphabet() {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const counts = {};

  tableData.forEach(a => {
    const last = (a.name.split(",")[0] || "").trim().toUpperCase()[0];
    counts[last] = (counts[last] || 0) + 1;
  });

  bar.innerHTML = `
    <span class="letter active" onclick="showAll()">ALL (${tableData.length})</span>
  `;

  letters.forEach(letter => {
    const count = counts[letter] || 0;

    bar.innerHTML += `
      <span class="letter" onclick="filterByLetter('${letter}')">
        ${letter}${count ? ` (${count})` : ""}
      </span>
    `;
  });
}

function filterByLetter(letter) {
  currentLetter = letter;
  setActiveLetter(letter);

  const filtered = tableData.filter(a => {
    const last = a.name.split(",")[0].trim().toUpperCase();
    return last.startsWith(letter);
  });

  renderTable(filtered);
}

function showAll() {
  currentLetter = "ALL";
  setActiveLetter("ALL");
  renderTable(tableData);
}

function setActiveLetter(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");
    if (el.textContent.startsWith(letter)) {
      el.classList.add("active");
    }
  });
}
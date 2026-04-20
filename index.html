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

const formatDecimal = (val) => {
  if (!val || val === 0) return "-";
  return Number(val).toFixed(2);
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

function getColumnMax(data, key) {
  const values = data
    .map(a => Number(a[key]))
    .filter(v => !isNaN(v) && v > 0);

  return values.length ? Math.max(...values) : 0;
}

function computeAthletePRs(data) {
  const map = {};

  data.forEach(a => {
    if (!map[a.name]) {
      map[a.name] = {
        bench: 0,
        squat: 0,
        clean: 0,
        vertical: 0,
        broad: 0,
        med: 0,
        agility: Infinity, // lower is better
        situps: 0,
        ten: Infinity,     // lower is better
        forty: Infinity    // lower is better
      };
    }

    const p = map[a.name];

    p.bench = Math.max(p.bench, a.bench);
    p.squat = Math.max(p.squat, a.squat);
    p.clean = Math.max(p.clean, a.clean);
    p.vertical = Math.max(p.vertical, a.vertical);
    p.broad = Math.max(p.broad, a.broad);
    p.med = Math.max(p.med, a.med);
    p.situps = Math.max(p.situps, a.situps);

    // LOWER = BETTER
    if (a.agility > 0) p.agility = Math.min(p.agility, a.agility);
    if (a.ten > 0) p.ten = Math.min(p.ten, a.ten);
    if (a.forty > 0) p.forty = Math.min(p.forty, a.forty);
  });

  return map;
}

/* ========================================
   RENDER TABLE
   ======================================== */

   



function renderTable(data) {
  const isMobile = window.innerWidth <= 768;

   if (isMobile) {
  document.getElementById("testingTable").style.display = "none";
  renderMobileCards(data);
  return;
} else {
  document.getElementById("testingTable").style.display = "table";
  document.getElementById("mobileCards").innerHTML = "";
}

window.addEventListener("resize", () => {
  renderTable(tableData);
});

  const tbody = document.querySelector("#testingTable tbody");
  tbody.innerHTML = "";
  const prMap = computeAthletePRs(data);

  

  data.forEach(a => {
  const tr = document.createElement("tr");

  const prs = prMap[a.name];

    tr.innerHTML = `
  <td>${a.name}</td>
  <td>${a.date}</td>
  <td>${a.hour}</td>
  <td>${a.grade}</td>
  <td>${format(a.weight)}</td>
  <td>${a.group}</td>

  <td class="${a.bench === prs.bench ? 'pr' : ''}">${format(a.bench)}</td>
  <td class="${a.squat === prs.squat ? 'pr' : ''}">${format(a.squat)}</td>
  <td class="${a.clean === prs.clean ? 'pr' : ''}">${format(a.clean)}</td>

  <td class="${a.vertical === prs.vertical ? 'pr' : ''}">${format(a.vertical)}</td>
  <td class="${a.broad === prs.broad ? 'pr' : ''}">${formatDecimal(a.broad)}</td>
  <td class="${a.med === prs.med ? 'pr' : ''}">${formatDecimal(a.med)}</td>

  <td class="${a.agility === prs.agility ? 'pr' : ''}">${formatDecimal(a.agility)}</td>
  <td class="${a.situps === prs.situps ? 'pr' : ''}">${format(a.situps)}</td>
  <td class="${a.ten === prs.ten ? 'pr' : ''}">${formatDecimal(a.ten)}</td>
  <td class="${a.forty === prs.forty ? 'pr' : ''}">${formatDecimal(a.forty)}</td>
`;

    tbody.appendChild(tr);
  });

  
}

function renderMobileCards(data) {
  const container = document.getElementById("mobileCards");
  if (!container) return;

  container.innerHTML = "";

  const prMap = computeAthletePRs(data);

  data.forEach(a => {
    const prs = prMap[a.name];

    const card = document.createElement("div");
    card.className = "athlete-card";

    card.innerHTML = `
      <div class="card-header">
        <div class="name">${a.name}</div>
        <div class="meta">${a.grade} | ${a.group}</div>
      </div>

      <div class="card-grid">
        <div class="${a.bench === prs.bench ? 'pr' : ''}">
          Bench: ${format(a.bench)}
        </div>
        <div class="${a.squat === prs.squat ? 'pr' : ''}">
          Squat: ${format(a.squat)}
        </div>
        <div class="${a.clean === prs.clean ? 'pr' : ''}">
          Clean: ${format(a.clean)}
        </div>

        <div class="${a.vertical === prs.vertical ? 'pr' : ''}">
          Vert: ${format(a.vertical)}
        </div>

        <div class="${a.broad === prs.broad ? 'pr' : ''}">
          Broad: ${formatDecimal(a.broad)}
        </div>

        <div class="${a.med === prs.med ? 'pr' : ''}">
          Med: ${formatDecimal(a.med)}
        </div>

        <div class="${a.agility === prs.agility ? 'pr' : ''}">
          Agility: ${formatDecimal(a.agility)}
        </div>

        <div class="${a.ten === prs.ten ? 'pr' : ''}">
          10 yd: ${formatDecimal(a.ten)}
        </div>

        <div class="${a.forty === prs.forty ? 'pr' : ''}">
          40 yd: ${formatDecimal(a.forty)}
        </div>
      </div>
    `;

    container.appendChild(card);
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
  updateSortIndicators(colIndex, asc);
  renderTable(tableData);
}

function updateSortIndicators(colIndex, asc) {
  const headers = document.querySelectorAll("#testingTable th");

  headers.forEach((th, i) => {
    th.classList.remove("sort-asc", "sort-desc");

    if (i === colIndex) {
      th.classList.add(asc ? "sort-asc" : "sort-desc");
    }
  });
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

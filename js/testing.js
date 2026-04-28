// ========================================
// 🔥 ELITE TESTING ENGINE (FINAL PRODUCTION)
// ========================================

let tableData = [];
let currentLetter = "ALL";
let currentSearch = "";

/* ========================================
   INIT (SYNCED)
======================================== */

(async function initTestingPage() {
  try {
    await window.APP_READY;

    console.log("✅ TESTING INIT START");

    const data = await loadAthleteData();

    if (!data || !data.length) {
      console.warn("⚠️ No data available");
      return;
    }

    tableData = data;

    renderAlphabet();
    renderTable(tableData);

  } catch (err) {
    console.error("❌ Testing init failed:", err);
  }
})();

/* ========================================
   HELPERS
======================================== */

const format = (val) =>
  val === 0 || val ? Math.round(val) : "-";

const formatDecimal = (val) =>
  val === 0 || val ? Number(val).toFixed(2) : "-";

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d) ? date : d.toLocaleDateString();
}

function formatName(name) {
  if (!name.includes(",")) return name;
  const [last, first] = name.split(",");
  return `${first.trim()} ${last.trim()}`;
}

/* ========================================
   FILTER SYSTEM (FIXED)
======================================== */

function applyFilters() {
  let filtered = tableData;

  // LETTER
  if (currentLetter !== "ALL") {
    filtered = filtered.filter(a => {
      const last = (a.name.split(",")[0] || "").trim().toUpperCase();
      return last.startsWith(currentLetter);
    });
  }

  // SEARCH
  if (currentSearch) {
    filtered = filtered.filter(a =>
      (a.name || "").toLowerCase().includes(currentSearch)
    );
  }

  renderTable(filtered);
}

/* ========================================
   🔥 REQUIRED (FIX FOR YOUR ERROR)
======================================== */

function filterTable() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  currentSearch = input.value.toLowerCase();
  applyFilters();
}

/* ========================================
   PR CALCULATION
======================================== */

function computeAthletePRs(data) {
  const map = {};

  data.forEach(a => {
    if (!map[a.name]) {
      map[a.name] = {
        bench: 0, squat: 0, clean: 0,
        vertical: 0, broad: 0, med: 0,
        agility: Infinity, situps: 0,
        ten: Infinity, forty: Infinity
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

    if (a.agility > 0) p.agility = Math.min(p.agility, a.agility);
    if (a.ten > 0) p.ten = Math.min(p.ten, a.ten);
    if (a.forty > 0) p.forty = Math.min(p.forty, a.forty);
  });

  return map;
}

/* ========================================
   TABLE
======================================== */

function renderTable(data) {

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    document.getElementById("testingTable").style.display = "none";
    renderMobileCards(data);
    return;
  }

  document.getElementById("testingTable").style.display = "table";
  document.getElementById("mobileCards").innerHTML = "";

  const tbody = document.querySelector("#testingTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="16">No data</td></tr>`;
    return;
  }

  const prMap = computeAthletePRs(data);

  data.forEach(a => {

     console.log("GROUP VALUE:", a.group);
     
    const prs = prMap[a.name];

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatName(a.name)}</td>
      <td>${formatDate(a.date)}</td>
      <td>${a.gender || "-"}</td>
      <td>${a.grade || "-"}</td>
      <td>${format(a.weight)}</td>
      <td>${a.group || "-"}</td>

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

/* ========================================
   MOBILE
======================================== */

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
        <div class="name">${formatName(a.name)}</div>
        <div class="meta">${a.grade || "-"} | ${format(a.weight)} lbs</div>
      </div>

      <div class="card-grid">
        <div class="${a.bench === prs.bench ? 'pr' : ''}">Bench: ${format(a.bench)}</div>
        <div class="${a.squat === prs.squat ? 'pr' : ''}">Squat: ${format(a.squat)}</div>
        <div class="${a.clean === prs.clean ? 'pr' : ''}">Clean: ${format(a.clean)}</div>

        <div class="${a.vertical === prs.vertical ? 'pr' : ''}">Vert: ${format(a.vertical)}</div>
        <div class="${a.broad === prs.broad ? 'pr' : ''}">Broad: ${formatDecimal(a.broad)}</div>
        <div class="${a.med === prs.med ? 'pr' : ''}">Med: ${formatDecimal(a.med)}</div>

        <div class="${a.agility === prs.agility ? 'pr' : ''}">Agility: ${formatDecimal(a.agility)}</div>
        <div class="${a.situps === prs.situps ? 'pr' : ''}">Sit-ups: ${format(a.situps)}</div>
        <div class="${a.ten === prs.ten ? 'pr' : ''}">10 yd: ${formatDecimal(a.ten)}</div>
        <div class="${a.forty === prs.forty ? 'pr' : ''}">40 yd: ${formatDecimal(a.forty)}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ========================================
   A-Z
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

  bar.innerHTML = `<span class="letter active" onclick="showAll()">ALL (${tableData.length})</span>`;

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
  applyFilters();
}

function showAll() {
  currentLetter = "ALL";
  setActiveLetter("ALL");
  applyFilters();
}

function setActiveLetter(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");

    if (
      (letter === "ALL" && el.textContent.startsWith("ALL")) ||
      el.textContent.startsWith(letter)
    ) {
      el.classList.add("active");
    }
  });
}

/* ========================================
   🔽 SORTING (TABLE HEADERS)
======================================== */

let currentSortCol = null;
let sortAsc = true;

function sortTable(colIndex) {

  if (!tableData.length) return;

  // toggle direction if same column
  if (currentSortCol === colIndex) {
    sortAsc = !sortAsc;
  } else {
    currentSortCol = colIndex;
    sortAsc = true;
  }

  const keys = [
    "name", "date", "hour", "grade", "weight", "group",
    "bench", "squat", "clean",
    "vertical", "broad", "med",
    "agility", "situps", "ten", "forty"
  ];

  const key = keys[colIndex];
  if (!key) return;

  const sorted = [...tableData].sort((a, b) => {

    let valA = a[key];
    let valB = b[key];

    // normalize
    if (key === "name") {
      valA = (valA || "").toLowerCase();
      valB = (valB || "").toLowerCase();
    } else if (key === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  renderTable(sorted);
}

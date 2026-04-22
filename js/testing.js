/* ========================================
   🔥 ELITE TESTING ENGINE (FINAL PROD)
======================================== */

let tableData = [];
let currentLetter = "ALL";

/* ========================================
   INIT
======================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const data = await loadAthleteData();

    tableData = data;

    renderAlphabet();
    renderTable(tableData);
    setupSearch();

    window.addEventListener("resize", () => renderTable(tableData));

  } catch (err) {
    console.error("❌ Load error:", err);
  }
}

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
  if (isNaN(d)) return date;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
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
   TABLE RENDER
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
  tbody.innerHTML = "";

  const prMap = computeAthletePRs(data);

  data.forEach(a => {
    const prs = prMap[a.name];
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${a.name}</td>
      <td>${formatDate(a.date)}</td>
      <td>${a.hour || "-"}</td>
      <td>${a.grade || "-"}</td>
      <td>${format(a.weight)}</td>
      <td>${a.weightClass || "-"}</td>

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
   MOBILE CARDS
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
        <div class="name">${a.name}</div>
        <div class="meta">
          ${a.grade || "-"} | ${format(a.weight)} lbs
        </div>
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
   A-Z FILTER
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

    if (
      (letter === "ALL" && el.textContent.startsWith("ALL")) ||
      el.textContent.startsWith(letter)
    ) {
      el.classList.add("active");
    }
  });
}

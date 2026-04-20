// ===============================
// GLOBAL STATE
// ===============================
let grouped = {};
let athletes = [];
let podiumBuilt = false;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const data = await loadAthleteData(); // from dataLoader.js

    console.log("🧪 SAMPLE ROW:", data[0]);

    processDataFromJSON(data);

    const search = document.getElementById("leaderboardSearch");
    if (search) search.addEventListener("input", render);

  } catch (err) {
    console.error("❌ Leaderboard init error:", err);
  }
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

function parseDateSafe(val) {
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

// ===============================
// PROCESS DATA (FROM JSON)
// ===============================
function processDataFromJSON(data) {

  const parsed = data.map(row => {

    const bench = toNumber(row.bench);
    const squat = toNumber(row.squat);
    const clean = toNumber(row.clean);

    const score = toNumber(row.score || row.overall);

    return {
      name: row.name,
      dateRaw: row.date,
      date: parseDateSafe(row.date),

      bench,
      squat,
      clean,

      vertical: toNumber(row.vertical),
      broad: toNumber(row.broad),
      med: toNumber(row.med),

      pro: toNumber(row.agility),
      ten: toNumber(row.ten),
      forty: toNumber(row.forty),

      sit: toNumber(row.situps),

      score,
      lift: bench + squat + clean
    };

  }).filter(a => a.name && typeof a.name === "string");

  // GROUP BY ATHLETE
  grouped = {};

  parsed.forEach(a => {
    if (!grouped[a.name]) grouped[a.name] = [];
    grouped[a.name].push(a);
  });

  // SORT each athlete by date (latest first)
  Object.values(grouped).forEach(arr => {
    arr.sort((a, b) => (b.date || 0) - (a.date || 0));
  });

  // TAKE LATEST SNAPSHOT
  athletes = Object.keys(grouped).map(name => grouped[name][0]);

  render();
}

// ===============================
// BUILD LEADERBOARD DATA
// ===============================
function buildLeaderboardData(data) {
  const map = {};

  data.forEach(a => {

    if (!map[a.name]) {
      map[a.name] = {
        name: a.name,
        lift: 0,
        score: 0,
        liftDate: "",
        scoreDate: ""
      };
    }

    const athlete = map[a.name];

    if (a.lift > athlete.lift) {
      athlete.lift = a.lift;
      athlete.liftDate = a.date;
    }

    if (a.score > athlete.score) {
      athlete.score = a.score;
      athlete.scoreDate = a.date;
    }
  });

  return Object.values(map);
}

// ===============================
// RENDER
// ===============================
function render() {

  const search = document.getElementById("leaderboardSearch")?.value.toLowerCase() || "";

  const allTests = Object.values(grouped).flat();
  const leaderboardData = buildLeaderboardData(allTests);

  const filtered = leaderboardData.filter(a =>
    a.name.toLowerCase().includes(search)
  );

  // BUILD PODIUM ONCE
  if (!podiumBuilt) {
    setTimeout(() => {
      renderPodium(leaderboardData);
      podiumBuilt = true;
    }, 50);
  }

  renderTable(filtered, "liftTable", "lift");
  renderTable(filtered, "scoreTable", "score");
}

// ===============================
// TABLE RENDER
// ===============================
function renderTable(data, tableId, type) {

  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  tbody.innerHTML = "";

  const sorted = [...data]
    .filter(a => a[type] > 0)
    .sort((a, b) => b[type] - a[type]);

  sorted.forEach((a, i) => {
    tbody.appendChild(createRow(a, i, type));
  });
}

// ===============================
// PODIUM
// ===============================
function renderPodium(data) {

  const container = document.getElementById("podium");
  if (!container) return;

  const top3 = [...data]
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (top3.length < 3) return;

  const [first, second, third] = top3;

  container.innerHTML = `
    <div class="podium">

      <div class="podium-item second" onclick="goToAthlete('${second.name}')">
        <div class="podium-rank">🥈</div>
        <div class="podium-name">${second.name}</div>
        <div class="podium-score">${Math.round(second.score)}</div>
      </div>

      <div class="podium-item first" onclick="goToAthlete('${first.name}')">
        <div class="podium-rank">🥇</div>
        <div class="podium-name">${first.name}</div>
        <div class="podium-score">${Math.round(first.score)}</div>
      </div>

      <div class="podium-item third" onclick="goToAthlete('${third.name}')">
        <div class="podium-rank">🥉</div>
        <div class="podium-name">${third.name}</div>
        <div class="podium-score">${Math.round(third.score)}</div>
      </div>

    </div>
  `;

  setTimeout(() => {
    container.querySelectorAll(".podium-item").forEach(el => {
      el.classList.add("show");
    });
  }, 100);
}

// ===============================
// ROW CREATION
// ===============================
function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d)) return "-";

  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${year} ${month}`;
}

function getPerformanceTier(score, lift) {

  if (!score || !lift) {
    return { label: "Incomplete", class: "tier-incomplete" };
  }

  const pct = score / lift;

  if (pct >= 0.90) return { label: "Elite", class: "tier-elite" };
  if (pct >= 0.80) return { label: "Above Average", class: "tier-above" };
  if (pct >= 0.70) return { label: "Average", class: "tier-average" };
  return { label: "Needs Work", class: "tier-needs" };
}

function getBadgeHTML(tier) {

  if (!tier || !tier.label) return "";

  const map = {
    "Elite": "elite",
    "Above Average": "above",
    "Average": "average",
    "Needs Work": "needs",
    "Incomplete": "incomplete"
  };

  const cls = map[tier.label] || "";

  return `<span class="badge ${cls}">${tier.label}</span>`;
}

function createRow(a, index, type) {

  const tier = getPerformanceTier(a.score, a.lift);

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="${medal(index)}">${index + 1}</td>
    <td>
      ${a.name}
      ${type === "score" ? `<div style="margin-top:4px;">${getBadgeHTML(tier)}</div>` : ""}
    </td>
    <td>${safe(a[type])}</td>
    <td>${formatDate(type === "lift" ? a.liftDate : a.scoreDate)}</td>
  `;

  const detail = document.createElement("tr");
  detail.style.display = "none";

  const td = document.createElement("td");
  td.colSpan = 4;
  detail.appendChild(td);

  tr.onclick = () => {

    detail.style.display =
      detail.style.display === "table-row" ? "none" : "table-row";

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

// ===============================
// NAVIGATION
// ===============================
function goToAthlete(name) {
  window.location.href = `history.html?name=${encodeURIComponent(name)}`;
}

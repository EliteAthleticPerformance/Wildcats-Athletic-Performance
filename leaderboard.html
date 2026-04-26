// ========================================
// 🔥 ELITE LEADERBOARD (STABLE V1)
// ========================================

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    await window.APP_READY;

    const data = await loadAthleteData();

    console.log("📊 Leaderboard Data:", data);

    if (!data || !data.length) {
      renderEmpty();
      return;
    }

    const latest = getLatestPerAthlete(data);

    renderLeaderboard(latest);

  } catch (err) {
    console.error("❌ Leaderboard init error:", err);
    renderEmpty();
  }
}

/* ========================================
   🧠 GET LATEST TEST PER ATHLETE
======================================== */

function getLatestPerAthlete(data) {
  const map = {};

  data.forEach(row => {
    if (!row.name) return;

    const existing = map[row.name];

    if (!existing || new Date(row.date) > new Date(existing.date)) {
      map[row.name] = row;
    }
  });

  return Object.values(map);
}

/* ========================================
   🏆 MAIN RENDER
======================================== */

function renderLeaderboard(data) {
  renderPodium(data);
  renderLiftTable(data);
  renderScoreTable(data);
  renderMobile(data);
}

/* ========================================
   🥇 PODIUM
======================================== */

function renderPodium(data) {
  const container = document.getElementById("podium");
  if (!container) return;

  const sorted = [...data].sort((a, b) => b.score - a.score).slice(0, 3);

  container.innerHTML = sorted.map((a, i) => `
    <div class="podium-item place-${i + 1}">
      <div class="podium-rank">#${i + 1}</div>
      <div class="podium-name">${a.name}</div>
      <div class="podium-score">${a.score}</div>
    </div>
  `).join("");
}

/* ========================================
   🏋️ LIFT TABLE
======================================== */

function renderLiftTable(data) {
  const tbody = document.querySelector("#liftTable tbody");
  if (!tbody) return;

  const sorted = [...data]
    .map(a => ({
      ...a,
      total: (a.bench || 0) + (a.squat || 0) + (a.clean || 0)
    }))
    .sort((a, b) => b.total - a.total);

  tbody.innerHTML = sorted.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${a.name}</td>
      <td>${a.total}</td>
      <td>${formatDate(a.date)}</td>
    </tr>
  `).join("");
}

/* ========================================
   ⚡ SCORE TABLE
======================================== */

function renderScoreTable(data) {
  const tbody = document.querySelector("#scoreTable tbody");
  if (!tbody) return;

  const sorted = [...data]
    .sort((a, b) => b.score - a.score);

  tbody.innerHTML = sorted.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${a.name}</td>
      <td>${a.score}</td>
      <td>${formatDate(a.date)}</td>
    </tr>
  `).join("");
}

/* ========================================
   📱 MOBILE CARDS
======================================== */

function renderMobile(data) {
  const lift = document.getElementById("mobileLift");
  const score = document.getElementById("mobileScore");

  if (!lift || !score) return;

  const liftSorted = [...data]
    .map(a => ({
      ...a,
      total: (a.bench || 0) + (a.squat || 0) + (a.clean || 0)
    }))
    .sort((a, b) => b.total - a.total);

  const scoreSorted = [...data]
    .sort((a, b) => b.score - a.score);

  lift.innerHTML = liftSorted.map((a, i) => `
    <div class="mobile-card">
      <div>#${i + 1} ${a.name}</div>
      <div>Total: ${a.total}</div>
    </div>
  `).join("");

  score.innerHTML = scoreSorted.map((a, i) => `
    <div class="mobile-card">
      <div>#${i + 1} ${a.name}</div>
      <div>Score: ${a.score}</div>
    </div>
  `).join("");
}

/* ========================================
   🧹 EMPTY STATE
======================================== */

function renderEmpty() {
  const tables = document.querySelectorAll("tbody");
  tables.forEach(t => t.innerHTML = `
    <tr><td colspan="4" style="text-align:center; padding:20px;">
      No data available
    </td></tr>
  `);

  const podium = document.getElementById("podium");
  if (podium) podium.innerHTML = "<p>No data</p>";
}

/* ========================================
   📅 DATE FORMAT
======================================== */

function formatDate(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

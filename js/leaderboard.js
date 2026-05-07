// ===============================
// 🔤 FILTER STATE
// ===============================
let allAthletes = [];
let activeLetter = "ALL";
let searchValue = "";


// ========================================
// 🔥 ELITE LEADERBOARD (V2 - WITH TIERS)
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

// 🔥 SET GLOBAL DATA
allAthletes = latest;

// 🔥 INIT FILTER UI
buildAlphabetFilter(latest);
initSearch();

// 🔥 INITIAL RENDER
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
   🥇 PODIUM (UNCHANGED - WORKING)
======================================== */

function renderPodium(data) {
  const container = document.getElementById("podium");
  if (!container) return;

  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  if (!top3.length) {
    container.innerHTML = "<p style='opacity:0.6;'>No data available</p>";
    return;
  }

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const order = [
    { athlete: second, className: "second", rank: 2 },
    { athlete: first, className: "first", rank: 1 },
    { athlete: third, className: "third", rank: 3 }
  ].filter(item => item.athlete);

  container.innerHTML = order.map(item => {
    const a = item.athlete;

    return `
      <div class="podium-item ${item.className} show"
           onclick="goToAthlete('${encodeURIComponent(a.name)}')">

        <div class="podium-rank">
          ${item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"}
        </div>

        <div class="podium-name">${a.name}</div>

        <div class="podium-score">${a.score}</div>
      </div>
    `;
  }).join("");
}


// ===============================
// 🔤 BUILD ALPHABET BAR
// ===============================
function buildAlphabetFilter(data) {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const counts = {};

  data.forEach(a => {
    if (!a.name) return;
    const letter = a.name.charAt(0).toUpperCase();
    counts[letter] = (counts[letter] || 0) + 1;
  });

  let html = `<span onclick="filterByLetter('ALL')">ALL (${data.length})</span> `;

  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
    if (counts[letter]) {
      html += `<span onclick="filterByLetter('${letter}')">${letter} (${counts[letter]})</span> `;
    } else {
      html += `<span class="disabled">${letter}</span> `;
    }
  });

  bar.innerHTML = html;
}

// ===============================
// 🔎 APPLY FILTERS (COMBINED)
// ===============================
function applyFilters() {
  let filtered = [...allAthletes];

  if (activeLetter !== "ALL") {
    filtered = filtered.filter(a =>
      a.name && a.name.toUpperCase().startsWith(activeLetter)
    );
  }

  if (searchValue) {
    filtered = filtered.filter(a =>
      a.name && a.name.toLowerCase().includes(searchValue)
    );
  }

  renderLeaderboard(filtered);
}

// ===============================
// 🔤 LETTER CLICK
// ===============================
function filterByLetter(letter) {
  activeLetter = letter;
  applyFilters();
}

// ===============================
// 🔎 INIT SEARCH (SAFE)
// ===============================
function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", (e) => {
    searchValue = e.target.value.toLowerCase();
    applyFilters();
  });
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
   ⚡ PERFORMANCE TIERS LOGIC
======================================== */

function getPerformanceTier(score, total) {
  if (!total || total === 0) return "average";

  const ratio = score / total;

  if (ratio >= 1.05) return "elite";
  if (ratio >= 0.95) return "above";
  if (ratio >= 0.85) return "average";
  return "needs";
}

function getTierLabel(tier) {
  if (tier === "elite") return "Elite";
  if (tier === "above") return "Above Avg";
  if (tier === "average") return "Average";
  return "Needs Work";
}

/* ========================================
   ⚡ SCORE TABLE (UPDATED)
======================================== */

function renderScoreTable(data) {
  const tbody = document.querySelector("#scoreTable tbody");
  if (!tbody) return;

  const sorted = [...data].sort((a, b) => b.score - a.score);

  tbody.innerHTML = sorted.map((a, i) => {

    const total =
      (a.bench || 0) +
      (a.squat || 0) +
      (a.clean || 0);

    const tier = getPerformanceTier(a.score, total);

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${a.name}</td>

        <td>
          ${a.score}
          <span class="tier ${tier}">
            ${getTierLabel(tier)}
          </span>
        </td>

        <td>${formatDate(a.date)}</td>
      </tr>
    `;
  }).join("");
}

/* ========================================
   📱 MOBILE (UPDATED WITH TIERS)
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

  score.innerHTML = scoreSorted.map((a, i) => {

    const total =
      (a.bench || 0) +
      (a.squat || 0) +
      (a.clean || 0);

    const tier = getPerformanceTier(a.score, total);

    return `
      <div class="mobile-card">
        <div>#${i + 1} ${a.name}</div>
        <div>
          Score: ${a.score}
          <span class="tier ${tier}">
            ${getTierLabel(tier)}
          </span>
        </div>
      </div>
    `;
  }).join("");
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

/* ========================================
   🔗 NAVIGATION
======================================== */

function goToAthlete(name) {
  const school = sessionStorage.getItem("school") || "pleasanthill";
  window.location.href = `athlete.html?name=${name}&school=${school}`;
}

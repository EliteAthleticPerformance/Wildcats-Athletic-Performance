// ========================================
// 🔥 ATHLETE PROFILE (ELITE VERSION - FINAL)
// ========================================

let DATA = [];
let radarChart = null;
let progressChart = null;

/* ========================================
   INIT
======================================== */

document.addEventListener("headerLoaded", init);

async function init() {
  try {
    await window.APP_READY;

    DATA = await loadAthleteData();

    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");

    if (!name) return showError("No athlete selected");

    renderAthlete(name);

  } catch (err) {
    console.error("❌ Load error:", err);
    showError("Failed to load athlete");
  }
}

/* ========================================
   MAIN RENDER
======================================== */

function renderAthlete(name) {

  const history = DATA
    .filter(a => a.name === name)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!history.length) {
    return showError("No data found for " + name);
  }

  const latest = history[history.length - 1];
  console.log("ATHLETE DATA:", latest);

  // HEADER
  document.getElementById("athleteName").textContent = formatName(name);

  // RANKING
  applyRanking(name, latest.score);

  // STATS
  set("bench", latest.bench);
  set("squat", latest.squat);
  set("clean", latest.clean);

  set("verticalScore", latest.vertical);
  set("broadScore", latest.broad);
  set("medballScore", latest.med);

  set("proagility", latest.agility);
  set("situps", latest.situps);
  set("tenyard", latest.ten);
  set("forty", latest.forty);

  // CHARTS
  renderRadar(latest);
  renderProgress(history);

  // TABLE
  renderTable(history);
}

/* ========================================
   🏆 RANK + PERCENTILE
======================================== */

function applyRanking(name, score) {
  const scores = [...new Set(DATA.map(a => a.name))]
    .map(n => {
      const best = DATA
        .filter(a => a.name === n)
        .reduce((max, a) => Math.max(max, a.score || 0), 0);
      return { name: n, score: best };
    })
    .sort((a, b) => b.score - a.score);

  const index = scores.findIndex(a => a.name === name);

  const rank = index + 1;
  const total = scores.length;

  const percentile = Math.round((1 - rank / total) * 100);

  set("rank", `Rank: #${rank} of ${total}`);
  set("percentile", `Top ${percentile}%`);
}

/* ========================================
   RADAR (CATEGORY SCORES ONLY)
======================================== */

function renderRadar(a) {
  const ctx = document.getElementById("radarChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Strength",
        "Power",
        "Explosive",
        "Speed"
      ],
      datasets: [{
        label: "Category Scores",
        data: [
          a.strengthPoints || 0,
          a.powerPoints || 0,
          a.explosivePoints || 0,
          a.speedPoints || 0
        ],
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font: {
              size: 16 // 🔥 bigger legend text
            }
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100, // ✅ reduced from 120 → 100
          ticks: {
            stepSize: 10,
            backdropColor: "transparent",
            font: {
              size: 14 // 🔥 bigger numbers
            }
          },
          pointLabels: {
            font: {
              size: 16, // 🔥 bigger axis labels
              weight: "bold"
            }
          },
          grid: {
            circular: true
          }
        }
      }
    }
  });
}

/* ========================================
   PROGRESS CHART
======================================== */

function renderProgress(history) {
  const ctx = document.getElementById("progressChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (progressChart) progressChart.destroy();

  progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(a => a.date),
      datasets: [{
        label: "Score",
        data: history.map(a => a.score),
        tension: 0.3
      }]
    }
  });
}

/* ========================================
   TABLE
======================================== */

function renderTable(history) {
  const tbody = document.querySelector("#historyTable tbody");
  if (!tbody) return;

  tbody.innerHTML = history.map(h => `
    <tr>
      <td>${h.date}</td>
      <td>${h.bench}</td>
      <td>${h.squat}</td>
      <td>${h.clean}</td>
      <td>${avg(h.bench, h.squat, h.clean)}</td>
      <td>${h.vertical}</td>
      <td>${h.broad}</td>
      <td>${h.med}</td>
      <td>${h.agility}</td>
      <td>${h.situps}</td>
      <td>${h.ten}</td>
      <td>${h.forty}</td>
      <td>${h.score}</td>
    </tr>
  `).join("");
}

/* ========================================
   HELPERS
======================================== */

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || "-";
}

function avg(a,b,c){
  const vals=[a,b,c].filter(v=>v>0);
  if(!vals.length) return "-";
  return Math.round(vals.reduce((x,y)=>x+y,0)/vals.length);
}

function formatName(name) {
  if (!name.includes(",")) return name;
  const [last, first] = name.split(",");
  return `${first.trim()} ${last.trim()}`;
}

function showError(msg) {
  document.body.innerHTML = `<p style="text-align:center;">${msg}</p>`;
}

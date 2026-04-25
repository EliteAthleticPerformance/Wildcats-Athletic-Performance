// ========================================
// 🔥 ATHLETE PROFILE (FINAL + INSIGHTS)
// ========================================

let DATA = [];
let radarChart = null;
let progressChart = null;
let CURRENT_ATHLETE = null;
let CURRENT_COMPARISON = "none";

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
  CURRENT_ATHLETE = latest;

  // HEADER
  document.getElementById("athleteName").textContent = formatName(name);

  // RANKING
  applyRanking(name, latest.score);

  // STATS
  set("bench", latest.bench);
  set("squat", latest.squat);
  set("clean", latest.clean);

  set("verticalScore", latest.vertical);
  set("broadScore", fmt2(latest.broad));
  set("medballScore", fmt2(latest.med));

  set("proagility", fmt2(latest.agility));
  set("situps", latest.situps);
  set("tenyard", fmt2(latest.ten));
  set("forty", fmt2(latest.forty));

  // CHARTS
  renderRadar(latest, null);
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
   🧠 COMPARISON ENGINE
======================================== */

function getComparisonData(type, athlete) {
  if (!type || type === "none") return null;

  let group = [];

  switch (type) {
    case "top5":
      group = [...DATA].sort((a, b) => b.score - a.score).slice(0, 5);
      break;
    case "team":
      group = DATA;
      break;
    case "weight":
      group = DATA.filter(a => a.weightClass === athlete.weightClass);
      break;
    case "grade":
      group = DATA.filter(a => a.grade === athlete.grade);
      break;
  }

  if (!group.length) return null;

  const avg = (key) =>
    group.reduce((sum, a) => sum + (a[key] || 0), 0) / group.length;

  return {
    strengthPoints: avg("strengthPoints"),
    powerPoints: avg("powerPoints"),
    explosivePoints: avg("explosivePoints"),
    speedPoints: avg("speedPoints")
  };
}

/* ========================================
   🔥 BUTTON HANDLER
======================================== */

function setComparison(type) {
  CURRENT_COMPARISON = type;

  const buttons = document.querySelectorAll("#comparisonButtons button");
  buttons.forEach(btn => btn.classList.remove("active"));

  buttons.forEach(btn => {
    if (btn.textContent.toLowerCase().includes(type === "none" ? "none" : type)) {
      btn.classList.add("active");
    }
  });

  const comparison = getComparisonData(type, CURRENT_ATHLETE);

  renderRadar(CURRENT_ATHLETE, comparison);
}

/* ========================================
   📊 INSIGHTS
======================================== */

function renderInsights(a, c) {
  const container = document.getElementById("comparisonSummary");
  if (!container || !c) {
    if (container) container.innerHTML = "";
    return;
  }

  const diff = (k) => Math.round((a[k] || 0) - (c[k] || 0));

  container.innerHTML = `
    <div style="margin-top:15px; font-size:16px;">
      Strength: ${formatDiff(diff("strengthPoints"))} |
      Power: ${formatDiff(diff("powerPoints"))} |
      Explosive: ${formatDiff(diff("explosivePoints"))} |
      Speed: ${formatDiff(diff("speedPoints"))}
    </div>
  `;
}

function formatDiff(val) {
  if (val > 0) return `<span style="color:#22c55e">+${val}</span>`;
  if (val < 0) return `<span style="color:#ef4444">${val}</span>`;
  return `<span style="color:#aaa">0</span>`;
}

/* ========================================
   RADAR
======================================== */

function renderRadar(a, comparison = null) {
  const ctx = document.getElementById("radarChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (radarChart) radarChart.destroy();

  const labels = ["Strength", "Power", "Explosive", "Speed"];

  const datasets = [
    {
      label: "Athlete",
      data: [
        a.strengthPoints || 0,
        a.powerPoints || 0,
        a.explosivePoints || 0,
        a.speedPoints || 0
      ],
      borderWidth: 2,
      backgroundColor: "rgba(54,162,235,0.3)"
    }
  ];

  if (comparison) {
    datasets.push({
      label: "Comparison",
      data: [
        comparison.strengthPoints,
        comparison.powerPoints,
        comparison.explosivePoints,
        comparison.speedPoints
      ],
      borderWidth: 2,
      borderDash: [6,6],
      backgroundColor: "rgba(255,99,132,0.2)",
      borderColor: "#ff4d6d"
    });
  }

  radarChart = new Chart(ctx, {
    type: "radar",
    data: { labels, datasets },
    options: {
  responsive: true,
  maintainAspectRatio: false, // 🔥 REQUIRED

  plugins: {
    legend: {
      labels: {
        color: "#fff",
        font: { size: 18 } // ⬆️ bigger legend
      }
    }
  },

  scales: {
    r: {
      min: 0,
      max: 100,

      grid: {
        color: "rgba(255,255,255,0.2)" // ⬆️ stronger lines
      },

      angleLines: {
        color: "rgba(255,255,255,0.25)"
      },

      ticks: {
        backdropColor: "transparent",
        color: "#bbb",
        font: { size: 14 } // ⬆️ bigger tick labels
      },

      pointLabels: {
        color: "#fff",
        font: { size: 18, weight: "bold" } // ⬆️ bigger axis labels
      }
    }
  }
}
  });

  renderInsights(a, comparison);
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
      <td>${fmt2(h.broad)}</td>
      <td>${fmt2(h.med)}</td>
      <td>${fmt2(h.agility)}</td>
      <td>${h.situps}</td>
      <td>${fmt2(h.ten)}</td>
      <td>${fmt2(h.forty)}</td>
      <td>${h.score}</td>
    </tr>
  `).join("");
}

/* ========================================
   HELPERS
======================================== */

function fmt2(val) {
  if (!val && val !== 0) return "-";
  return Number(val).toFixed(2);
}

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

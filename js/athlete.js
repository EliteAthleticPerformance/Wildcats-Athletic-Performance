// ========================================
// 🔥 ATHLETE PROFILE (STABLE FINAL)
// ========================================

let DATA = [];
let radarChart = null;
let progressChart = null;
let CURRENT_ATHLETE = null;
let CURRENT_COMPARISON = "none";

let ACTIVE_PROGRESS_KEYS = new Set([
  "strengthPoints",
  "speedPoints",
  "explosivePoints",
  "powerPoints",
  "score"
]);

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

  if (!history.length) return showError("No data found");

  const latest = history[history.length - 1];
  CURRENT_ATHLETE = latest;

  document.getElementById("athleteName").textContent = formatName(name);

  applyRanking(name, latest.score);
  
set("gender", latest.gender);
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

  renderRadar(latest, null);
  renderInsights(latest); // ✅ ADD THIS LINE
  initProgressToggles(history);
  renderProgress(history);

  renderTable(history);
}

/* ========================================
   RANKING
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

  const rank = scores.findIndex(a => a.name === name) + 1;
  const total = scores.length;
  const percentile = Math.round((1 - rank / total) * 100);

  set("rank", `Rank: #${rank} of ${total}`);
  set("percentile", `Top ${percentile}%`);
}

/* ========================================
   COMPARISON BUTTONS
======================================== */

function setComparison(type) {
  if (CURRENT_COMPARISON === type) return;

  CURRENT_COMPARISON = type;

  document.querySelectorAll("#comparisonButtons button")
    .forEach(btn => btn.classList.remove("active"));

  document.querySelector(
    `#comparisonButtons button[data-type="${type}"]`
  )?.classList.add("active");

  const comparison = getComparisonData(type, CURRENT_ATHLETE);
  renderRadar(CURRENT_ATHLETE, comparison);
}

/* ========================================
   COMPARISON DATA
======================================== */

function getComparisonData(type, athlete) {
  if (!type || type === "none") return null;

  let group = [];

  if (type === "top5") group = [...DATA].sort((a,b)=>b.score-a.score).slice(0,5);
  if (type === "team") group = DATA;
  if (type === "weight") group = DATA.filter(a => a.weightClass === athlete.weightClass);
  if (type === "grade") group = DATA.filter(a => a.grade === athlete.grade);

  if (!group.length) return null;

  const avg = k => group.reduce((s,a)=>s+(a[k]||0),0)/group.length;

  return {
    strengthPoints: avg("strengthPoints"),
    powerPoints: avg("powerPoints"),
    explosivePoints: avg("explosivePoints"),
    speedPoints: avg("speedPoints")
  };
}

/* ========================================
   RADAR
======================================== */

function renderRadar(a, comparison=null) {
  console.log("CHART DATA:", a);
  const ctx = document.getElementById("radarChart");
  if (!ctx) return;

  if (radarChart) radarChart.destroy();

  const datasets = [{
    label: "Athlete",
    data: [
      a.strengthPoints,
      a.powerPoints,
      a.explosivePoints,
      a.speedPoints
    ],
    borderWidth: 2,
    backgroundColor: "rgba(54,162,235,0.3)"
  }];

  if (comparison) {
    datasets.push({
      label: "Comparison",
      data: [
        comparison.strengthPoints,
        comparison.powerPoints,
        comparison.explosivePoints,
        comparison.speedPoints
      ],
      borderDash: [6,6],
      borderColor: "#ff4d6d",
      backgroundColor: "rgba(255,99,132,0.2)"
    });
  }

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Strength","Power","Explosive","Speed"],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            color: "#ddd",
            font: {
              size: 14,
              weight: "600"
            }
          }
        }
      },

      scales: {
        r: {
          min: 0,
          max: 100,

          pointLabels: {
            color: "#ffffff",
            font: {
              size: 16,
              weight: "700"
            }
          },

          ticks: {
            color: "#bbb",
            backdropColor: "transparent",
            font: {
              size: 11,
              weight: "600"
            }
          },

          grid: {
            color: "rgba(255,255,255,0.15)"
          },

          angleLines: {
            color: "rgba(255,255,255,0.2)"
          }
        }
      }
    }
  });
}

/* ========================================
   PROGRESS CHART (FIXED)
======================================== */

function renderProgress(history) {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  const sorted = [...history].sort((a,b)=>new Date(a.date)-new Date(b.date));

  const labels = sorted.map(a => a.date);

  const CONFIG = {
    strengthPoints: ["Strength", "#ff4d4d"],
    speedPoints: ["Speed", "#4da6ff"],
    explosivePoints: ["Explosive", "#4dff88"],
    powerPoints: ["Power", "#b366ff"],
    score: ["Overall", "#ffffff"]
  };

  const datasets = Object.keys(CONFIG)
    .filter(k => ACTIVE_PROGRESS_KEYS.has(k))
    .map(k => ({
      label: CONFIG[k][0],
      data: sorted.map(a => a[k]),
      borderColor: CONFIG[k][1],
      tension: 0.3,
      pointRadius: 3
    }));

  // ✅ UPDATE (no flicker)
  if (progressChart) {
    progressChart.data.labels = labels;
    progressChart.data.datasets = datasets;
    progressChart.update();
    return;
  }

  progressChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false
    }
  });
}

/* ========================================
   TOGGLES
======================================== */

function initProgressToggles(history) {
  document.querySelectorAll("#progressToggles button")
    .forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.key;

        if (ACTIVE_PROGRESS_KEYS.has(key)) {
          ACTIVE_PROGRESS_KEYS.delete(key);
          btn.classList.remove("active");
        } else {
          ACTIVE_PROGRESS_KEYS.add(key);
          btn.classList.add("active");
        }

        renderProgress(history);
      };
    });
}

/* ========================================
   TABLE
======================================== */

function renderTable(history) {
  const tbody = document.querySelector("#historyTable tbody");
  if (!tbody) return;

  const sorted = [...history].sort((a,b)=>new Date(a.date)-new Date(b.date));

  tbody.innerHTML = sorted.map(h => `
    <tr>
      <td>${formatDate(h.date)}</td>
      <td>${formatNumber(h.bench)}</td>
      <td>${formatNumber(h.squat)}</td>
      <td>${formatNumber(h.clean)}</td>
      <td>${formatNumber(avg(h.bench,h.squat,h.clean))}</td>
      <td>${formatNumber(h.vertical)}</td>
      <td>${fmt2(h.broad)}</td>
      <td>${fmt2(h.med)}</td>
      <td>${fmt2(h.agility)}</td>
      <td>${formatNumber(h.situps)}</td>
      <td>${fmt2(h.ten)}</td>
      <td>${fmt2(h.forty)}</td>
      <td><strong>${formatNumber(h.score)}</strong></td>
    </tr>
  `).join("");
}

/* ========================================
   🧠 AI INSIGHTS
======================================== */

function renderInsights(a) {
  const container = document.getElementById("insightsGrid");
  if (!container) return;

  const categories = [
    { key: "strengthPoints", label: "Strength", icon: "💪" },
    { key: "powerPoints", label: "Power", icon: "🏋️" },
    { key: "explosivePoints", label: "Explosive", icon: "💥" },
    { key: "speedPoints", label: "Speed", icon: "⚡" }
  ];

  // 🎯 TAG LOGIC
  function getTag(score) {
    if (score >= 85) return { label: "Elite", class: "tag-elite" };
    if (score >= 70) return { label: "Above Avg", class: "tag-good" };
    if (score >= 55) return { label: "Average", class: "tag-mid" };
    return { label: "Needs Work", class: "tag-low" };
  }

  // Sort high → low
  const sorted = [...categories].sort(
    (x, y) => (a[y.key] || 0) - (a[x.key] || 0)
  );

  const strengths = sorted.slice(0, 2);
  const weaknesses = sorted.slice(-2);

  // 🧬 Athlete Type
  let type = "Balanced Athlete 🧠";
  if (sorted[0].key === "speedPoints") type = "Speed-Dominant Athlete ⚡";
  if (sorted[0].key === "strengthPoints") type = "Strength-Dominant Athlete 💪";
  if (sorted[0].key === "powerPoints") type = "Power Athlete 🏋️";
  if (sorted[0].key === "explosivePoints") type = "Explosive Athlete 💥";

  // 📈 Recommendations
  const recommendations = weaknesses.map(w => {
    if (w.key === "strengthPoints") return "💪 Increase max strength (bench/squat focus)";
    if (w.key === "speedPoints") return "⚡ Improve sprint mechanics and acceleration";
    if (w.key === "explosivePoints") return "💥 Focus on plyometrics and jumping";
    if (w.key === "powerPoints") return "🏋️ Develop Olympic lifts and med ball work";
    return "";
  });

  container.innerHTML = `
    <div class="insight-box">
      <h3>🔥 Strengths</h3>
      <ul>
        ${strengths.map(s => {
          const score = a[s.key] || 0;
          const tag = getTag(score);
          return `
            <li class="positive">
              ${s.icon} ${s.label}
              <span class="tag ${tag.class}">${tag.label}</span>
            </li>
          `;
        }).join("")}
      </ul>
    </div>

    <div class="insight-box">
      <h3>⚠️ Needs Work</h3>
      <ul>
        ${weaknesses.map(w => {
          const score = a[w.key] || 0;
          const tag = getTag(score);
          return `
            <li class="negative">
              ${w.icon} ${w.label}
              <span class="tag ${tag.class}">${tag.label}</span>
            </li>
          `;
        }).join("")}
      </ul>
    </div>

    <div class="insight-box">
      <h3>🧬 Athlete Type</h3>
      <p>${type}</p>
    </div>

    <div class="insight-box">
      <h3>📈 Recommendations</h3>
      <ul>
        ${recommendations.map(r => `<li class="neutral">${r}</li>`).join("")}
      </ul>
    </div>
  `;
}

/* ========================================
   HELPERS
======================================== */

function fmt2(v){ return v || v===0 ? Number(v).toFixed(2) : "-"; }
function set(id,v){ document.getElementById(id).textContent = v || "-"; }
function avg(a,b,c){ const v=[a,b,c].filter(x=>x>0); return v.length?Math.round(v.reduce((x,y)=>x+y)/v.length):"-"; }

function formatName(name){
  if (!name.includes(",")) return name;
  const [l,f]=name.split(",");
  return f.trim()+" "+l.trim();
}

function showError(msg){
  document.body.innerHTML = `<p style="text-align:center;">${msg}</p>`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  if (isNaN(d)) return dateStr;

  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatNumber(val) {
  if (val === null || val === undefined) return "-";
  return Number(val).toLocaleString();
}

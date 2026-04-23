// ========================================
// 🔥 ATHLETE PROFILE PAGE (FINAL)
// ========================================

let DATA = [];

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

    if (!name) {
      showError("No athlete selected");
      return;
    }

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
    showError("No data found for " + name);
    return;
  }

  const latest = history[history.length - 1];

  /* ===== HEADER ===== */

  document.getElementById("athleteName").textContent = formatName(name);

  /* ===== STATS ===== */

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

  /* ===== CHARTS ===== */

  renderRadar(latest);
  renderProgress(history);

  /* ===== TABLE ===== */

  renderTable(history);
}

/* ========================================
   RADAR CHART
======================================== */

function renderRadar(a) {
  const ctx = document.getElementById("radarChart");

  if (!ctx || typeof Chart === "undefined") return;

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Bench",
        "Squat",
        "Clean",
        "Vertical",
        "Broad",
        "Med Ball",
        "Agility",
        "Sit-Ups",
        "10yd",
        "40yd"
      ],
      datasets: [{
        label: "Performance",
        data: [
          a.bench,
          a.squat,
          a.clean,
          a.vertical,
          a.broad,
          a.med,
          a.agility,
          a.situps,
          a.ten,
          a.forty
        ]
      }]
    }
  });
}

/* ========================================
   PROGRESS CHART
======================================== */

function renderProgress(history) {
  const ctx = document.getElementById("progressChart");

  if (!ctx || typeof Chart === "undefined") return;

  new Chart(ctx, {
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

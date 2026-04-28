// ========================================
// 🔥 ELITE HISTORY ENGINE (FINAL)
// ========================================

let DATA = [];
let chartInstance = null;

/* ========================================
   INIT (SYNCED WITH APP)
======================================== */

document.addEventListener("headerLoaded", init);

async function init() {
  try {
    await window.APP_READY;

    DATA = await loadAthleteData();

    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");

    if (name) {
      renderAthlete(name);
    } else {
      renderAll();
    }

  } catch (err) {
    console.error("❌ Load error:", err);
    showError("Failed to load data");
  }
}

/* ========================================
   SINGLE ATHLETE
======================================== */

function renderAthlete(name) {

  const container = document.getElementById("historyContainer");
  if (!container) return;

  const history = DATA
    .filter(a => a.name === name)
    .slice() // 🔥 prevent mutation
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!history.length) {
    container.innerHTML = `<p>No data found for ${name}</p>`;
    return;
  }

  const rows = history.map(h => `
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
      <td>${h.10yd}</td>
      <td>${h.40yd}</td>
      <td>${h.score}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="card">
      <h2>${formatName(name)}</h2>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bench</th>
              <th>Squat</th>
              <th>Clean</th>
              <th>Strength Avg</th>
              <th>Vert</th>
              <th>Broad</th>
              <th>Med</th>
              <th>Agility</th>
              <th>Sit</th>
              <th>ten</th>
              <th>forty</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <canvas id="progressChart" height="120"></canvas>
    </div>
  `;

  renderChart("progressChart", history);
}

/* ========================================
   ALL ATHLETES VIEW
======================================== */

function renderAll() {

  const container = document.getElementById("historyContainer");
  if (!container) return;

  const grouped = groupByName(DATA);

  const names = Object.keys(grouped);

  if (!names.length) {
    container.innerHTML = `<p>No athletes found</p>`;
    return;
  }

  container.innerHTML = "";

  names.forEach(name => {
    const history = grouped[name];

    const latest = [...history].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${formatName(name)}</h3>
      <p>Score: ${latest.score}</p>
      <button onclick="goToAthlete('${encodeURIComponent(name)}')">
        View History
      </button>
    `;

    container.appendChild(card);
  });
}

/* ========================================
   CHART (SAFE)
======================================== */

function renderChart(id, history) {

  if (typeof Chart === "undefined") return;

  const ctx = document.getElementById(id);
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy(); // 🔥 prevent stacking
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(a => a.date),
      datasets: [
        {
          label: "Score",
          data: history.map(a => a.score),
          tension: 0.3
        }
      ]
    }
  });
}

/* ========================================
   HELPERS
======================================== */

function avg(a,b,c){
  const vals=[a,b,c].filter(v=>v>0);
  if(!vals.length) return "-";
  return Math.round(vals.reduce((x,y)=>x+y,0)/vals.length);
}

function groupByName(data) {
  return data.reduce((acc, a) => {
    if (!acc[a.name]) acc[a.name] = [];
    acc[a.name].push(a);
    return acc;
  }, {});
}

function formatName(name) {
  if (!name.includes(",")) return name;
  const [last, first] = name.split(",");
  return `${first.trim()} ${last.trim()}`;
}

function goToAthlete(name) {
  const params = new URLSearchParams(window.location.search);
  const school = params.get("school");

  window.location.href = school
    ? `athlete.html?name=${name}&school=${school}`
    : `athlete.html?name=${name}`;
}

function showError(msg) {
  const container = document.getElementById("historyContainer");
  if (container) {
    container.innerHTML = `<p>${msg}</p>`;
  }
}

document.addEventListener("headerLoaded", init);

let DATA = [];

async function init() {
  await window.APP_READY;
  DATA = await loadAthleteData();

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");

  renderAthlete(name);
}

function renderAthlete(name) {

  const history = DATA
    .filter(a => a.name === name)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!history.length) return;

  const latest = history[history.length - 1];

  document.getElementById("athleteName").textContent = name;

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

  renderRadar(latest);
  renderProgress(history);
  renderTable(history);
}

function renderRadar(a) {
  const ctx = document.getElementById("radarChart");

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Strength", "Power", "Explosive", "Speed"],
      datasets: [{
        label: "Athlete",
        data: [
          a.strengthPoints,
          a.powerPoints,
          a.explosivePoints,
          a.speedPoints
        ]
      }]
    }
  });
}

function renderProgress(history) {
  const ctx = document.getElementById("progressChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(a => a.date),
      datasets: [{
        label: "Score",
        data: history.map(a => a.score)
      }]
    }
  });
}

function renderTable(history) {
  const tbody = document.querySelector("#historyTable tbody");

  tbody.innerHTML = history.map(h => `
    <tr>
      <td>${h.date}</td>
      <td>${h.bench}</td>
      <td>${h.squat}</td>
      <td>${h.clean}</td>
      <td>${h.score}</td>
    </tr>
  `).join("");
}

function set(id, val) {
  document.getElementById(id).textContent = val ?? "-";
}

let athletes = [];
let currentLetter = "ALL";

/* ===============================
   INIT (🔥 USE GLOBAL DATA LOADER)
=============================== */
async function initAthletes() {
  const data = await loadAthleteData();

  const map = {};

  data.forEach(row => {
    const name = row.name;
    const score = Number(row.score) || 0;

    if (!name) return;

    // keep highest score per athlete
    if (!map[name] || score > map[name]) {
      map[name] = score;
    }
  });

  athletes = Object.keys(map).map(name => ({
    name,
    score: map[name]
  }));

  athletes.sort((a, b) => b.score - a.score);

  renderAlphabet();
  render(athletes);
}

document.addEventListener("DOMContentLoaded", initAthletes);

/* ===============================
   TAG LOGIC
=============================== */
function getTag(score) {
  score = Number(score);

  if (score >= 800) return ["elite", "🔥 Elite"];
  if (score >= 650) return ["strong", "💪 Strong"];
  if (score >= 500) return ["developing", "⚡ Developing"];
  return ["needs", "📈 Needs Work"];
}

/* ===============================
   RENDER GRID
=============================== */
function render(list) {
  const grid = document.getElementById("athleteGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  list.forEach(a => {
    const [tagClass, tagText] = getTag(a.score);

    const card = document.createElement("div");
    card.className = `card athlete-card ${tagClass}`;

    card.onclick = () => goToAthlete(a.name);

    card.innerHTML =
      "<h3>" + a.name + "</h3>" +
      "<p class='score'>Score: " + a.score + "</p>" +
      "<div class='tag " + tagClass + "'>" + tagText + "</div>";

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

/* ===============================
   A-Z BAR
=============================== */
function renderAlphabet() {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const counts = {};

  athletes.forEach(a => {
    const last = a.name.split(",")[0].trim().toUpperCase()[0];
    counts[last] = (counts[last] || 0) + 1;
  });

  bar.innerHTML =
    `<span class="letter active" onclick="showAll()">ALL (${athletes.length})</span>`;

  letters.forEach(letter => {
    const count = counts[letter] || 0;

    bar.innerHTML +=
      `<span class="letter" onclick="filterByLetter('${letter}')">
        ${letter}${count ? ` (${count})` : ""}
      </span>`;
  });
}

/* ===============================
   FILTERING
=============================== */
function filterByLetter(letter) {
  currentLetter = letter;
  setActiveLetter(letter);

  const filtered = athletes.filter(a => {
    const last = a.name.split(",")[0].trim().toUpperCase();
    return last.startsWith(letter);
  });

  render(filtered);
}

function showAll() {
  currentLetter = "ALL";
  setActiveLetter("ALL");
  render(athletes);
}

/* ===============================
   ACTIVE STATE
=============================== */
function setActiveLetter(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");

    if (el.textContent.startsWith(letter)) {
      el.classList.add("active");
    }
  });
}

/* ===============================
   SEARCH
=============================== */
function filterAthletes() {
  const term = document.getElementById("search").value.toLowerCase();

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(term)
  );

  render(filtered);
}

/* ===============================
   NAVIGATION
=============================== */
function goToAthlete(name) {
  window.location.href = `history.html?name=${encodeURIComponent(name)}`;
}

/* ===============================
   LIVE UPDATE (🔥 REAL-TIME)
=============================== */
window.addEventListener("dataUpdated", () => {
  initAthletes(); // reload + re-render
});

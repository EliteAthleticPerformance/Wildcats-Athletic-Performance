/* ========================================
   🔥 ELITE ATHLETES (API VERSION)
======================================== */

let athletes = [];
let currentLetter = "ALL";

/* ========================================
   INIT
======================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const data = await loadAthleteData();

    console.log("👥 RAW DATA:", data);

    const map = {};

    data.forEach(a => {
      if (!a.name) return;

      const score = Number(a.score) || 0;

      // keep best score per athlete
      if (!map[a.name] || score > map[a.name]) {
        map[a.name] = score;
      }
    });

    athletes = Object.keys(map).map(name => ({
      name,
      score: map[name]
    }));

    athletes.sort((a, b) => b.score - a.score);

    console.log("✅ ATHLETES READY:", athletes);

    renderAlphabet();
    render(athletes);

  } catch (err) {
    console.error("❌ Athlete load failed:", err);
  }
}

/* ========================================
   TAG SYSTEM
======================================== */

function getTag(score) {
  if (score >= 800) return ["elite", "🔥 Elite"];
  if (score >= 650) return ["strong", "💪 Strong"];
  if (score >= 500) return ["developing", "⚡ Developing"];
  return ["needs", "📈 Needs Work"];
}

/* ========================================
   RENDER GRID
======================================== */

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

    card.innerHTML = `
      <h3>${a.name}</h3>
      <p class="score">Score: ${a.score}</p>
      <div class="tag ${tagClass}">${tagText}</div>
    `;

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

/* ========================================
   A-Z FILTER
======================================== */

function renderAlphabet() {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const counts = {};

  athletes.forEach(a => {
    const last = (a.name.split(",")[0] || "").trim().toUpperCase()[0];
    counts[last] = (counts[last] || 0) + 1;
  });

  bar.innerHTML = `
    <span class="letter active" onclick="showAll()">
      ALL (${athletes.length})
    </span>
  `;

  letters.forEach(letter => {
    const count = counts[letter] || 0;

    bar.innerHTML += `
      <span class="letter" onclick="filterByLetter('${letter}')">
        ${letter}${count ? ` (${count})` : ""}
      </span>
    `;
  });
}

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

/* ========================================
   ACTIVE UI
======================================== */

function setActiveLetter(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");

    if (letter === "ALL" && el.textContent.startsWith("ALL")) {
      el.classList.add("active");
    } else if (el.textContent.startsWith(letter)) {
      el.classList.add("active");
    }
  });
}

/* ========================================
   SEARCH
======================================== */

function filterAthletes() {
  const input = document.getElementById("search");
  if (!input) return;

  const term = input.value.toLowerCase();

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(term)
  );

  render(filtered);
}

/* ========================================
   NAV
======================================== */

function goToAthlete(name) {
  const school = new URLSearchParams(window.location.search).get("school");

  const base = window.location.pathname.includes("/Elite-Athletic-Performance/")
    ? "/Elite-Athletic-Performance/"
    : "/";

  window.location.href = school
    ? `${base}history.html?name=${encodeURIComponent(name)}&school=${school}`
    : `${base}history.html?name=${encodeURIComponent(name)}`;
}

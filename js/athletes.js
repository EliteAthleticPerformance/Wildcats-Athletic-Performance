// ========================================
// 🔥 ATHLETES LIST (FINAL - BACKUP UI + NEW ENGINE)
// ========================================

let athletes = [];
let currentLetter = "ALL";

/* ========================================
   INIT (LOCKED TO APP_READY)
======================================== */

document.addEventListener("headerLoaded", async () => {
  try {
    await window.APP_READY;

    const data = await loadAthleteData();

    const map = {};

    data.forEach(a => {
      if (!a.name) return;

      const score = Number(a.score) || 0;

      if (!map[a.name] || score > map[a.name]) {
        map[a.name] = score;
      }
    });

    athletes = Object.keys(map).map(name => ({
      name,
      score: map[name]
    }));

    athletes.sort((a, b) => b.score - a.score);

    renderAlphabet();
    applyFilters();

  } catch (err) {
    console.error("❌ Athlete load failed:", err);
  }
});

/* ========================================
   🔥 TAG SYSTEM (RESTORED)
======================================== */

function getTag(score) {
  if (score >= 800) return ["elite", "🔥 Elite"];
  if (score >= 650) return ["strong", "💪 Strong"];
  if (score >= 500) return ["developing", "⚡ Developing"];
  return ["needs", "📈 Needs Work"];
}

/* ========================================
   FILTER SYSTEM
======================================== */

function applyFilters() {
  const input = document.getElementById("search");
  const term = input ? input.value.toLowerCase().trim() : "";

  let filtered = athletes;

  // LETTER FILTER
  if (currentLetter !== "ALL") {
    filtered = filtered.filter(a => {
      const last = a.name.split(",")[0].trim().toUpperCase();
      return last.startsWith(currentLetter);
    });
  }

  // SEARCH FILTER
  if (term) {
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(term)
    );
  }

  render(filtered);
}

/* ========================================
   RENDER (BACKUP STYLE)
======================================== */

function render(list) {
  const grid = document.getElementById("athleteGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  list.forEach(a => {
    const [tagClass, tagText] = getTag(a.score);

    const card = document.createElement("div");
    card.className = `athlete-card ${tagClass}`;

    card.onclick = () => goToAthlete(a.name);

    card.innerHTML = `
      <div class="athlete-card-inner">
        <h2 class="athlete-name">${formatName(a.name)}</h2>
        <div class="athlete-score">${a.score}</div>
        <div class="athlete-tag ${tagClass}">
          ${tagText}
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

/* ========================================
   🔤 A-Z WITH COUNTS (RESTORED)
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
  setActive(letter);
  applyFilters();
}

function showAll() {
  currentLetter = "ALL";
  setActive("ALL");
  applyFilters();
}

function setActive(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");

    if (
      (letter === "ALL" && el.textContent.startsWith("ALL")) ||
      el.textContent.startsWith(letter)
    ) {
      el.classList.add("active");
    }
  });
}

/* ========================================
   SEARCH
======================================== */

function filterAthletes() {
  applyFilters();
}

/* ========================================
   NAME FORMAT (CLEANER UI)
======================================== */

function formatName(name) {
  if (!name.includes(",")) return name;

  const [last, first] = name.split(",");
  return `${first.trim()} ${last.trim()}`;
}

/* ========================================
   NAV
======================================== */

function goToAthlete(name) {
  const params = new URLSearchParams(window.location.search);
  const school = params.get("school");

  window.location.href = school
    ? `athlete.html?name=${encodeURIComponent(name)}&school=${school}`
    : `athlete.html?name=${encodeURIComponent(name)}`;
}

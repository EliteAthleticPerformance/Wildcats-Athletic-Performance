// ========================================
// 🔥 ATHLETES LIST (FINAL - NO DATA LOSS)
// ========================================

let athletes = [];
let currentLetter = "ALL";

/* ========================================
   INIT
======================================== */

document.addEventListener("headerLoaded", async () => {
  try {
    await window.APP_READY;

    const data = await loadAthleteData();

    // ✅ KEEP ALL ENTRIES (NO COLLAPSING)
    athletes = data.map((a, i) => ({
      id: i, // ensures uniqueness
      name: a.name,
      score: Number(a.score) || 0
    }));

    // ✅ SORT BY SCORE
    athletes.sort((a, b) => b.score - a.score);

    renderAlphabet();
    applyFilters();

  } catch (err) {
    console.error("❌ Athlete load failed:", err);
  }
});

/* ========================================
   TAG SYSTEM
======================================== */

function getTag(score) {
  if (score >= 900) return ["elite", "🔥 Collegiate Ready"];
  if (score >= 700) return ["strong", "💪 Varsity Starter"];
  if (score >= 600) return ["developing", "⚡ Varsity Level"];
   if (score >= 300) return ["developing", "⚡ Sub-Varsity Level"];
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
      const last = getLastName(a.name);
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
   RENDER
======================================== */

function render(list) {
  const grid = document.getElementById("athleteGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `
      <div style="text-align:center; opacity:0.7;">
        No athletes found
      </div>
    `;
    return;
  }

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
   A-Z WITH COUNTS
======================================== */

function renderAlphabet() {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const counts = {};

  athletes.forEach(a => {
    const last = getLastName(a.name)[0];
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
   NAME HELPERS
======================================== */

function getLastName(name) {
  if (name.includes(",")) {
    return name.split(",")[0].trim().toUpperCase();
  }
  return name.split(" ").slice(-1)[0].toUpperCase();
}

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

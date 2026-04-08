

let athletes = [];
let currentLetter = "ALL";

/* ---------- HELPERS ---------- */

function clean(val) {
  if (!val || val === "NaN") return "-";
  return val;
}

function getTag(score) {
  score = Number(score);
  if (score >= 850) return ["elite", "🔥 Elite"];
  if (score >= 700) return ["strong", "💪 Strong"];
  if (score >= 550) return ["developing", "⚡ Developing"];
  return ["needs", "📈 Needs Work"];
}

/* ---------- LOAD DATA ---------- */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

Papa.parse(CSV_URL + "&t=" + Date.now(), {
  download: true,
  header: false,
  skipEmptyLines: true,
  complete: function(results) {

    const data = results.data;
    const map = {};

    data.slice(1).forEach(row => {
      const name = (row[0] || "").replace(/"/g, "").trim();
      const score = Number(row[row.length - 1]);

      if (!name) return;

      if (!map[name] || score > map[name]) {
        map[name] = score;
      }
    });

    athletes = Object.keys(map).map(name => ({
      name,
      score: map[name]
    }));

    athletes.sort((a, b) => b.score - a.score);

    renderAlphabet();   // ✅ FIRST
    render(athletes);   // ✅ SECOND
  }
});

/* ---------- RENDER ---------- */

function render(list) {
  const grid = document.getElementById("athleteGrid");
  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  list.forEach(a => {
    const [tagClass, tagText] = getTag(a.score);

    const card = document.createElement("div");
    card.className = `card ${tagClass}`;
    card.onclick = () => goToAthlete(a.name);

    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${clean(a.name)}</h3>
          <p class="score">Score: ${clean(a.score)}</p>
        </div>
      </div>

      <div class="card-footer">
        <div class="tag ${tagClass}">
          ${tagText}
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

/* ---------- A-Z FILTER ---------- */

function renderAlphabet() {
  const bar = document.getElementById("alphabetBar");
  if (!bar) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const counts = {};

  athletes.forEach(a => {
    const last = (a.name.split(",")[0] || "").trim().toUpperCase()[0];
    if (!counts[last]) counts[last] = 0;
    counts[last]++;
  });

  bar.innerHTML = `
    <span class="letter active" onclick="showAll()">ALL (${athletes.length})</span>
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

/* ---------- ACTIVE LETTER UI ---------- */

function setActiveLetter(letter) {
  document.querySelectorAll(".letter").forEach(el => {
    el.classList.remove("active");
    if (el.textContent.startsWith(letter)) {
      el.classList.add("active");
    }
  });
}

/* ---------- SEARCH ---------- */

function filterAthletes() {
  const term = document.getElementById("search").value.toLowerCase();

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(term)
  );

  render(filtered);
}

/* ---------- NAV ---------- */

function goToAthlete(name) {
  const encoded = encodeURIComponent(name);
  window.location.href = `history.html?name=${encoded}`;
}


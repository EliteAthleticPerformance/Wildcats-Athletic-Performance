// ===============================
// CONFIG
// ===============================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", init);

function init() {
  const params = new URLSearchParams(window.location.search);
  const athleteName = decodeURIComponent(params.get("name") || "");

  document.getElementById("athleteName").textContent = athleteName;

  loadData(athleteName);
}

// ===============================
// LOAD DATA
// ===============================
async function loadData(name) {
  try {
    const res = await fetch(CSV_URL + "&t=" + Date.now());
    const text = await res.text();

    const rows = parseCSV(text);
    processData(rows, name);

  } catch (err) {
    console.error("LOAD ERROR:", err);
  }
}

// ===============================
// CSV PARSER (SAFE)
// ===============================
function parseCSV(text) {
  return text.trim().split(/\r?\n/).map(row => {
    const cols = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    cols.push(current);
    return cols.map(c => c.trim());
  });
}

// ===============================
// UTIL
// ===============================
function toNumber(val) {
  const num = parseFloat(String(val || "").replace(/[^0-9.\-]/g, ""));
  return isNaN(num) ? 0 : num;
}

function safe(val) {
  return (val && val !== "0") ? val : "-";
}

// ===============================
// PROCESS DATA
// ===============================
function processData(rows, athleteName) {

  const headers = rows[0];

  // dynamic column lookup (THIS fixes your issues permanently)
  const idx = (name) => headers.findIndex(h => h.includes(name));

  const i = {
    name: idx("Student-Athlete"),
    date: idx("Test Date"),
    hour: idx("Hour"),
    grade: idx("Grade"),
    weight: idx("Actual Weight"),

    bench: idx("Bench Press"),
    squat: idx("Squat"),
    clean: idx("Hang Clean"),

    vertical: idx("Vertical Jump"),
    broad: idx("Broad Jump"),
    med: idx("Med Ball Toss"),

    pro: idx("Pro Agility"),
    ten: idx("10 yd"),
    forty: idx("40 yd"),

    sit: idx("Sit-Ups"),
    score: idx("Total Athletic")
  };

  const data = rows.slice(1).map(row => {

    return {
      name: row[i.name],
      dateRaw: row[i.date],
      date: new Date(row[i.date]),

      hour: row[i.hour],
      grade: row[i.grade],
      weight: row[i.weight],

      bench: toNumber(row[i.bench]),
      squat: toNumber(row[i.squat]),
      clean: toNumber(row[i.clean]),

      vertical: toNumber(row[i.vertical]),
      broad: toNumber(row[i.broad]),
      med: toNumber(row[i.med]),

      pro: toNumber(row[i.pro]),
      ten: toNumber(row[i.ten]),
      forty: toNumber(row[i.forty]),

      sit: toNumber(row[i.sit]),
      score: toNumber(row[i.score])
    };

  }).filter(a =>
    a.name &&
    a.name.trim() === athleteName
  );

  if (!data.length) {
    document.getElementById("profile").innerHTML = "<p>No data found</p>";
    return;
  }

  // sort newest first
  data.sort((a, b) => b.date - a.date);

  render(data);
}

// ===============================
// RENDER
// ===============================
function render(data) {

  const container = document.getElementById("profile");
  container.innerHTML = "";

  const bestScore = Math.max(...data.map(d => d.score || 0));

  data.forEach((entry, index) => {

    const prev = data[index + 1];

    const diff = (a, b, reverse=false) => {
      if (!a || !b) return "";
      const change = reverse ? (b - a) : (a - b);

      if (change > 0) return `<span style="color:#4caf50">(+${change.toFixed(1)})</span>`;
      if (change < 0) return `<span style="color:red">(${change.toFixed(1)})</span>`;
      return "";
    };

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      ${index === 0 ? "<div style='color:#4caf50'>LATEST TEST</div><br>" : ""}

      <strong>Date:</strong> ${entry.dateRaw}<br>
      <strong>Grade:</strong> ${entry.grade} | Hour: ${entry.hour}<br>
      <strong>Weight:</strong> ${entry.weight}<br><br>

      <strong>🏋️ Strength</strong><br>
      Bench: ${safe(entry.bench)} ${prev ? diff(entry.bench, prev.bench) : ""}<br>
      Squat: ${safe(entry.squat)} ${prev ? diff(entry.squat, prev.squat) : ""}<br>
      Clean: ${safe(entry.clean)} ${prev ? diff(entry.clean, prev.clean) : ""}<br><br>

      <strong>🏃 Performance</strong><br>
      Vertical: ${safe(entry.vertical)} ${prev ? diff(entry.vertical, prev.vertical) : ""}<br>
      Broad: ${safe(entry.broad)} ${prev ? diff(entry.broad, prev.broad) : ""}<br>
      Med Ball: ${safe(entry.med)} ${prev ? diff(entry.med, prev.med) : ""}<br><br>

      <strong>⚡ Speed</strong><br>
      10 yd: ${safe(entry.ten)} ${prev ? diff(entry.ten, prev.ten, true) : ""}<br>
      40 yd: ${safe(entry.forty)} ${prev ? diff(entry.forty, prev.forty, true) : ""}<br>
      Pro Agility: ${safe(entry.pro)} ${prev ? diff(entry.pro, prev.pro, true) : ""}<br><br>

      <strong>💪 Conditioning</strong><br>
      Sit Ups: ${safe(entry.sit)} ${prev ? diff(entry.sit, prev.sit) : ""}<br><br>

      <strong>🏆 Score:</strong> ${entry.score || "-"}
      ${entry.score === bestScore ? "<div style='color:gold;'>BEST SCORE</div>" : ""}
    `;

    container.appendChild(card);
  });
}
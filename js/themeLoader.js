function getSchoolFromURL() {
  const params = new URLSearchParams(window.location.search);
  const urlSchool = params.get("school");

  // If URL has school → store it
  if (urlSchool) {
    sessionStorage.setItem("school", urlSchool);
    return urlSchool;
  }
// ===============================
// UTIL
// ===============================
function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, ""); // 🔥 removes hidden chars
}

function formatSchoolName(name) {
  return (name || "").replace(/\b\w/g, c => c.toUpperCase());
}

async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows.shift().map(h => h.trim());

  return rows
    .filter(r => r.length && r[0])
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (row[i] || "").trim();
      });
      return obj;
    });
}

// ===============================
// LOAD THEME (EVENT-DRIVEN)
// ===============================
async function loadTheme() {
  const school = normalize(decodeURIComponent(getSchoolFromURL()));

  const schoolDBUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=0&single=true&output=csv";
  const themeUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=2096720635&single=true&output=csv";

  const schools = await loadCSV(schoolDBUrl);
  const themes = await loadCSV(themeUrl);

  console.log("Looking for:", school);
console.log("School list:", schools.map(s => normalize(s.school)));

  const schoolRow = schools.find(s => normalize(s.school) === school);
  const themeRow = themes.find(t => normalize(t.school) === school);

  console.log("School:", school);
  console.log("School Row:", schoolRow);
  console.log("Theme Row:", themeRow);

  if (!schoolRow || !themeRow) {
    console.warn("Theme or school not found", {
      requested: school,
      schoolRow,
      themeRow
    });
    return;
  }

  // 🔥 APPLY BRANDING (header already loaded)
  applyBranding(schoolRow, themeRow);
}

// ===============================
// APPLY BRANDING
// ===============================
function applyBranding(school, theme) {

  const root = document.documentElement;

  // 🎨 MATCH CSS VARIABLE NAMES EXACTLY
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primaryLight", theme.primaryLight);
  root.style.setProperty("--primaryDark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondaryLight", theme.secondaryLight);
  root.style.setProperty("--background", theme.background);

  const logo = document.getElementById("schoolLogo");
if (logo && school.logo) {
  logo.src = school.logo;
}

  const titles = document.querySelectorAll(".school-name");
  titles.forEach(el => {
    el.textContent = formatSchoolName(school.name);
  });
}


// ===============================
// EVENT LISTENER (RUN ON HEADER READY)
// ===============================
window.addEventListener("DOMContentLoaded", loadTheme);

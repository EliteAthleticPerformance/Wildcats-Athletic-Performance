function getSchoolFromURL() {
  const params = new URLSearchParams(window.location.search);
  const urlSchool = params.get("school");

  // If URL has school → store it
  if (urlSchool) {
    sessionStorage.setItem("school", urlSchool);
    return urlSchool;
  }

  // Otherwise use stored value
  const storedSchool = sessionStorage.getItem("school");
  if (storedSchool) return storedSchool;

  // Final fallback
  return "harrisonville";
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

let themeLoaded = false;

async function loadTheme() {
  if (themeLoaded) return;
  themeLoaded = true;

  const school = normalize(getSchoolFromURL());

  const schoolDBUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=0&single=true&output=csv";
  const themeUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=2096720635&single=true&output=csv";

  const schools = await loadCSV(schoolDBUrl);
  const themes = await loadCSV(themeUrl);

  const schoolRow = schools.find(s => normalize(s.school) === school);
  const themeRow = themes.find(t => normalize(t.school) === school);

  if (!schoolRow || !themeRow) return;

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

  const podiumTitle = document.getElementById("podiumTitle");

if (podiumTitle && school.name) {
  podiumTitle.textContent = `🏆 ${school.name} Top 3 Athletes`;
}

  const titles = document.querySelectorAll(".school-name");
  titles.forEach(el => {
    el.textContent = formatSchoolName(school.name);
  });
}




// ===============================
// SAFE INIT (handles all cases)
// ===============================
document.addEventListener("headerLoaded", loadTheme);

// Fallback if headerLoaded already fired
setTimeout(loadTheme, 50);

// Also run for pages without header
window.addEventListener("DOMContentLoaded", loadTheme);


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

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-light", theme.primaryLight);
  root.style.setProperty("--primary-dark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--bg", theme.background);

  const logo = document.querySelector(".logo");
  if (logo) logo.src = school.logo;

  const titles = document.querySelectorAll(".school-name");
  titles.forEach(el => {
    el.textContent = formatSchoolName(school.name);
  });
}

// ===============================
// EVENT LISTENER (RUN ON HEADER READY)
// ===============================
document.addEventListener("headerLoaded", loadTheme);

// 🔥 FALLBACK (in case event already fired)
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(loadTheme, 50);
}

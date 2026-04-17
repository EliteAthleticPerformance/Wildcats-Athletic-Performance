```js
// ===============================
// UTIL
// ===============================
function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, "");
}

function formatSchoolName(name) {
  return (name || "").replace(/\b\w/g, c => c.toUpperCase());
}

// ===============================
// WAIT FOR HEADER (FUTURE-PROOF)
// ===============================
function waitForHeaderAndApply(schoolRow, themeRow) {
  const el = document.querySelector(".school-name");

  if (el) {
    applyBranding(schoolRow, themeRow);
  } else {
    setTimeout(() => waitForHeaderAndApply(schoolRow, themeRow), 50);
  }
}

// ===============================
// LOAD THEME
// ===============================
async function loadTheme() {
  const school = normalize(decodeURIComponent(getSchoolFromURL()));

  const schoolDBUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=0&single=true&output=csv";
  const themeUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=2096720635&single=true&output=csv";

  const schools = await loadCSV(schoolDBUrl);
  const themes = await loadCSV(themeUrl);

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

  // 🔥 FUTURE-PROOF APPLICATION
  waitForHeaderAndApply(schoolRow, themeRow);
}

// ===============================
// APPLY BRANDING
// ===============================
function applyBranding(school, theme) {

  const root = document.documentElement;

  // 🔥 CSS VARIABLES
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-light", theme.primaryLight);
  root.style.setProperty("--primary-dark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--bg", theme.background);

  // 🔥 LOGO
  const logo = document.querySelector(".logo");
  if (logo) logo.src = school.logo;

  // 🔥 SCHOOL NAME (ALL INSTANCES)
  const titles = document.querySelectorAll(".school-name");
  titles.forEach(el => {
    el.textContent = formatSchoolName(school.name);
  });
}
```

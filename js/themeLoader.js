function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, "");
}

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

  applyBranding(schoolRow, themeRow);
}

function applyBranding(school, theme) {

  // 🔥 SET CSS VARIABLES
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-light", theme.primaryLight);
  root.style.setProperty("--primary-dark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--bg", theme.background);

  // 🔥 LOGO
  const logo = document.querySelector(".logo");
  if (logo) logo.src = school.logo;

  // 🔥 SCHOOL NAME
  const titles = document.querySelectorAll(".school-name");
  titles.forEach(el => el.textContent = school.name);
}

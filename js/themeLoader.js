// ===============================
// GLOBAL THEME + LOGO + FAVICON
// ===============================

// 🔍 GET SCHOOL
function getSchool() {
  const params = new URLSearchParams(window.location.search);
  let school = params.get("school");

  if (school) {
    sessionStorage.setItem("school", school);
  } else {
    school = sessionStorage.getItem("school");
  }

  return school || "harrisonville";
}

// ===============================
// APPLY CACHED THEME INSTANTLY
// ===============================
(function () {
  const school = getSchool();
  const theme = JSON.parse(sessionStorage.getItem("theme-" + school));

  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primaryLight", theme.primaryLight);
  root.style.setProperty("--primaryDark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondaryLight", theme.secondaryLight);
  root.style.setProperty("--background", theme.background);
})();

// ===============================
// APPLY LOGO + FAVICON (INSTANT)
// ===============================
(function () {
  const school = getSchool();
  const logo = sessionStorage.getItem("logo-" + school);

  if (!logo) return;

  // preload
  const img = new Image();
  img.src = logo;

  document.addEventListener("DOMContentLoaded", () => {

    // 🖼️ LOGO
    const el = document.getElementById("schoolLogo");
    if (el) {
      el.src = logo;
      el.onload = () => el.classList.add("loaded");
    }

    // 🔖 FAVICON
    let favicon = document.getElementById("dynamicFavicon");

    // create if missing
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.id = "dynamicFavicon";
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = logo;
  });
})();

// ===============================
// LOAD DATA FROM GOOGLE SHEETS
// ===============================

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, "");
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
// LOAD THEME FROM SHEET
// ===============================

let themeLoaded = false;

async function loadTheme() {
  if (themeLoaded) return;
  themeLoaded = true;

  const school = normalize(getSchool());

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

  // 🎨 APPLY THEME
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primaryLight", theme.primaryLight);
  root.style.setProperty("--primaryDark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondaryLight", theme.secondaryLight);
  root.style.setProperty("--background", theme.background);

  const schoolKey = normalize(getSchool());

  // cache theme
  sessionStorage.setItem("theme-" + schoolKey, JSON.stringify(theme));

  const logo = document.getElementById("schoolLogo");

  if (school.logo) {
    const versionedLogo = school.logo + "?v=" + Date.now();

    // cache logo
    sessionStorage.setItem("logo-" + schoolKey, versionedLogo);

    if (logo) {
      logo.classList.remove("loaded");

      logo.onload = () => {
        logo.classList.add("loaded");
      };

      logo.src = versionedLogo;
    }

    // 🔖 update favicon
    let favicon = document.getElementById("dynamicFavicon");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.id = "dynamicFavicon";
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = versionedLogo;
  }

  // update school name text
  document.querySelectorAll(".school-name").forEach(el => {
    el.textContent = school.name || "";
  });
}

// ===============================
// INIT
// ===============================
document.addEventListener("headerLoaded", loadTheme);
setTimeout(loadTheme, 50);
window.addEventListener("DOMContentLoaded", loadTheme);

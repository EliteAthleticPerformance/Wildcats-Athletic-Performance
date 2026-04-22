// ===============================
// 🔥 ELITE V4 THEME + DATA ENGINE
// ===============================

/* ========================================
   GET SCHOOL (URL → SESSION → DEFAULT)
======================================== */

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

/* ========================================
   NORMALIZE
======================================== */

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, "");
}

/* ========================================
   SAFE JSON PARSE
======================================== */

function safeJSONParse(val) {
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

/* ========================================
   APPLY CACHED THEME (INSTANT)
======================================== */

(function applyCachedTheme() {
  const school = normalize(getSchool());
  const cached = safeJSONParse(sessionStorage.getItem("theme-" + school));

  if (!cached) return;

  const root = document.documentElement;

  root.style.setProperty("--primary", cached.primary || "#000");
  root.style.setProperty("--primaryLight", cached.primaryLight || "#333");
  root.style.setProperty("--primaryDark", cached.primaryDark || "#000");
  root.style.setProperty("--secondary", cached.secondary || "#666");
  root.style.setProperty("--secondaryLight", cached.secondaryLight || "#999");
  root.style.setProperty("--background", cached.background || "#111");
})();

/* ========================================
   APPLY CACHED LOGO (INSTANT)
======================================== */

(function applyCachedLogo() {
  const school = normalize(getSchool());
  const logo = sessionStorage.getItem("logo-" + school);

  if (!logo) return;

  document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("schoolLogo");
    if (el) {
      el.src = logo;
      el.onload = () => el.classList.add("loaded");
    }

    let favicon = document.getElementById("dynamicFavicon");

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.id = "dynamicFavicon";
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = logo;
  });
})();

/* ========================================
   SIMPLE CSV PARSER
======================================== */

function parseCSV(text) {
  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows.shift().map(h => h.trim());

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] || "").trim();
    });
    return obj;
  });
}

/* ========================================
   LOAD CSV
======================================== */

async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

/* ========================================
   GLOBAL CONFIG CACHE
======================================== */

let SCHOOL_CONFIG = null;

/* ========================================
   LOAD THEME + SCHOOL CONFIG
======================================== */

let loaded = false;

async function loadTheme() {
  if (loaded) return;
  loaded = true;

  try {
    const schoolKey = normalize(getSchool());

    const schoolDBUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=0&single=true&output=csv";

    const themeUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=2096720635&single=true&output=csv";

    const [schools, themes] = await Promise.all([
      loadCSV(schoolDBUrl),
      loadCSV(themeUrl)
    ]);

    const schoolRow = schools.find(s => normalize(s.school) === schoolKey);
    const themeRow = themes.find(t => normalize(t.school) === schoolKey);

    if (!schoolRow) {
      console.warn("❌ School not found:", schoolKey);
      return;
    }

    // 🔥 STORE FULL CONFIG (THIS IS NEW)
    SCHOOL_CONFIG = {
      key: schoolKey,
      name: schoolRow.name || "",
      logo: schoolRow.logo || "",
      dataURL: schoolRow.dataURL || "", // 🔥 THIS DRIVES EVERYTHING
      submitURL: schoolRow.submitURL || "", 
      theme: themeRow || {}
    };

    applyBranding(SCHOOL_CONFIG);

  } catch (err) {
    console.error("❌ Theme load error:", err);
  }
}

/* ========================================
   APPLY BRANDING
======================================== */

function applyBranding(config) {
  const root = document.documentElement;
  const theme = config.theme;

  root.style.setProperty("--primary", theme.primary || "#000");
  root.style.setProperty("--primaryLight", theme.primaryLight || "#333");
  root.style.setProperty("--primaryDark", theme.primaryDark || "#000");
  root.style.setProperty("--secondary", theme.secondary || "#666");
  root.style.setProperty("--secondaryLight", theme.secondaryLight || "#999");
  root.style.setProperty("--background", theme.background || "#111");

  sessionStorage.setItem("theme-" + config.key, JSON.stringify(theme));

  if (config.logo) {
    const versionedLogo = config.logo + "?v=" + Date.now();
    sessionStorage.setItem("logo-" + config.key, versionedLogo);

    const logoEl = document.getElementById("schoolLogo");
    if (logoEl) {
      logoEl.src = versionedLogo;
      logoEl.onload = () => logoEl.classList.add("loaded");
    }

    let favicon = document.getElementById("dynamicFavicon");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.id = "dynamicFavicon";
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = versionedLogo;
  }

  document.querySelectorAll(".school-name").forEach(el => {
    el.textContent = config.name;
  });
}

/* ========================================
   🔥 LOAD ATHLETE DATA (NEW)
======================================== */

async function loadSchoolData() {
  if (!SCHOOL_CONFIG || !SCHOOL_CONFIG.dataURL) {
    console.warn("⚠️ No dataURL for this school");
    return [];
  }

  try {
    const data = await loadCSV(SCHOOL_CONFIG.dataURL);
    return data;
  } catch (err) {
    console.error("❌ Data load failed:", err);
    return [];
  }
}

/* ========================================
   INIT
======================================== */

document.addEventListener("headerLoaded", loadTheme);
window.addEventListener("DOMContentLoaded", loadTheme);
setTimeout(loadTheme, 100);

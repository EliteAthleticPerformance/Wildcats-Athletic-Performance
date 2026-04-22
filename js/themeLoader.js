// ===============================
// 🔥 ELITE V6 THEME + CONFIG ENGINE
// ===============================

window.SCHOOL_CONFIG = null;
let loaded = false;

/* ========================================
   GET SCHOOL
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
   SIMPLE CSV LOADER (kept for config)
======================================== */

async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

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
   LOAD THEME + CONFIG
======================================== */

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
      throw new Error("School not found: " + schoolKey);
    }

    window.SCHOOL_CONFIG = {
      key: schoolKey,
      name: schoolRow.name || "",
      logo: schoolRow.logo || "",
      dataURL: schoolRow.dataURL || "",
      submitURL: schoolRow.submitURL || "",
      theme: themeRow || {}
    };

    console.log("🏫 CONFIG LOADED:", window.SCHOOL_CONFIG);

    applyBranding(window.SCHOOL_CONFIG);

  } catch (err) {
    console.error("❌ Theme load error:", err);

    // 🔥 HARD FAIL UI
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <h2>⚠️ Configuration Error</h2>
        <p>${err.message}</p>
      </div>
    `;
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
    const logo = config.logo + "?v=" + Date.now();

    sessionStorage.setItem("logo-" + config.key, logo);

    const logoEl = document.getElementById("schoolLogo");
    if (logoEl) {
      logoEl.src = logo;
      logoEl.onload = () => logoEl.classList.add("loaded");
    }

    let favicon = document.getElementById("dynamicFavicon");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.id = "dynamicFavicon";
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = logo;
  }

  document.querySelectorAll(".school-name").forEach(el => {
    el.textContent = config.name;
  });
}

/* ========================================
   WAIT FOR CONFIG (FIXED)
======================================== */

async function waitForConfig() {
  let tries = 0;

  while (!window.SCHOOL_CONFIG && tries < 100) {
    await new Promise(r => setTimeout(r, 50));
    tries++;
  }

  if (!window.SCHOOL_CONFIG) {
    throw new Error("Config failed to load");
  }

  return window.SCHOOL_CONFIG;
}

/* ========================================
   INIT (CLEAN)
======================================== */

document.addEventListener("DOMContentLoaded", loadTheme);

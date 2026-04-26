// ========================================
// 🔥 ELITE V11 THEME + CONFIG ENGINE (MULTI-TENANT)
// ========================================

window.SCHOOL_CONFIG = null;

/* ========================================
   🌐 BASE PATH (CRITICAL FIX)
======================================== */

function getBasePath() {
  const path = window.location.pathname;

  if (path.includes("/Elite-Athletic-Performance/")) {
    return "/Elite-Athletic-Performance/";
  }

  return "/";
}

/* ========================================
   🌐 LOAD CONFIG FROM GOOGLE SHEETS
======================================== */

async function loadSchoolConfig(school) {
  const base = getBasePath();

  // 🔥 YOUR CONFIG ENDPOINT (already deployed)
  const CONFIG_URL = "https://script.google.com/macros/s/AKfycbyZPnii9Qf3VdDiTRn1tPt_BOnIv22m2r5n5afnEQ6pNGO2sWO-jQa6MBtJBNfYGyA/exec";

  const res = await fetch(CONFIG_URL + "?t=" + Date.now());
  const list = await res.json();

  if (!Array.isArray(list)) {
    throw new Error("Invalid config response");
  }

  const config = list.find(
  s =>
    String(s.school)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") === school
);

  if (!config) {
    throw new Error("School config not found: " + school);
  }

  return {
  key: config.school,
  name: config.fullName || config.name,

    // 🔥 AUTO HANDLE RELATIVE VS FULL URL
    logo: config.logo?.startsWith("http")
      ? config.logo
      : base + config.logo,

    dataURL: config.dataURL,
    submitURL: config.submitURL
  };
}

/* ========================================
   🌐 GLOBAL APP READY
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {
    const params = new URLSearchParams(window.location.search);

    let school = params.get("school") || sessionStorage.getItem("school");

    if (!school) {
      throw new Error("No school provided");
    }

    // 🔥 NORMALIZE (CRITICAL)
    school = school
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    sessionStorage.setItem("school", school);

    // 🔥 LOAD FROM GOOGLE SHEET
    const config = await loadSchoolConfig(school);

    window.SCHOOL_CONFIG = config;

    console.log("🏫 CONFIG LOADED:", config);

    // ✅ APPLY BASE
    applyBaseTheme(config);

    // ✅ GUARANTEED HEADER SYNC
    await waitForHeader();
    applyHeaderBranding(config);

    resolve(config);

  } catch (err) {
    console.error("❌ CONFIG LOAD FAILED:", err);
    reject(err);
  }
});

/* ========================================
   🎨 BASE THEME
======================================== */

function applyBaseTheme(config) {

  let favicon = document.getElementById("dynamicFavicon");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.id = "dynamicFavicon";
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  // 🔥 CACHE BUST
  favicon.href = config.logo + "?v=" + Date.now();

  sessionStorage.setItem("schoolName", config.name);
  sessionStorage.setItem("schoolLogo", config.logo);
}

/* ========================================
   🧠 WAIT FOR HEADER
======================================== */

function waitForHeader() {
  return new Promise(resolve => {

    let attempts = 0;

    const check = () => {
      const logo = document.getElementById("schoolLogo");

      if (logo) {
        resolve();
      } else if (attempts < 50) {
        attempts++;
        setTimeout(check, 50);
      } else {
        console.warn("⚠️ Header not detected, forcing branding anyway");
        resolve();
      }
    };

    check();
  });
}

/* ========================================
   🏫 APPLY HEADER BRANDING
======================================== */

function applyHeaderBranding(config) {

  const logo = document.getElementById("schoolLogo");
  const name = document.getElementById("schoolName");

  if (logo) {

    const logoURL = config.logo + "?v=" + Date.now();

    logo.src = logoURL;

    logo.onload = () => {
      logo.classList.add("loaded");
    };

    // 🔥 FALLBACK
    logo.onerror = () => {
      console.warn("⚠️ Logo failed to load, using fallback");
      logo.src = getBasePath() + "images/default-logo.png";
      logo.classList.add("loaded");
    };

    if (logo.complete) {
      logo.classList.add("loaded");
    }
  }

  if (name) {
    name.textContent = config.name;
  }

  console.log("🎨 HEADER BRANDING APPLIED");
}

/* ========================================
   🚨 FAIL SAFE
======================================== */

window.APP_READY.catch(() => {
  document.body.innerHTML = `
    <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
      font-family:sans-serif;
      text-align:center;
    ">
      <div>
        <h1>⚠️ System Error</h1>
        <p>Unable to load configuration</p>
      </div>
    </div>
  `;
});

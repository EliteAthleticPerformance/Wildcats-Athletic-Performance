// ========================================
// 🔥 ELITE THEME + CONFIG ENGINE (DYNAMIC)
// ========================================

window.SCHOOL_CONFIG = null;

/* ========================================
   🌐 BASE PATH
======================================== */

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes("/Elite-Athletic-Performance/")) {
    return "/Elite-Athletic-Performance/";
  }
  return "/";
}

/* ========================================
   🔥 CONFIG MAP (ADD NEW SCHOOLS HERE ONLY)
======================================== */

const CONFIG_MAP = (() => {
  const base = getBasePath();

  return {
    
    harrisonville: {
      key: "harrisonville",
      name: "Harrisonville Wildcats",
      logo: base + "images/wildcats-logo.png",
       theme: {
        primary: "#1e3a8a",
        primaryLight: "#3b82f6",
        primaryDark: "#1e40af",
        secondary: "#60a5fa",
        secondaryLight: "#93c5fd"
      }
    },
     
     cassmidway: {
      key: "cassmidway",
      name: "Cass Midway Vikings",
      logo: base + "images/vikings-logo.png",
       theme: {
        primary: "#4B0082",
        primaryLight: "#6A1BB9",
        primaryDark: "#2E0054",
        secondary: "#C0C0C0",
        secondaryLight: "#E6E6E6"
      }
    },
     
     pleasanthill: {
      key: "pleasanthill",
      name: "Pleasant Hill Roosters",
      logo: base + "images/roosters-logo.png",
       theme: {
        primary: "#5a2ca0",
        primaryLight: "#8b5cf6",
        primaryDark: "#3b1a6e",
        secondary: "#a78bfa",
        secondaryLight: "#c4b5fd"
      }
    },

     raypec: {
      key: "raypec",
      name: "Ray-Pec Panthers",
      logo: base + "images/panthers-logo.png",
       theme: {
        primary: "#C9A646",
        primaryLight: "#E2C46A",
        primaryDark: "#8A6E2F",
        secondary: "#0A0A0A",
        secondaryLight: "#2E2E2E"
      }
    },


springhill: {
      key: "springhill",
      name: "Spring Hill Broncos",
      logo: base + "images/broncos-logo.png", 
       theme: {
        primary: "#5A2D91",
        primaryLight: "#6A3FB0",
        primaryDark: "#3F166",
        secondary: "#FDBB30",
        secondaryLight: "#FFD166"
      }
    },
     
     
     warrensburg: {
      key: "warrensburg",
      name: "Warrensburg Tigers",
      logo: base + "images/tigers-logo.png", 
       theme: {
        primary: "#C8102E",
        primaryLight: "#E03A4F",
        primaryDark: "#8B0E22",
        secondary: "#111111",
        secondaryLight: "#2A2A2A"
      }
    }

  };
})();

/* ========================================
   🌐 GET SCHOOL (FINAL FIXED VERSION)
======================================== */

function getSchool() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSchool = urlParams.get("school");
  const stored = sessionStorage.getItem("school");

  let school = urlSchool || stored;

  // 🔥 AUTO DEFAULT = FIRST SCHOOL IN CONFIG
  if (!school) {
    school = Object.keys(CONFIG_MAP)[0];
  }

  school = school.toLowerCase().replace(/\s+/g, "");

  sessionStorage.setItem("school", school);

  console.log("🏫 ACTIVE SCHOOL:", school);

  return school;
}

/* ========================================
   🌐 APP READY
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {

    const school = getSchool();

    const selected = CONFIG_MAP[school] || CONFIG_MAP[Object.keys(CONFIG_MAP)[0]];

    const config = {
      ...selected,

      // 🔥 SAME API FOR ALL SCHOOLS
      dataURL: "https://script.google.com/macros/s/AKfycbwnSjmwlod_AoqmTEoownI1CsWhjpTu9ubLrb78DsLBTaH0WDnYxXNiXEyJmY1J0Uh2/exec",
      submitURL: "https://script.google.com/macros/s/AKfycbwnSjmwlod_AoqmTEoownI1CsWhjpTu9ubLrb78DsLBTaH0WDnYxXNiXEyJmY1J0Uh2/exec"
    };

    window.SCHOOL_CONFIG = config;

    console.log("🏫 CONFIG LOADED:", config);

    applyTheme(config.theme, school);
    applyBaseTheme(config);

    await waitForHeader();
    applyHeaderBranding(config);

    resolve(config);

  } catch (err) {
    console.error("❌ CONFIG LOAD FAILED:", err);
    reject(err);
  }
});

/* ========================================
   🎨 APPLY THEME
======================================== */

function applyTheme(theme, school) {
  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primaryLight", theme.primaryLight);
  root.style.setProperty("--primaryDark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondaryLight", theme.secondaryLight);

  sessionStorage.setItem("theme-" + school, JSON.stringify(theme));

  console.log("🎨 THEME APPLIED:", theme);
}

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

      if (logo) resolve();
      else if (attempts < 50) {
        attempts++;
        setTimeout(check, 50);
      } else resolve();
    };

    check();
  });
}

/* ========================================
   🏫 APPLY HEADER
======================================== */

function applyHeaderBranding(config) {

  // 🔥 Support BOTH header logo + timer logo
  const headerLogo = document.getElementById("schoolLogo");
  const timerLogo = document.getElementById("teamLogo");

  const name = document.getElementById("schoolName");

  /* =============================
     APPLY LOGO (HEADER)
  ============================= */
  if (headerLogo) {
    headerLogo.src = config.logo + "?v=" + Date.now();
    headerLogo.onload = () => headerLogo.classList.add("loaded");
  }

  /* =============================
     APPLY LOGO (TIMER PAGE)
  ============================= */
  if (timerLogo) {
    timerLogo.src = config.logo + "?v=" + Date.now();
    timerLogo.onload = () => timerLogo.classList.add("loaded");
  }

  /* =============================
     APPLY SCHOOL NAME
  ============================= */
  if (name) {
    name.textContent = config.name;
  }
}

/* ========================================
   🔐 GLOBAL LOGOUT
======================================== */

window.logout = function () {
  console.log("🔒 Logging out...");

  sessionStorage.clear();
  localStorage.clear();

  const base = window.location.pathname.includes("/Elite-Athletic-Performance/")
    ? "/Elite-Athletic-Performance/"
    : "/";

  window.location.href = base + "index.html";
};

/* ========================================
   🚨 FAIL SAFE
======================================== */

window.APP_READY.catch(() => {
  document.body.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <div>
        <h1>⚠️ System Error</h1>
        <p>Unable to load configuration</p>
      </div>
    </div>
  `;
});

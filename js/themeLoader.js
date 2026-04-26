// ========================================
// 🔥 ELITE V10 THEME + CONFIG ENGINE (FIXED)
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
   🌐 GLOBAL APP READY
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {

    const base = getBasePath();

    // 🔥 HARD-CODED CONFIG (WITH THEME)
    const config = {
      key: "pleasanthill",
      name: "Pleasant Hill Roosters",

      logo: base + "images/roosters-logo.png",

      dataURL: "https://script.google.com/macros/s/AKfycbx4PyTeFkNyFE_LpovykeiFXiLgPwcB3shbjwDIyFMARi496yZ2wHq_G5jwXJsqV_3o/exec",
      submitURL: "https://script.google.com/macros/s/AKfycbx4PyTeFkNyFE_LpovykeiFXiLgPwcB3shbjwDIyFMARi496yZ2wHq_G5jwXJsqV_3o/exec",

      // 🔥 THIS WAS MISSING
      theme: {
        primary: "#5a2ca0",        // Pleasant Hill purple
        primaryLight: "#8b5cf6",
        primaryDark: "#3b1a6e",
        secondary: "#a78bfa",
        secondaryLight: "#c4b5fd"
      }
    };

    window.SCHOOL_CONFIG = config;

    console.log("🏫 CONFIG LOADED:", config);

    // ✅ APPLY THEME (🔥 KEY FIX)
    applyTheme(config.theme);

    // ✅ APPLY BASE
    applyBaseTheme(config);

    // ✅ HEADER SYNC
    await waitForHeader();
    applyHeaderBranding(config);

    resolve(config);

  } catch (err) {
    console.error("❌ CONFIG LOAD FAILED:", err);
    reject(err);
  }
});

/* ========================================
   🎨 APPLY THEME (🔥 NEW)
======================================== */

function applyTheme(theme) {
  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primaryLight", theme.primaryLight);
  root.style.setProperty("--primaryDark", theme.primaryDark);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondaryLight", theme.secondaryLight);

  // 🔥 STORE FOR OTHER PAGES (CRITICAL)
  sessionStorage.setItem(
    "theme-" + "pleasanthill",
    JSON.stringify(theme)
  );

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

      if (logo) {
        resolve();
      } else if (attempts < 50) {
        attempts++;
        setTimeout(check, 50);
      } else {
        console.warn("⚠️ Header not detected");
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

    logo.onload = () => logo.classList.add("loaded");

    logo.onerror = () => {
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

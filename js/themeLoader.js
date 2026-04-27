// ========================================
// 🔥 ELITE PRODUCTION THEME ENGINE (MULTI-TENANT)
// ========================================

window.SCHOOL_CONFIG = null;

const CONFIG_API =
  "https://script.google.com/macros/s/AKfycbyEbmsTrKNpFGjn7638jrRUzQXXcldV3_yCJc62ujkBDqxM6GXypMHfZRgyGG-p-jHR/exec";

/* ========================================
   🧠 GET SCHOOL FROM URL
======================================== */

function getSchoolKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("school") || "pleasanthill")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/* ========================================
   🌐 BASE PATH (GitHub Pages safe)
======================================== */

function getBasePath() {
  return window.location.pathname.includes("/Elite-Athletic-Performance/")
    ? "/Elite-Athletic-Performance/"
    : "/";
}

/* ========================================
   🚀 APP INITIALIZER
======================================== */

window.APP_READY = (async () => {
  const schoolKey = getSchoolKey();
  const base = getBasePath();

  try {
    const res = await fetch(
      `${CONFIG_API}?type=config&school=${schoolKey}&t=${Date.now()}`
    );

    if (!res.ok) {
      throw new Error("Config fetch failed");
    }

    const config = await res.json();

    if (!config || config.error) {
      throw new Error(config?.error || "Invalid config response");
    }

    // ========================================
    // 🧠 NORMALIZE CONFIG
    // ========================================

    window.SCHOOL_CONFIG = {
      key: config.school,
      name: config.fullName || config.name || "Unknown School",
      logo: resolveLogo(config.logo, base),

      primary: config.primary || "#7c3aed",
      primaryLight: config.primaryLight || "#a78bfa",
      primaryDark: config.primaryDark || "#6d28d9",

      secondary: config.secondary || "#f59e0b",
      secondaryLight: config.secondaryLight || "#fbbf24",

      background: config.background || "#000000",

      dataURL: config.dataURL,
      submitURL: config.submitURL
    };

    console.log("🏫 Loaded Config:", window.SCHOOL_CONFIG);

    applyTheme(window.SCHOOL_CONFIG);

    await waitForHeader();
    applyHeaderBranding(window.SCHOOL_CONFIG);

    return window.SCHOOL_CONFIG;

  } catch (err) {
    console.error("❌ Theme load failed:", err);
    showFatalError(err.message || "Failed to load configuration.");
    throw err;
  }
})();

/* ========================================
   🎨 APPLY THEME
======================================== */

function applyTheme(config) {
  const root = document.documentElement;

  root.style.setProperty("--primary", config.primary);
  root.style.setProperty("--primaryLight", config.primaryLight);
  root.style.setProperty("--primaryDark", config.primaryDark);
  root.style.setProperty("--secondary", config.secondary);
  root.style.setProperty("--secondaryLight", config.secondaryLight);
  root.style.setProperty("--background", config.background);

  document.body.style.backgroundColor = config.background;

  // favicon
  let favicon = document.getElementById("dynamicFavicon");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.id = "dynamicFavicon";
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = config.logo + "?v=" + Date.now();

  // session cache (light usage)
  sessionStorage.setItem("school", config.key);
  sessionStorage.setItem("schoolName", config.name);
  sessionStorage.setItem("schoolLogo", config.logo);
}

/* ========================================
   🏫 HEADER BRANDING
======================================== */

function applyHeaderBranding(config) {
  const logo = document.getElementById("schoolLogo");
  const name = document.getElementById("schoolName");

  if (logo) {
    logo.src = config.logo + "?v=" + Date.now();
    logo.classList.add("loaded");
  }

  if (name) {
    name.textContent = config.name;
  }

  const title = document.querySelector("h1");

  if (title) {
    title.style.textShadow = `
      0 0 10px ${config.primary},
      0 0 20px ${config.primaryLight}
    `;
  }
}

/* ========================================
   🧠 WAIT FOR HEADER
======================================== */

function waitForHeader() {
  return new Promise(resolve => {
    let attempts = 0;

    const check = () => {
      if (document.getElementById("schoolLogo")) {
        resolve();
      } else if (attempts < 50) {
        attempts++;
        setTimeout(check, 50);
      } else {
        resolve();
      }
    };

    check();
  });
}

/* ========================================
   🧩 HELPERS
======================================== */

function resolveLogo(logo, base) {
  if (!logo) return "";
  if (logo.startsWith("http")) return logo;
  return base + logo;
}

/* ========================================
   ❌ FATAL ERROR UI
======================================== */

function showFatalError(message) {
  document.body.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      height:100vh;
      background:black;
      color:white;
      font-family:sans-serif;
      text-align:center;
      padding:20px;
    ">
      <div>
        <h2>⚠️ Configuration Error</h2>
        <p>${message}</p>
      </div>
    </div>
  `;
}

/* ========================================
   🔥 ELITE V9 THEME + CONFIG LOADER (FULLY HARDENED)
======================================== */

/* ========================================
   🌐 GLOBAL BOOT PROMISE
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {

    const params = new URLSearchParams(window.location.search);
    let school = params.get("school") || sessionStorage.getItem("school");

    if (!school) {
      throw new Error("No school provided in URL or session");
    }

    sessionStorage.setItem("school", school);

    /* ========================================
       🏫 SCHOOL CONFIG MAP
    ======================================== */

    const SCHOOL_MAP = {

      pleasanthill: {
        key: "pleasanthill",
        name: "Pleasant Hill Roosters",
       const BASE = window.location.pathname.includes("/Elite-Athletic-Performance/")
  ? "/Elite-Athletic-Performance/"
  : "/";

logo: BASE + "images/roosters-logo.png"

        dataURL: "https://script.google.com/macros/s/AKfycbxyBta6YQTkJsfd1uInNAsv1DJofq22D365FgGSUa6ZTLXCaYu29KAuJp1_vgH56zfk/exec",
        submitURL: "https://script.google.com/macros/s/AKfycbxyBta6YQTkJsfd1uInNAsv1DJofq22D365FgGSUa6ZTLXCaYu29KAuJp1_vgH56zfk/exec"
      }

    };

    const config = SCHOOL_MAP[school.toLowerCase()];

    if (!config) {
      throw new Error("School config not found: " + school);
    }

    window.SCHOOL_CONFIG = config;

    console.log("🏫 SCHOOL CONFIG LOADED:", config);

    // ✅ Apply early-safe theme
    applyBaseTheme(config);

    // ✅ Wait for header → then inject branding
    waitForHeader().then(() => {
      applyHeaderBranding(config);
    });

    resolve(config);

  } catch (err) {
    console.error("❌ CONFIG LOAD FAILED:", err);
    reject(err);
  }
});

/* ========================================
   🎨 BASE THEME (SAFE EARLY APPLY)
======================================== */

function applyBaseTheme(config) {

  const favicon = document.getElementById("dynamicFavicon");

  if (favicon && config.logo) {
    favicon.href = config.logo;
  }

  sessionStorage.setItem("schoolName", config.name || "");
  sessionStorage.setItem("schoolLogo", config.logo || "");
}

/* ========================================
   ⏳ WAIT FOR HEADER
======================================== */

function waitForHeader() {
  return new Promise(resolve => {

    // Already exists
    if (document.getElementById("schoolLogo")) {
      return resolve();
    }

    // Wait for header.js
    document.addEventListener("headerLoaded", resolve, { once: true });
  });
}

/* ========================================
   🏫 APPLY HEADER BRANDING (FULLY HARDENED)
======================================== */

function applyHeaderBranding(config) {

  const logo = document.getElementById("schoolLogo");
  const name = document.getElementById("schoolName");

  // ✅ School name
  if (name && config.name) {
    name.textContent = config.name;
  }

  // ✅ Logo (bulletproof)
  if (logo && config.logo) {

    // Prevent duplicate re-application flicker
    if (logo.src === config.logo) return;

    // Reset state
    logo.style.opacity = "0";

    // Force reload
    logo.src = "";
    setTimeout(() => {
      logo.src = config.logo;
    }, 10);

    // Success
    logo.onload = () => {
      logo.style.opacity = "1";
      console.log("✅ LOGO LOADED");
    };

    // Failure fallback
    logo.onerror = () => {
      console.error("❌ LOGO FAILED:", config.logo);

      logo.src = "/Elite-Athletic-Performance/images/default-logo.png";
      logo.style.opacity = "1";
    };
  }

  console.log("🎨 HEADER BRANDING APPLIED");
}

/* ========================================
   🚨 GLOBAL FAIL SAFE
======================================== */

window.APP_READY.catch(() => {
  document.body.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      height:100vh;
      font-family:sans-serif;
      text-align:center;
    ">
      <h1>⚠️ System Error</h1>
      <p>Unable to load school configuration</p>
    </div>
  `;
});

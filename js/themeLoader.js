/* ========================================
   🔥 ELITE V9 THEME + CONFIG LOADER (FINAL)
======================================== */

/* ========================================
   🌐 BASE PATH (FIXED)
======================================== */

const BASE = window.location.pathname.includes("/Elite-Athletic-Performance/")
  ? "/Elite-Athletic-Performance/"
  : "/";

/* ========================================
   🌐 GLOBAL BOOT PROMISE
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {

    const params = new URLSearchParams(window.location.search);
    let school = params.get("school") || sessionStorage.getItem("school");

    if (!school) {
      throw new Error("No school provided");
    }

    sessionStorage.setItem("school", school);

    /* ========================================
       🏫 SCHOOL CONFIG MAP
    ======================================== */

    const SCHOOL_MAP = {

      pleasanthill: {
        key: "pleasanthill",
        name: "Pleasant Hill Roosters",

        // ✅ FIXED LOGO PATH
        logo: BASE + "images/roosters-logo.png",

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

    applyBaseTheme(config);

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
   🎨 BASE THEME
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

    if (document.getElementById("schoolLogo")) {
      return resolve();
    }

    document.addEventListener("headerLoaded", resolve, { once: true });
  });
}

/* ========================================
   🏫 APPLY HEADER BRANDING
======================================== */

function applyHeaderBranding(config) {

  const logo = document.getElementById("schoolLogo");
  const name = document.getElementById("schoolName");

  if (logo && config.logo) {

    // 🔥 set source FIRST
    logo.src = config.logo;

    // 🔥 fade in when loaded
    logo.onload = () => {
      logo.classList.add("loaded");
    };

    // 🔥 fallback safety
    logo.onerror = () => {
      console.error("❌ LOGO FAILED:", config.logo);
      logo.src = "/Elite-Athletic-Performance/images/default-logo.png";
      logo.classList.add("loaded"); // still show fallback
    };

    console.log("✅ LOGO LOADED");
  }

  if (name && config.name) {
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

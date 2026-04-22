/* ========================================
   🔥 ELITE V7 THEME + CONFIG LOADER (LOCKED)
======================================== */

/* ========================================
   🌐 GLOBAL BOOT PROMISE (CRITICAL)
======================================== */

window.APP_READY = new Promise(async (resolve, reject) => {
  try {

    const params = new URLSearchParams(window.location.search);
    let school = params.get("school") || sessionStorage.getItem("school");

    if (!school) {
      throw new Error("No school provided in URL or session");
    }

    // persist school
    sessionStorage.setItem("school", school);

    // ========================================
    // 🔥 SCHOOL CONFIG MAP (ADD SCHOOLS HERE)
    // ========================================

    const SCHOOL_MAP = {

      pleasanthill: {
        key: "pleasanthill",
        name: "Pleasant Hill Roosters",
        logo: "https://eliteathleticperformance.github.io/Elite-Athletic-Performance/images/roosters-logo.png",

        dataURL: "https://script.google.com/macros/s/AKfycbwF-FBeEgi...REPLACE_WITH_YOURS.../exec",
        submitURL: "https://script.google.com/macros/s/AKfycbz88iVIyoy...REPLACE_WITH_YOURS.../exec"
      }

      // 👉 ADD MORE SCHOOLS HERE
    };

    const config = SCHOOL_MAP[school.toLowerCase()];

    if (!config) {
      throw new Error("School config not found: " + school);
    }

    // ========================================
    // ✅ SET GLOBAL CONFIG
    // ========================================

    window.SCHOOL_CONFIG = config;

    console.log("🏫 SCHOOL CONFIG LOADED:", config);

    // ========================================
    // 🎨 APPLY THEME
    // ========================================

    applyTheme(config);

    resolve(config);

  } catch (err) {
    console.error("❌ CONFIG LOAD FAILED:", err);
    reject(err);
  }
});

/* ========================================
   🎨 APPLY THEME
======================================== */

function applyTheme(config) {

  // 🔖 FAVICON
  const favicon = document.getElementById("dynamicFavicon");
  if (favicon && config.logo) {
    favicon.href = config.logo;
  }

  // 🏫 SCHOOL NAME (if present)
  const nameEl = document.querySelector(".school-name");
  if (nameEl && config.name) {
    nameEl.textContent = config.name;
  }

  // 🧠 store for reuse
  sessionStorage.setItem("schoolName", config.name || "");
  sessionStorage.setItem("schoolLogo", config.logo || "");
}

/* ========================================
   🚨 GLOBAL FAIL SAFE UI
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

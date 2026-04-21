/* ========================================
   🔥 ELITE V3 HEADER ENGINE (PRODUCTION)
======================================== */

/* ========================================
   INIT
======================================== */

document.addEventListener("DOMContentLoaded", loadHeader);

/* ========================================
   🧱 HEADER LOAD
======================================== */

async function loadHeader() {
  const container = document.getElementById("header-placeholder");
  if (!container) return;

  try {
    const res = await fetch("components/header.html");
    if (!res.ok) throw new Error("Header fetch failed");

    const html = await res.text();
    container.innerHTML = html;

    // ✅ Initialize AFTER DOM inject (no setTimeout needed)
    initHeaderUI();

  } catch (err) {
    console.error("❌ HEADER LOAD ERROR:", err);
  }
}

/* ========================================
   🎯 HEADER UI INIT
======================================== */

function initHeaderUI() {
  setupMenu();
  highlightActiveLink();
  injectSchoolIntoLinks();
  setPageTitle();

  // 🔥 notify other systems (themeLoader)
  document.dispatchEvent(new Event("headerLoaded"));
}

/* ========================================
   🏫 SCHOOL HANDLING
======================================== */

function getSchoolParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get("school") || localStorage.getItem("school") || "";
}

function injectSchoolIntoLinks() {
  const school = getSchoolParam();
  if (!school) return;

  localStorage.setItem("school", school);

  document.querySelectorAll("#dropdownMenu a").forEach(link => {
    let href = link.getAttribute("href");
    if (!href) return;

    // remove existing school param
    href = href.split("?")[0];

    link.setAttribute("href", `${href}?school=${school}`);
  });
}

/* ========================================
   🏷️ PAGE TITLE
======================================== */

function setPageTitle() {
  const pageTitleEl = document.getElementById("pageTitle");
  if (pageTitleEl) {
    pageTitleEl.textContent = "Elite Athletic Performance";
  }
}

/* ========================================
   🔗 ACTIVE LINK HIGHLIGHT
======================================== */

function highlightActiveLink() {
  const links = document.querySelectorAll("#dropdownMenu a");
  const current = window.location.pathname.split("/").pop();

  links.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    const cleanHref = href.split("?")[0];

    if (cleanHref === current) {
      link.style.color = "var(--primary)";
      link.style.fontWeight = "700";
    }
  });
}

/* ========================================
   ☰ MENU
======================================== */

function setupMenu() {
  const toggle = document.getElementById("menuToggle");
  const dropdown = document.getElementById("dropdownMenu");

  if (!toggle || !dropdown) return;

  // prevent duplicate listeners
  toggle.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  };

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

/* ========================================
   🚀 NAVIGATION HELPERS (FIXES YOUR ERROR)
======================================== */

// 🔥 THIS fixes: goToEnterTest is not defined
function goToEnterTest() {
  const school = getSchoolParam();
  window.location.href = school
    ? `enter.html?school=${school}`
    : "enter.html";
}

// Optional helpers (future-proof navigation)
function goToLeaderboard() {
  const school = getSchoolParam();
  window.location.href = school
    ? `leaderboard.html?school=${school}`
    : "leaderboard.html";
}

function goToTesting() {
  const school = getSchoolParam();
  window.location.href = school
    ? `testing.html?school=${school}`
    : "testing.html";
}

function goToAthletes() {
  const school = getSchoolParam();
  window.location.href = school
    ? `athletes.html?school=${school}`
    : "athletes.html";
}

// ========================================
// 🔥 ELITE V6 HEADER ENGINE (STABLE + CLEAN)
// ========================================

document.addEventListener("DOMContentLoaded", loadHeader);

/* ========================================
   🧱 HEADER LOAD
======================================== */

async function loadHeader() {
  const container = document.getElementById("header-placeholder");
  if (!container) return;

  try {
    const base = getBasePath();
    const res = await fetch(base + "components/header.html");

    if (!res.ok) throw new Error("Header fetch failed");

    const html = await res.text();
    container.innerHTML = html;

    initHeaderUI();

  } catch (err) {
    console.error("❌ HEADER LOAD ERROR:", err);
  }
}

/* ========================================
   🎯 INIT
======================================== */

function initHeaderUI() {
  setupMenu();
  highlightActiveLink();
  injectSchoolIntoLinks();
  setPageTitle();

  // 🔥 SIGNAL THAT HEADER IS READY
  document.dispatchEvent(new Event("headerLoaded"));
}

/* ========================================
   🌐 BASE PATH (CRITICAL FOR GITHUB)
======================================== */

function getBasePath() {
  const path = window.location.pathname;

  if (path.includes("/Elite-Athletic-Performance/")) {
    return "/Elite-Athletic-Performance/";
  }

  return "/";
}

/* ========================================
   🏫 SCHOOL PARAM
======================================== */

function getSchoolParam() {
  const params = new URLSearchParams(window.location.search);
  let school = params.get("school");

  if (school) {
    sessionStorage.setItem("school", school);
  } else {
    school = sessionStorage.getItem("school");
  }

  return school || "";
}

/* ========================================
   🔗 LINK INJECTION (FIXED)
======================================== */

function injectSchoolIntoLinks() {
  const school = getSchoolParam();
  const base = getBasePath();

  document.querySelectorAll("#dropdownMenu a").forEach(link => {
    let href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;

    // remove query params
    href = href.split("?")[0];

    const fullPath = base + href;
    const url = new URL(fullPath, window.location.origin);

    if (school) {
      url.searchParams.set("school", school);
    }

    link.setAttribute("href", url.pathname + url.search);
  });
}

/* ========================================
   🏷️ TITLE
======================================== */

function setPageTitle() {
  const el = document.getElementById("pageTitle");
  if (el) el.textContent = "Elite Athletic Performance";
}

/* ========================================
   🔗 ACTIVE LINK
======================================== */

function highlightActiveLink() {
  const links = document.querySelectorAll("#dropdownMenu a");
  const current = window.location.pathname.split("/").pop();

  links.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    const clean = href.split("?")[0].split("/").pop();

    if (clean === current) {
      link.style.color = "var(--primary)";
      link.style.fontWeight = "700";
    }
  });
}

/* ========================================
   ☰ MENU
======================================== */

let menuInitialized = false;

function setupMenu() {
  if (menuInitialized) return;
  menuInitialized = true;

  const toggle = document.getElementById("menuToggle");
  const dropdown = document.getElementById("dropdownMenu");

  if (!toggle || !dropdown) return;

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
   🚀 NAVIGATION HELPERS (FIXED)
======================================== */

function goToPage(page) {
  const school = getSchoolParam();
  const base = getBasePath();

  const url = school
    ? `${base}${page}?school=${school}`
    : `${base}${page}`;

  window.location.href = url;
}

function goToEnterTest() { goToPage("enter.html"); }
function goToLeaderboard() { goToPage("leaderboard.html"); }
function goToTesting() { goToPage("testing.html"); }
function goToAthletes() { goToPage("athletes.html"); }

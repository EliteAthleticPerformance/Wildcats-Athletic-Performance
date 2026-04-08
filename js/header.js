/* ========================================
   🔥 ELITE V3 HEADER SYSTEM
   ======================================== */

const STORAGE_KEY = "athleteScores";
const SESSION_KEY = "coachAccess";
const COACH_PASSWORD = "coach123";

/* ========================================
   INIT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  loadHeader();
});

/* ========================================
   📊 DASHBOARD STATS
   ======================================== */

function updateStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const valid = raw.filter(a =>
      a && a.name && a.name.trim() !== ""
    );

    const totalTests = valid.length;

    const uniqueAthletes = new Set(
      valid.map(a => a.name.trim())
    ).size;

    updateElement("totalTests", totalTests);
    updateElement("totalAthletes", uniqueAthletes);

  } catch (err) {
    console.warn("Stats error:", err);
  }
}

/* ========================================
   🔒 AUTH SYSTEM
   ======================================== */

function isCoach() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

window.goToEnterTest = function () {

  if (isCoach()) {
    navigate("enter.html");
    return;
  }

  const password = prompt("Enter coach password:");

  if (password === null) return;

  if (password === COACH_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "true");
    navigate("enter.html");
  } else {
    alert("Incorrect password");
  }
};

window.logout = function () {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
};

/* ========================================
   🧱 HEADER LOAD
   ======================================== */

async function loadHeader() {

  const container = document.getElementById("header-placeholder");

  if (!container) {
    console.warn("Missing #header-placeholder");
    return;
  }

  // Prevent duplicate loads
  if (container.innerHTML.trim() !== "") return;

  try {
    const res = await fetch("/Wildcats-Athletic-Performance/components/header.html");

    if (!res.ok) throw new Error("Header fetch failed");

    const html = await res.text();

    container.innerHTML = html;

    initHeaderUI();

  } catch (err) {
    console.error("Header load error:", err);
  }
}

/* ========================================
   🎯 HEADER UI INIT
   ======================================== */

function initHeaderUI() {
  scaleHeaderText();
  setupMenu();
  setupResize();
}



/* ========================================
   📏 RESPONSIVE TITLE SCALING
   ======================================== */

function scaleHeaderText() {

  const header = document.getElementById("schoolHeader");
  const left = document.querySelector(".header-left");
  const right = document.querySelector(".header-right");
  const title = document.querySelector(".title");

  if (!header || !left || !right || !title) return;

  title.style.transform = "scale(1)";

  const available =
    header.clientWidth -
    left.offsetWidth -
    right.offsetWidth -
    40;

  const textWidth = title.scrollWidth;

  if (!textWidth) return;

  let scale = available / textWidth;

  scale = clamp(scale, 0.65, 1.2);

  title.style.transform = `scale(${scale})`;
}

/* ========================================
   ☰ MOBILE MENU
   ======================================== */

function setupMenu() {

  const toggle = document.getElementById("menuToggle");
  const dropdown = document.getElementById("dropdownMenu");

  if (!toggle || !dropdown) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });
}

/* ========================================
   📱 RESIZE HANDLING
   ======================================== */

function setupResize() {

  let timeout;

  window.addEventListener("resize", () => {
    clearTimeout(timeout);
    timeout = setTimeout(scaleHeaderText, 100);
  });
}

/* ========================================
   🧰 UTILITIES
   ======================================== */

function updateElement(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function navigate(url) {
  window.location.href = url;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
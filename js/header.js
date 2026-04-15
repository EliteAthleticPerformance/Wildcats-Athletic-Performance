/* ========================================
   INIT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  updateStats();
});

/* ========================================
   📊 DASHBOARD STATS
   ======================================== */

function updateStats() {

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";
  Papa.parse(CSV_URL, {
    download: true,
    header: false,
    complete: function(results) {

      const rows = results.data || [];

      // Remove empty rows
      const cleanRows = rows.filter(r => (r[0] || "").trim() !== "");

      // TOTAL TESTS
      const totalTests = cleanRows.length;

      // UNIQUE ATHLETES
      const uniqueAthletes = new Set(
        cleanRows.map(r => (r[0] || "").trim())
      ).size;

      console.log("LIVE STATS:", { totalTests, uniqueAthletes });

      // 🔥 Animate numbers
      animateValue("totalTests", totalTests, 800);
      animateValue("totalAthletes", uniqueAthletes, 800);

    },
    error: function(err) {
      console.error("CSV LOAD ERROR:", err);
    }
  });
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
  if (!container) return;

  try {
const res = await fetch("components/header.html");
    if (!res.ok) throw new Error("Header fetch failed");

    const html = await res.text();

    // 🔥 THIS IS THE CRITICAL LINE
    container.innerHTML = html;

    // Init menu + UI AFTER load
    initHeaderUI();

  } catch (err) {
    console.error("HEADER LOAD ERROR:", err);
  }
}

/* ========================================
   🎯 HEADER UI INIT
   ======================================== */

function initHeaderUI() {
  
  setupMenu();
  
  highlightActiveLink();

  // ✅ Move title logic here
  const pageTitleEl = document.getElementById("pageTitle");
if (pageTitleEl) {
  pageTitleEl.textContent = "Elite Athletic Performance";
}
}

function highlightActiveLink() {
  const links = document.querySelectorAll("#dropdownMenu a");

  links.forEach(link => {
    if (window.location.href.includes(link.getAttribute("href"))) {
      link.style.color = "gold";
      link.style.fontWeight = "700";
    }
  });
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
    e.stopPropagation(); // 🔥 prevents document click
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    // 🔥 ONLY close if clicking outside menu
    if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
      dropdown.classList.remove("show");
    }
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


function animateValue(id, end, duration = 800) {

  const el = document.getElementById(id);
  if (!el) return;

  let start = 0;
  const range = end - start;

  if (range === 0) {
    el.textContent = end;
    return;
  }

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const value = Math.floor(progress * range + start);
    el.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = end; // ensure exact final value
    }
  }

  requestAnimationFrame(update);
}

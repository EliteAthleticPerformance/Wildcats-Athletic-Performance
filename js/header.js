/* ========================================
   INIT
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
});

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

    // 🔥 wait for DOM to update
    setTimeout(() => {
      initHeaderUI();
    }, 0);

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

  const schoolNameEl = document.getElementById("schoolName");
  const pageTitleEl = document.getElementById("pageTitle");

  if (schoolNameEl) {
    schoolNameEl.textContent = "Harrisonville Wildcats";
  }

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
    if (link.getAttribute("href") === current) {
      link.style.color = "#60a5fa";
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

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

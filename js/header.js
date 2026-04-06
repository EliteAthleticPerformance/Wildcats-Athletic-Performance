document.addEventListener("DOMContentLoaded", () => {

/* =========================
   ⚙️ CONFIG
========================= */

const STORAGE_KEY = "athleteScores";
const SESSION_KEY = "coachAccess";
const COACH_PASSWORD = "coach123";

/* =========================
   📊 DASHBOARD STATS
========================= */

function updateStats() {
    try {
        const rawData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        const valid = rawData.filter(a =>
            a && a.name && a.name.trim() !== ""
        );

        const totalTests = valid.length;

        const uniqueAthletes = new Set(
            valid.map(a => a.name.trim())
        ).size;

        const testsEl = document.getElementById("totalTests");
        const athletesEl = document.getElementById("totalAthletes");

        if (testsEl) testsEl.textContent = totalTests;
        if (athletesEl) athletesEl.textContent = uniqueAthletes;

    } catch (err) {
        console.warn("Stats error:", err);
    }
}

/* =========================
   🔒 AUTH (COACH ACCESS)
========================= */

function isCoach() {
    return sessionStorage.getItem(SESSION_KEY) === "true";
}

window.goToEnterTest = function () {
    if (isCoach()) {
        window.location.href = "enter.html";
        return;
    }

    const password = prompt("Enter coach password:");

    if (password === null) return; // user cancelled

    if (password === COACH_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "true");
        window.location.href = "enter.html";
    } else {
        alert("Incorrect password");
    }
};

window.logout = function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
};

/* =========================
   🧱 LOAD HEADER
========================= */

function loadHeader() {
    const container = document.getElementById("header-placeholder");

    if (!container) {
        console.warn("No #header-placeholder found");
        return;
    }

    fetch("components/header.html")
        .then(res => {
            if (!res.ok) throw new Error("Header failed to load");
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;

            initHeaderUI();
        })
        .catch(err => {
            console.error("Header load error:", err);
        });
}

/* =========================
   🎯 INIT HEADER UI
========================= */

function initHeaderUI() {
    scaleHeaderText();
    setupMenuToggle();
    setupResizeHandler();
}

/* =========================
   📏 SCALE HEADER TEXT
========================= */

function scaleHeaderText() {
    const header = document.getElementById("schoolHeader");
    const left = document.querySelector(".header-left");
    const right = document.querySelector(".header-right");
    const title = document.getElementById("headerMotto");

    if (!header || !left || !right || !title) return;

    // Reset before recalculating
    title.style.transform = "scale(1)";

    const availableWidth =
        header.clientWidth -
        left.offsetWidth -
        right.offsetWidth -
        40;

    const textWidth = title.scrollWidth;

    if (!textWidth) return;

    let scale = availableWidth / textWidth;

    // Clamp for readability
    scale = Math.min(Math.max(scale, 0.65), 1.2);

    title.style.transform = `scale(${scale})`;
}

/* =========================
   ☰ MOBILE MENU
========================= */

function setupMenuToggle() {
    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("mainNav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        nav.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            nav.classList.remove("show");
        }
    });
}

/* =========================
   📱 RESIZE HANDLING
========================= */

function setupResizeHandler() {
    let resizeTimeout;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(scaleHeaderText, 100);
    });
}

/* =========================
   🚀 INIT
========================= */

updateStats();
loadHeader();

});
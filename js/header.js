document.addEventListener("DOMContentLoaded", () => {

    const rawData = JSON.parse(localStorage.getItem("athleteScores")) || [];

    // ✅ ONLY REQUIRE NAME (Column A)
    const validTests = rawData.filter(a =>
        a.name && a.name.trim() !== ""
    );

    const totalTests = validTests.length;

    const uniqueAthletes = [
        ...new Set(validTests.map(a => a.name))
    ].length;

    const testsEl = document.getElementById("totalTests");
    const athletesEl = document.getElementById("totalAthletes");

    if (testsEl) testsEl.innerText = totalTests;
    if (athletesEl) athletesEl.innerText = uniqueAthletes;

});


 
 
 // =========================
// 🔒 ENTER TEST ACCESS (GLOBAL)
// =========================
function goToEnterTest() {
    const unlocked = sessionStorage.getItem("coachAccess");

    if (unlocked === "true") {
        window.location.href = "enter.html";
        return;
    }

    const password = prompt("Enter coach password:");

    if (password === "coach123") {
        sessionStorage.setItem("coachAccess", "true");
        window.location.href = "enter.html";
    } else {
        alert("Incorrect password");
    }
}

function logout() {
    sessionStorage.removeItem("coachAccess");
    location.reload();
}


document.addEventListener("DOMContentLoaded", () => {

 

    const container = document.getElementById("header-placeholder");

    // ✅ SAFETY CHECK
    if (!container) {
        console.warn("No header-placeholder found on this page");
        return;
    }

    fetch("components/header.html") // safer path
        .then(res => {
            if (!res.ok) throw new Error("Header failed to load");
            return res.text();
        })
        .then(data => {

            container.innerHTML = data;

            

            // =========================
            // 📏 SCALE HEADER TEXT
            // =========================

            
            function scaleHeaderText() {

                const header = document.getElementById("schoolHeader");
                const left = document.querySelector(".header-left");
                const right = document.querySelector(".header-right");
                const title = document.getElementById("headerMotto");

                if (!header || !left || !right || !title) return;

                title.style.transform = "scale(1)";

                const available =
                    header.clientWidth -
                    left.offsetWidth -
                    right.offsetWidth - 40;

                const textWidth = title.scrollWidth;

                if (!textWidth) return;

                let scale = available / textWidth;

                scale = Math.min(Math.max(scale, 0.6), 1.3);

                title.style.transform = `scale(${scale})`;
            }

            

            // =========================
            // ☰ DROPDOWN MENU
            // =========================
            const toggle = document.getElementById("menuToggle");
            const nav = document.getElementById("mainNav");

            if (toggle && nav) {

                toggle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    nav.classList.toggle("show");
                });

                // close when clicking outside
                document.addEventListener("click", (e) => {
                    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
                        nav.classList.remove("show");
                    }
                });
            }

            // =========================
            // 🚀 INITIAL RENDER
            // =========================
            requestAnimationFrame(scaleHeaderText);

            // =========================
            // 📱 RESIZE HANDLING
            // =========================
            let resizeTimeout;

            window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(scaleHeaderText, 100);
            });

        })
        .catch(err => {
            console.error("Header load error:", err);
        });

});
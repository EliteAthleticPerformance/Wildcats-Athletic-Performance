const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC3FetWgkN8c6kkn45lv_Y7GKXrXxp7Fc7qGW945A2UwMIKVL-jV_tmtvRQNdnrdF9/exec";

/* =====================
   HELPERS
===================== */

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function toNumber(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}

/* =====================
   ⚖️ WEIGHT CLASS
===================== */

function getWeightClass(weight) {
    if (weight <= 120) return "100";
    if (weight <= 140) return "121";
    if (weight <= 160) return "141";
    if (weight <= 180) return "161";
    if (weight <= 195) return "181";
    if (weight <= 210) return "196";
    if (weight <= 225) return "211";
    if (weight <= 240) return "226";
    if (weight <= 255) return "241";
    if (weight <= 270) return "256";
    if (weight <= 285) return "271";
    if (weight <= 300) return "286";
    return "301";
}

/* =====================
   💾 SAVE FUNCTION
===================== */

async function saveAthlete() {

    const name = getValue("name");
    const date = getValue("date") || todayISO();
    const weight = toNumber(getValue("weight"));

    if (!name) {
        showMessage("Enter athlete name", "error");
        return;
    }

    const entry = {
        name,
        date,
        weight,
        weightClass: getWeightClass(weight),

        bench: toNumber(getValue("bench")),
        squat: toNumber(getValue("squat")),
        clean: toNumber(getValue("clean")),

        vertical: toNumber(getValue("vertical")),
        broad: toNumber(getValue("broad")),
        medball: toNumber(getValue("medball")),

        agility: getValue("agility"),
        ten: getValue("ten"),
        forty: getValue("forty"),
        situps: getValue("situps")
    };

    // Derived
    entry.total = entry.bench + entry.squat + entry.clean;
    entry.score = 0; // calculated in Sheets

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(entry),
            headers: { "Content-Type": "application/json" }
        });

        showMessage("✅ Saved to Google Sheets!", "success");

    } catch (err) {
        saveOffline(entry);
        showMessage("⚠️ Offline — saved locally", "warning");
    }

    clearForm();
}

/* =====================
   💾 OFFLINE SAVE
===================== */

function saveOffline(entry) {

    let data = JSON.parse(localStorage.getItem("athleteScores")) || [];

    let athlete = data.find(a => a.name === entry.name);

    if (!athlete) {
        athlete = { name: entry.name, history: [] };
        data.push(athlete);
    }

    athlete.history.push(entry);

    localStorage.setItem("athleteScores", JSON.stringify(data));
}

/* =====================
   UI HELPERS
===================== */

function clearForm() {
    document.querySelectorAll("input").forEach(i => i.value = "");
}

function showMessage(msg, type) {

    let el = document.getElementById("formMessage");

    if (!el) {
        el = document.createElement("div");
        el.id = "formMessage";
        el.style.marginTop = "15px";
        el.style.textAlign = "center";
        document.querySelector(".form-card")?.appendChild(el);
    }

    el.textContent = msg;

    el.style.color =
        type === "success" ? "#00e676" :
        type === "error" ? "#ff5252" :
        "#ffd740";

    setTimeout(() => {
        el.textContent = "";
    }, 3000);
}

/* =====================
   OPTIONAL UX BOOSTS
===================== */

// Auto-focus first input
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("name")?.focus();
});

// Submit on Enter (mobile-friendly)
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && active.tagName === "INPUT") {
            e.preventDefault();
            saveAthlete();
        }
    }
});
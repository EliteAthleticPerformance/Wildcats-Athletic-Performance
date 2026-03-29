const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC3FetWgkN8c6kkn45lv_Y7GKXrXxp7Fc7qGW945A2UwMIKVL-jV_tmtvRQNdnrdF9/exec";

// =====================
// ⚖️ WEIGHT CLASS FUNCTION
// =====================
const getWeightClass = (weight) => {
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
    if (weight <= 400) return "301";

    return "UN"; // fallback
};


// =====================
// 💾 SAVE FUNCTION
// =====================
function saveAthlete() {

    const get = id => document.getElementById(id).value;

    const name = get("name");
    const date = get("date") || new Date().toISOString();
    const weight = parseFloat(get("weight")) || 0;
    const weightClass = getWeightClass(weight);

    if (!name) {
        alert("Enter athlete name");
        return;
    }

    const bench = parseFloat(get("bench")) || 0;
    const squat = parseFloat(get("squat")) || 0;
    const clean = parseFloat(get("clean")) || 0;

    const vertical = parseFloat(get("vertical")) || 0;
    const broad = parseFloat(get("broad")) || 0;
    const medball = parseFloat(get("medball")) || 0;

    const agility = get("agility");
    const ten = get("ten");
    const forty = get("forty");
    const situps = get("situps");

    // =====================
    // 🧠 CALCULATIONS
    // =====================
    const total = bench + squat + clean;

    // score handled by Google Sheets
    const score = 0;

    const newEntry = {
        name,
        date,
        weight,
        weightClass,
        bench,
        squat,
        clean,
        vertical,
        broad,
        medball,
        agility,
        ten,
        forty,
        situps,
        total,
        score
    };

    // =====================
    // ☁️ SEND TO GOOGLE SHEETS
    // =====================
    fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(newEntry),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(res => res.json())
    .then(() => {
        alert("✅ Saved to Google Sheets!");
    })
    .catch(() => {
        alert("⚠️ Offline — saved locally");

        let data = JSON.parse(localStorage.getItem("athleteScores")) || [];

        let athlete = data.find(a => a.name === name);

        if (!athlete) {
            athlete = { name, history: [] };
            data.push(athlete);
        }

        athlete.history.push(newEntry);
        localStorage.setItem("athleteScores", JSON.stringify(data));
    });

    // clear form
    document.querySelectorAll("input").forEach(i => i.value = "");
}
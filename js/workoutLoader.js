function parseCSV(text) {
    return text
        .split("\n")
        .map(line =>
            line.split(",").map(cell =>
                cell
                    .replace(/^"|"$/g, "")   // remove surrounding quotes
                    .replace(/""/g, '"')     // fix escaped quotes
                    .trim()
            )
        );
}

console.log("🔥 workoutLoader.js LOADED");

window.loadWorkout = async function loadWorkout() {
    console.log("🚀 loadWorkout started");

    const config = window.SCHOOL_CONFIG;

    if (!config) {
        console.error("❌ No SCHOOL_CONFIG");
        return;
    }

    const url = `${config.dataURL}?school=${config.key}&type=workout`;

    console.log("📡 Fetching:", url);

    const res = await fetch(url);
    const text = await res.text();

    console.log("📦 CSV received:", text.slice(0, 200));

    const rows = parseCSV(text);

   // =============================
// LOAD CONFIG VALUES (FIRST PASS)
// =============================
for (const r of rows) {

    const key = String(r[0] || "").trim().toUpperCase();

    if (key === "AUTO_START") {
        autoStartEnabled = String(r[1]).toUpperCase() === "TRUE";
    }

    if (key === "MON_TIMES") {
        monTimes = r.slice(1).filter(v => v).map(v => v.trim());
    }

    if (key === "TUE_TIMES") {
        tueTimes = r.slice(1).filter(v => v).map(v => v.trim());
    }

    if (key === "WED_TIMES") {
        wedTimes = r.slice(1).filter(v => v).map(v => v.trim());
    }

    if (key === "THUR_TIMES") {
        thurTimes = r.slice(1).filter(v => v).map(v => v.trim());
    }

    if (key === "FRI_TIMES") {
        friTimes = r.slice(1).filter(v => v).map(v => v.trim());
    }
}

// 🧪 DEBUG (optional but recommended)
console.log("📅 SCHEDULE LOADED:");
console.log("Mon:", monTimes);
console.log("Tue:", tueTimes);
console.log("Wed:", wedTimes);
console.log("Thu:", thurTimes);
console.log("Fri:", friTimes);
console.log("AutoStart:", autoStartEnabled);

// =============================
// BUILD WORKOUT DATA (SECOND PASS)
// =============================
window.workoutData.length = 0;

for (const r of rows) {

    const firstCell = String(r[0] || "")
        .replace(/"/g, "")
        .trim()
        .toLowerCase();

    // skip headers / config rows
    if (!firstCell || firstCell === "set") continue;

    // SET rows
    if (!isNaN(parseInt(firstCell))) {

        const workSec = Number(r[8]) || 30;
        const rotateSec = Number(r[9]) || 30;
        const breakSec = Number(r[10]) || 90;

        window.workoutData.push({
            type: "set",

            coreLift: r[1],
            percentage: r[2],
            coreReps: r[3],

            auxLift: r[4],
            auxReps: r[5],

            movement: r[6],
            movementReps: r[7],

            workSec,
            rotateSec,
            breakSec
        });
    }

    // BREAK rows
    if (firstCell === "break") {
        window.workoutData.push({
            type: "break",
            breakSec: Number(r[10]) || 90
        });
    }
    }

    console.log("✅ Parsed workoutData:", window.workoutData.length);
    console.log("🔥 First item:", window.workoutData[0]);
};

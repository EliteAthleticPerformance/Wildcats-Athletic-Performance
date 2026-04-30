window.workoutData.push(...)
window.workoutData.length = 0

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

    // ✅ CLEAR DATA (correct way)
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

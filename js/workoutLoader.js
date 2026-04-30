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
    workoutData.length = 0;

    console.log("📦 CSV received:", text.slice(0, 200));

        console.log("✅ loadWorkout COMPLETE");
};

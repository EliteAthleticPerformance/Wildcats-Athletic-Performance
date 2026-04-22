// ===============================
// 🔥 ELITE V5 DATA LOADER (API VERSION - CLEAN)
// ===============================

let APP_DATA = [];

/* ========================================
   MAIN LOAD FUNCTION
======================================== */

async function loadAthleteData() {
  try {

    // ✅ WAIT for config FIRST
    const config = await waitForConfig();

    if (!config || !config.dataURL) {
      throw new Error("Missing SCHOOL_CONFIG or dataURL");
    }

    const url = config.dataURL + "?t=" + Date.now(); // cache bust

    console.log("📡 Loading data from:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.length) {
      console.warn("⚠️ No data returned");
      return [];
    }

    console.log("🧪 RAW SAMPLE:", data[0]);

    APP_DATA = data
      .map(row => ({
        name: clean(row["Student-Athlete"]),
        date: clean(row["Test Date"]),

        bench: num(row["Bench Press"]),
        squat: num(row["Squat"]),
        clean: num(row["Hang Clean"]),

        vertical: num(row["Vertical Jump"]),
        broad: num(row["Broad Jump"]),
        med: num(row["Med Ball Toss"]),

        agility: num(row["Pro Agility"]),
        ten: num(row["10 Yd Dash"]),
        forty: num(row["40 Yd Dash"]),

        situps: num(row["Sit-Ups"]),

        score: num(row["Total Athletic Performance Points"])
      }))

      // ✅ CLEAN DATA (NOW IN RIGHT PLACE)
      .filter(a => {
        if (!a.name) return false;

        return (
          a.bench > 0 ||
          a.squat > 0 ||
          a.clean > 0 ||
          a.vertical > 0 ||
          a.broad > 0 ||
          a.med > 0 ||
          a.agility > 0 ||
          a.ten > 0 ||
          a.forty > 0 ||
          a.situps > 0 ||
          a.score > 0
        );
      });

    console.log("✅ DATA READY:", APP_DATA.length);

    return APP_DATA;

  } catch (err) {
    console.error("❌ Data load failed:", err);
    return [];
  }
}

/* ========================================
   HELPERS
======================================== */

function num(val) {
  if (val === null || val === undefined) return 0;

  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function clean(val) {
  if (!val) return "";
  return String(val).trim();
}

// ========================================
// 🔥 ELITE DATA LOADER (PRODUCTION READY)
// ========================================

let APP_DATA = [];

/* ========================================
   MAIN LOAD FUNCTION
======================================== */

async function loadAthleteData() {
  try {
    const config = await window.APP_READY;

    if (!config || !config.dataURL) {
      throw new Error("Missing SCHOOL_CONFIG or dataURL");
    }

    // ✅ Ensure school param is included
    const school = config.key;
    const url = `${config.dataURL}?school=${school}&t=${Date.now()}`;

    console.log("📡 Loading data from:", url);

    const res = await fetch(url);
    const raw = await res.json();

    console.log("🧪 RAW API:", raw);

    if (!Array.isArray(raw) || raw.length === 0) {
      console.warn("⚠️ No data returned from API");
      return [];
    }

    // ========================================
    // 🔁 MAP DATA (SUPPORTS BOTH FORMATS)
    // ========================================

    APP_DATA = raw.map(row => {

      // ✅ Prefer clean API keys first
      const name =
        row.name ||
        row["Student-Athlete"] ||
        "";

      const activeRaw =
        row.active ??
        row["active"] ??
        true;

      const isActive =
        activeRaw === true ||
        activeRaw === "true" ||
        activeRaw === "TRUE" ||
        activeRaw === "" ||
        activeRaw === undefined;

      return {
        id: clean(row.id || row.ID),

        active: isActive,

        // 🧍 BASIC
        name: clean(name),
        date: clean(row.date || row["Test Date"]),
        hour: clean(row.hour || row["Hour"]),
        grade: clean(row.grade || row["Grade"]),
        weight: num(row.weight || row["Actual Weight"]),
        weightClass: clean(row.weightClass || row["Weight Group"]),

        // 🏋️ STRENGTH
        bench: num(row.bench || row["Bench Press"]),
        squat: num(row.squat || row["Squat"]),
        clean: num(row.clean || row["Hang Clean"]),

        // ⚡ EXPLOSIVE
        vertical: num(row.vertical || row["Vertical Jump"]),
        broad: num(row.broad || row["Broad Jump"]),
        med: num(row.medBall || row["Med Ball Toss"]),

        // 🏃 SPEED
        agility: num(row.agility || row["Pro Agility"]),
        ten: num(row.dash10 || row["10 yd Dash"]),
        forty: num(row.dash40 || row["40 yd Dash"]),

        // 🔁 CORE
        situps: num(row.situps || row["Sit-Ups"]),

        // 📊 SCORES
        strengthPoints: num(row.strengthPoints || row["Strength Score"]),
        speedPoints: num(row.speedPoints || row["Speed Score"]),
        explosivePoints: num(row.explosivePoints || row["Explosive Score"]),
        powerPoints: num(row.powerPoints || row["Power Score"]),

        // 🏆 TOTAL
        score:
          num(row.total || row["Total Athletic Performance Points"]) ||
          num(row["3 Lift Projected Max Total"]) ||
          (
            num(row.bench || row["Bench Press"]) +
            num(row.squat || row["Squat"]) +
            num(row.clean || row["Hang Clean"])
          )
      };
    })

    // ========================================
    // ✅ FINAL FILTER (CRITICAL FIX)
    // ========================================

    .filter(a =>
      a.name &&
      a.name.trim() !== "" &&
      a.active
    );

    console.log("🔥 CLEAN DATA:", APP_DATA);
    console.log("✅ ATHLETES LOADED:", APP_DATA.length);

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
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function clean(val) {
  if (!val) return "";
  return String(val).trim();
}

// 🔥 ELITE V7 DATA LOADER (PRODUCTION HARDENED)
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

    // ✅ SAFE HEADER MAP (bulletproof)
    const firstValidRow = data.find(r => Object.keys(r).length > 0);
    const keyMap = buildKeyMap(firstValidRow || {});

    APP_DATA = data
      .map(row => ({

        // ===============================
        // 🧍 BASIC INFO
        // ===============================
        name: clean(row["Student-Athlete"]),
        date: clean(row["Test Date"]),
        name: clean(row[keyMap.studentathlete]).replace(/\s+/g, " "),
        date: clean(row[keyMap.testdate]),

        hour: clean(row["Hour"]),
        grade: clean(row["Grade"]),
        weight: num(row["Actual Weight"]),
        weightClass: clean(row["Weight Group"]),
        hour: clean(row[keyMap.hour]),
        grade: clean(row[keyMap.grade]),
        weight: num(row[keyMap.actualweight]),
        weightClass: clean(row[keyMap.weightgroup]),

        // ===============================
        // 🏋️ STRENGTH
        // ===============================
        bench: num(row["Bench Press"]),
        squat: num(row["Squat"]),
        clean: num(row["Hang Clean"]),
        bench: num(row[keyMap.benchpress]),
        squat: num(row[keyMap.squat]),
        clean: num(row[keyMap.hangclean]),

        // ===============================
        // ⚡ EXPLOSIVE / POWER
        // ===============================
        vertical: num(row["Vertical Jump"]),
        broad: num(row["Broad Jump"]),
        med: num(row["Med Ball Toss"]),
        vertical: num(row[keyMap.verticaljump]),
        broad: num(row[keyMap.broadjump]),
        med: num(row[keyMap.medballtoss]),

        // ===============================
        // 🏃 SPEED / AGILITY
        // ===============================
        agility: num(row["Pro Agility"]),
        ten: num(row["10 Yd Dash"]),
        forty: num(row["40 Yd Dash"]),
        agility: num(row[keyMap.proagility]),
        ten: num(row[keyMap["10yddash"]]),
        forty: num(row[keyMap["40yddash"]]),

        // ===============================
        // 🔁 CORE
        // ===============================
        situps: num(row["Sit-Ups"]),
        situps: num(row[keyMap.situps]),

        // ===============================
        // 📊 SCORE
        // 📊 SCORE (SMART FALLBACK)
        // ===============================
        score:
  num(row["Total Athletic Performance Points"]) ||
  num(row["3 Lift Projected Max Total"]) ||
  (
    num(row["Bench Press"]) +
    num(row["Squat"]) +
    num(row["Hang Clean"])
  )
          num(row[keyMap.totalathleticperformancepoints]) ||
          num(row[keyMap["3liftprojectedmaxtotal"]]) ||
          (
            num(row[keyMap.benchpress]) +
            num(row[keyMap.squat]) +
            num(row[keyMap.hangclean])
          )
      }))

      // ========================================
      // ✅ CLEAN DATA
      // ========================================
      .filter(a => {

        if (!a.name) return false;

        const hasData =
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
          a.score > 0;

        return hasData;
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
   🔥 KEY NORMALIZATION SYSTEM
======================================== */

function normalizeKey(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // remove spaces, symbols, line breaks
}

function buildKeyMap(sampleRow) {
  const map = {};

  Object.keys(sampleRow).forEach(key => {
    map[normalizeKey(key)] = key;
  });

  return map;
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

// ========================================
// 🔥 ELITE V9 DATA LOADER (CACHED + BULLETPROOF)
// ========================================

let APP_DATA = null;

/* ========================================
   MAIN LOAD FUNCTION
======================================== */

async function loadAthleteData(forceRefresh = false) {
  try {
    // ✅ RETURN CACHE (BIG PERFORMANCE WIN)
    if (APP_DATA && !forceRefresh) {
      return APP_DATA;
    }

    const config = await window.APP_READY;

    if (!config || !config.dataURL) {
      throw new Error("Missing SCHOOL_CONFIG or dataURL");
    }

    const url = config.dataURL + "?t=" + Date.now();

    console.log("📡 Loading data from:", url);

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Network response failed");
    }

    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      console.warn("⚠️ No data returned");
      APP_DATA = [];
      return APP_DATA;
    }

    console.log("🧪 RAW SAMPLE:", data[0]);

    // ========================================
    // 🔥 HEADER MAP (SAFE + DEBUG)
    // ========================================

    const firstValidRow = data.find(r => Object.keys(r).length > 0) || {};
    const keyMap = buildKeyMap(firstValidRow);

    // 🔍 DEBUG MISSING KEYS
    checkKey(keyMap, "studentathlete");
    checkKey(keyMap, "testdate");

    APP_DATA = data
      .map(row => ({

        // 🧍 BASIC
        name: clean(row[keyMap.studentathlete]).replace(/\s+/g, " "),
        date: clean(row[keyMap.testdate]),

        hour: clean(row[keyMap.hour]),
        grade: clean(row[keyMap.grade]),
        weight: num(row[keyMap.actualweight]),
        weightClass: clean(row[keyMap.weightgroup]),

        // 🏋️ STRENGTH
        bench: num(row[keyMap.benchpress]),
        squat: num(row[keyMap.squat]),
        clean: num(row[keyMap.hangclean]),

        // ⚡ POWER
        vertical: num(row[keyMap.verticaljump]),
        broad: num(row[keyMap.broadjump]),
        med: num(row[keyMap.medballtoss]),

        // 🏃 SPEED
        agility: num(row[keyMap.proagility]),
        ten: num(row[keyMap["10yddash"]]),
        forty: num(row[keyMap["40yddash"]]),

        // 🔁 CORE
        situps: num(row[keyMap.situps]),

        // 📊 SCORE
        score:
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
      .filter(a =>
        a.name &&
        (
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
        )
      );

    console.log("✅ DATA READY:", APP_DATA.length);

    return APP_DATA;

  } catch (err) {
    console.error("❌ Data load failed:", err);
    APP_DATA = [];
    return APP_DATA;
  }
}

/* ========================================
   🔥 KEY NORMALIZATION
======================================== */

function normalizeKey(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildKeyMap(sampleRow) {
  const map = {};

  Object.keys(sampleRow).forEach(key => {
    map[normalizeKey(key)] = key;
  });

  return map;
}

/* ========================================
   🔍 DEBUG KEY CHECK (NEW)
======================================== */

function checkKey(map, key) {
  if (!map[key]) {
    console.warn(`⚠️ Missing column: ${key}`);
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

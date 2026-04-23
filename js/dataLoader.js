// ========================================
// 🔥 ELITE V11 DATA LOADER (WITH CATEGORY POINTS)
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

    const url = config.dataURL + "?t=" + Date.now();

    console.log("📡 Loading data from:", url);

    const res = await fetch(url);
    const raw = await res.json();

    if (!Array.isArray(raw) || !raw.length) {
      console.warn("⚠️ No data returned from API");
      return [];
    }

    console.log("🧪 RAW SAMPLE:", raw[0]);

    const keyMap = buildKeyMap(raw[0]);

    APP_DATA = raw.map(row => {

      // 🔑 SAFE ACCESSOR
      const get = (...keys) => {
        for (let k of keys) {
          const mapped = keyMap[normalizeKey(k)];
          if (mapped && row[mapped] !== undefined) {
            return row[mapped];
          }
        }
        return "";
      };

      return {

        // 🧍 BASIC
        name: clean(get("studentathlete", "student athlete", "name")),
        date: clean(get("testdate", "test date", "date")),

        hour: clean(get("hour")),
        grade: clean(get("grade")),
        weight: num(get("actualweight", "weight")),
        weightClass: clean(get("weightgroup", "group")),

        // 🏋️ STRENGTH
        bench: num(get("benchpress", "bench")),
        squat: num(get("squat")),
        clean: num(get("hangclean", "clean")),

        // ⚡ EXPLOSIVE / POWER
        vertical: num(get("verticaljump", "vertical")),
        broad: num(get("broadjump", "broad")),
        med: num(get("medballtoss", "medball", "med")),

        // 🏃 SPEED
        agility: num(get("proagility", "agility")),
        ten: num(get("10yddash", "10yd", "10")),
        forty: num(get("40yddash", "40yd", "40")),

        // 🔁 CORE
        situps: num(get("situps", "sit-ups", "sit ups")),

        // 🔥 CATEGORY POINTS (FROM GOOGLE SHEET)
        // 🔥 CATEGORY SCORES (MATCHES YOUR SHEET EXACTLY)
strengthPoints: num(get(
  "strengthscore",
  "strength score"
)),

speedPoints: num(get(
  "speedscore",
  "speed score"
)),

explosivePoints: num(get(
  "explosivescore",
  "explosive score"
)),

powerPoints: num(get(
  "powerscore",
  "power score"
)),

        // 📊 TOTAL SCORE (PRIMARY SYSTEM)
        score:
          num(get("totalathleticperformancepoints", "score")) ||
          num(get("3liftprojectedmaxtotal")) ||
          (
            num(get("benchpress", "bench")) +
            num(get("squat")) +
            num(get("hangclean", "clean"))
          )
      };
    })

    // ========================================
    // ✅ FINAL CLEAN FILTER
    // ========================================
    .filter(a =>
      a.name &&
      (
        a.score > 0 ||
        a.strengthPoints > 0 ||
        a.speedPoints > 0 ||
        a.explosivePoints > 0 ||
        a.powerPoints > 0
      )
    );

    console.log("✅ DATA READY:", APP_DATA.length);
    return APP_DATA;

  } catch (err) {
    console.error("❌ Data load failed:", err);
    return [];
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


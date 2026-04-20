// ===============================
// GLOBAL DATA LOADER (CSV → JSON)
// ===============================

async function loadCSV(url) {
  const response = await fetch(url);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });

  return parsed.data;
}

// ===============================
// SCHOOL DB (🔥 CACHE THIS)
// ===============================
const SCHOOL_DB_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJVxlKWqu-JbdJp9S0_lNzbetCfbhXGSgny11mq7uKYUJh-PdB0zQGonz56iA0tjJtJrMu2EF2Xoa/pub?gid=0&single=true&output=csv";

let SCHOOL_DB_CACHE = null;

async function getSchoolDB() {
  if (SCHOOL_DB_CACHE) return SCHOOL_DB_CACHE;

  const data = await loadCSV(SCHOOL_DB_URL);
  SCHOOL_DB_CACHE = data;
  return data;
}

// ===============================
// GET CURRENT SCHOOL KEY
// ===============================
function getCurrentSchool() {
  return (sessionStorage.getItem("school") || "harrisonville")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// ===============================
// GET SCHOOL ROW (🔥 CORE)
// ===============================
async function getSchoolRow() {
  const school = getCurrentSchool();
  const schools = await getSchoolDB();

  const match = schools.find(s =>
    (s.school || "")
      .toLowerCase()
      .replace(/\s+/g, "") === school
  );

  if (!match) {
    console.error("❌ School not found:", school);
    return null;
  }

  return match;
}

// ===============================
// GET DATA URL
// ===============================
async function getSchoolDataURL() {
  const row = await getSchoolRow();

  if (!row || !row.dataURL) {
    console.error("❌ No dataURL found");
    return null;
  }

  return row.dataURL + "&t=" + Date.now(); // cache-buster
}

// ===============================
// GET SUBMIT URL (🔥 NEW)
// ===============================
async function getSchoolSubmitURL() {
  const row = await getSchoolRow();

  if (!row || !row.submitURL) {
    console.error("❌ No submitURL found");
    return null;
  }

  return row.submitURL;
}

// ===============================
// CENTRALIZED DATA ACCESS
// ===============================
let APP_DATA = [];

async function loadAthleteData() {

  const url = await getSchoolDataURL();

  if (!url) {
    console.error("❌ Data URL missing");
    return [];
  }

  const raw = await loadCSV(url);

  APP_DATA = raw.map(row => ({
    name: (row["Student-Athlete"] || "").trim(),
    date: (row["Test Date"] || "").trim(),

    bench: Number(row["Bench Press"]) || 0,
    squat: Number(row["Squat"]) || 0,
    clean: Number(row["Hang Clean"]) || 0,

    vertical: Number(row["Vertical Jump"]) || 0,
    broad: Number(row["Broad Jump"]) || 0,
    med: Number(row["Med Ball Toss"]) || 0,

    agility: Number(row["Pro Agility"]) || 0,
    ten: Number(row["10 yd"]) || 0,
    forty: Number(row["40 yd"]) || 0,

    situps: Number(row["Sit-Ups"]) || 0,

    score: Number(
      row["Total Athletic Performance Points"] ||
      row["Total Athletic Performance"] ||
      row["Score"]
    ) || 0
  }))
  .filter(row => {
    if (!row.name) return false;

    const rowString = JSON.stringify(row);

    return (
      !rowString.includes("#REF") &&
      !rowString.includes("NaN") &&
      !rowString.includes("Invalid") &&

      (
        row.bench > 0 ||
        row.squat > 0 ||
        row.clean > 0 ||
        row.vertical > 0 ||
        row.broad > 0 ||
        row.med > 0 ||
        row.agility > 0 ||
        row.ten > 0 ||
        row.forty > 0 ||
        row.situps > 0 ||
        row.score > 0
      )
    );
  });

  console.log(`✅ DATA READY (${APP_DATA.length}) →`, url);

  return APP_DATA;
}

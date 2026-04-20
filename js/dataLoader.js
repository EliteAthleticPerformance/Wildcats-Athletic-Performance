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

// 🔥 CENTRALIZED DATA ACCESS
let APP_DATA = [];

async function loadAthleteData() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv&t=" + Date.now();

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

  console.log("✅ DATA READY:", APP_DATA.length);

  return APP_DATA;
}

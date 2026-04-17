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
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

  const raw = await loadCSV(url);

  APP_DATA = raw.map(row => ({
    ...row,
    name: row.name?.trim(),
    date: row.date?.trim()
  }));

  console.log("✅ DATA READY:", APP_DATA.length);

  return APP_DATA;
}

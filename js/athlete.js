let athletes = [];
let currentLetter = "ALL";

/* ---------- LOAD DATA ---------- */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

Papa.parse(CSV_URL + "&t=" + Date.now(), {
  download: true,
  header: true, // ✅ FIXED
  skipEmptyLines: true,
  dynamicTyping: true,

  complete: function(results) {

    const data = results.data;
    const map = {};

    console.log("🧪 RAW SAMPLE:", data[0]); // 🔥 DEBUG

    data.forEach(row => {
      const name = (row["Student-Athlete"] || "").trim();

      const score = Number(
        row["Total Athletic Performance Points"] ??
        row["Total Athletic Performance"] ??
        row["Score"]
      ) || 0;

      if (!name) return;

      // keep best score per athlete
      if (!map[name] || score > map[name]) {
        map[name] = score;
      }
    });

    athletes = Object.keys(map).map(name => ({
      name,
      score: map[name]
    }));

    athletes.sort((a, b) => b.score - a.score);

    console.log("✅ CLEAN ATHLETES:", athletes.slice(0, 5)); // debug

    renderAlphabet();
    render(athletes);
  }
});

document.addEventListener("DOMContentLoaded", () => {

    function getColor(score) {
    if (score >= 90) return "#00E676";   // Elite
    if (score >= 75) return "#FFD54F";   // Average
    return "#FF5252";                    // Needs Work
}

function set(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!value) {
        el.innerText = "-";
        return;
    }

    function goToEnterTest() {
    const unlocked = sessionStorage.getItem("coachAccess");

    // already unlocked → go straight in
    if (unlocked === "true") {
        window.location.href = "enter.html";
        return;
    }

    // ask for password
    const password = prompt("Enter coach password:");

    if (password === "coach123") {
        sessionStorage.setItem("coachAccess", "true");
        window.location.href = "enter.html";
    } else {
        alert("Incorrect password");
    }
}

    // Extract number for coloring
    const num = parseFloat(value);

    el.innerText = value;

    if (!isNaN(num)) {
        const clamped = Math.min(100, num);
        el.style.color = getColor(clamped);
    }
}

    const params = new URLSearchParams(window.location.search);
const athleteName = decodeURIComponent(params.get("name") || "");

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

    const STORAGE_KEY = "wildcatsData";

    // =====================
    // CSV PARSER
    // =====================

    function parseCSV(text) {
        return text.trim().split(/\r?\n/).map(row => {
            const cols = [];
            let current = '';
            let insideQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];

                if (char === '"' && row[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    cols.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }

            cols.push(current);
            return cols;
        });
    }

    // =====================
    // FETCH + CACHE
    // =====================
    function loadData() {
        fetch(SHEET_URL)
        .then(res => res.text())
        .then(csv => {
            const rows = parseCSV(csv);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
            processData(rows);
            
            console.log("FETCH SUCCESS");
        })
        .catch(() => {
            console.warn("Offline mode");

            const cached = localStorage.getItem(STORAGE_KEY);

            if (cached) {
                processData(JSON.parse(cached));
            } else {
                document.getElementById("athleteName").innerText = "No data available";
            }
        });
    }

    loadData();
    setInterval(loadData, 60000);

    // =====================
    // PROCESS DATA
    // =====================
    function processData(rows) {

    const headers = rows[0].map(h => h.toLowerCase().trim());

    // ✅ ADD IT RIGHT HERE
    console.log(headers.map((h, i) => i + ": " + h));

    const dataRows = rows.slice(1);
    

   const idx = {
    name: 0,
    date: 1,
    weight: 4,

   benchPts: 8,
squatPts: 11,
cleanPts: 14,

verticalPts: 16,
broadPts: 18,
medballPts: 20,

agilityPts: 22,
situpsPts: 24,
tenPts: 26,
fortyPts: 28,

    total: 29,
    score: 30
};

    const toNumber = (val) => {
        if (!val) return 0;
        const num = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
        return isNaN(num) ? 0 : num;
    };

    const data = dataRows.map(row => {

        return {
            name: row[idx.name]?.trim(),
            date: row[idx.date] || "",
            weight: toNumber(row[idx.weight]),

            

             // 🔥 ADD THIS BLOCK RIGHT HERE
        benchPts: toNumber(row[idx.benchPts]),
        squatPts: toNumber(row[idx.squatPts]),
        cleanPts: toNumber(row[idx.cleanPts]),

        verticalPts: toNumber(row[idx.verticalPts]),
        broadPts: toNumber(row[idx.broadPts]),
        medballPts: toNumber(row[idx.medballPts]),

        agilityPts: toNumber(row[idx.agilityPts]),
        situpsPts: toNumber(row[idx.situpsPts]),
        tenPts: toNumber(row[idx.tenPts]),
        fortyPts: toNumber(row[idx.fortyPts])
        };

    }).filter(a => a.name);

    renderAthlete(data);

}


 

    // =====================
    // RENDER
    // =====================
    function renderAthlete(data) {

       const normalize = (str) =>
    (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const athleteData = data.filter(a =>
    normalize(a.name).includes(normalize(athleteName))
);

        if (!athleteData.length) {
            document.getElementById("athleteName").innerText = "Athlete not found";
            return;
        }

        const latest = [...athleteData].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        const hasData =
    latest.benchPts ||
    latest.squatPts ||
    latest.cleanPts ||
    latest.verticalPts ||
    latest.tenPts;

    // =====================
// 📈 TREND LOGIC (ADD HERE)
// =====================

// previous test (2nd most recent)
const prev = [...athleteData]
    .sort((a,b)=>new Date(b.date)-new Date(a.date))[1];

function getChange(current, previous) {
    if (!previous) return "";
    const diff = current - previous;

    if (diff > 0) return ` ↑ +${diff}`;
    if (diff < 0) return ` ↓ ${diff}`;
    return "";
}


        // =====================
// 📊 TEAM AVERAGES
// =====================

// Get all athletes (latest test only per athlete)
const grouped = {};

data.forEach(a => {
    if (!grouped[a.name]) grouped[a.name] = [];
    grouped[a.name].push(a);
});

const latestPerAthlete = Object.values(grouped).map(arr =>
    arr.sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
);

// =====================
// 🏆 RANKING (ADD HERE)
// =====================

const allLatest = [...latestPerAthlete].sort((a,b) =>
    (
        (b.verticalPts + b.broadPts + b.medballPts +
         b.agilityPts + b.situpsPts + b.tenPts + b.fortyPts) / 7
    ) -
    (
        (a.verticalPts + a.broadPts + a.medballPts +
         a.agilityPts + a.situpsPts + a.tenPts + a.fortyPts) / 7
    )
);

const rank = allLatest.findIndex(a => a.name === latest.name) + 1;

const totalAthletes = allLatest.length;

const percentile = Math.round(
    (1 - (rank - 1) / totalAthletes) * 100
);


// Calculate averages
const avg = {
    strength: 0,
    explosive: 0,
    speed: 0,
    conditioning: 0
};

latestPerAthlete.forEach(a => {
    avg.strength += (a.benchPts + a.squatPts + a.cleanPts) / 3;
    avg.explosive += (a.verticalPts + a.broadPts + a.medballPts) / 3;
    avg.speed += (a.tenPts + a.fortyPts + a.agilityPts) / 3;
    avg.conditioning += a.situpsPts;
});

const count = latestPerAthlete.length || 1;

avg.strength /= count;
avg.explosive /= count;
avg.speed /= count;
avg.conditioning /= count;



// =====================
// 📋 FULL TEST HISTORY TABLE
// =====================
const historyTable = document.querySelector("#historyTable tbody");

if (historyTable) {

    historyTable.innerHTML = "";

    // Sort by date (newest first)
    const sorted = [...athleteData].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    sorted.forEach(a => {

        const row = `
            <tr>
               <td>${a.date ? new Date(a.date).toLocaleDateString() : "-"}</td>
<td>${a.benchPts || "-"}</td>
<td>${a.squatPts || "-"}</td>
<td>${a.cleanPts || "-"}</td>
<td>${
    Math.round(
        (a.benchPts + a.squatPts + a.cleanPts) / 3
    )
}</td>
<td>${a.verticalPts || "-"}</td>
<td>${a.broadPts || "-"}</td>
<td>${a.medballPts || "-"}</td>
<td>${a.agilityPts || "-"}</td>
<td>${a.situpsPts || "-"}</td>
<td>${a.tenPts || "-"}</td>
<td>${a.fortyPts || "-"}</td>
<td>${
    Math.round(
        (
            a.verticalPts +
            a.broadPts +
            a.medballPts +
            a.agilityPts +
            a.situpsPts +
            a.tenPts +
            a.fortyPts
        ) / 7
    )
}</td>
            </tr>
        `;

        historyTable.innerHTML += row;
    });
}

        // SET VALUES
        const nameEl = document.getElementById("athleteName");
if (nameEl) {
    nameEl.innerText = latest.name;
}
const benchChange = getChange(latest.benchPts, prev?.benchPts);
set("bench", `${latest.benchPts}${benchChange}`);

const squatChange = getChange(latest.squatPts, prev?.squatPts);
set("squat", `${latest.squatPts}${squatChange}`);

const cleanChange = getChange(latest.cleanPts, prev?.cleanPts);
set("clean", `${latest.cleanPts}${cleanChange}`);

const verticalChange = getChange(latest.verticalPts, prev?.verticalPts);
set("verticalScore", `${latest.verticalPts}${verticalChange}`);

const broadChange = getChange(latest.broadPts, prev?.broadPts);
set("broadScore", `${latest.broadPts}${broadChange}`);

const medballChange = getChange(latest.medballPts, prev?.medballPts);
set("medballScore", `${latest.medballPts}${medballChange}`);

const agilityChange = getChange(latest.agilityPts, prev?.agilityPts);
set("proagility", `${latest.agilityPts}${agilityChange}`);

const situpsChange = getChange(latest.situpsPts, prev?.situpsPts);
set("situps", `${latest.situpsPts}${situpsChange}`);

const tenChange = getChange(latest.tenPts, prev?.tenPts);
set("tenyard", `${latest.tenPts}${tenChange}`);

const fortyChange = getChange(latest.fortyPts, prev?.fortyPts);
set("forty", `${latest.fortyPts}${fortyChange}`);


set("total",


    hasData
        ? Math.round(
            (latest.benchPts + latest.squatPts + latest.cleanPts) / 3
        )
        : "-"
);

const perf = hasData
    ? Math.min(100, Math.round(
        (
            latest.verticalPts +
            latest.broadPts +
            latest.medballPts +
            latest.agilityPts +
            latest.situpsPts +
            latest.tenPts +
            latest.fortyPts
        ) / 7
    ))
    : "-";

set("performance", perf);

set("rank", `#${rank} / ${totalAthletes}`);

const percentileEl = document.getElementById("percentile");

if (percentileEl) {
    percentileEl.innerText = `Top ${percentile}%`;
    percentileEl.style.opacity = "0.8";
    percentileEl.style.fontSize = "13px";
}



// =====================
// 🧠 CATEGORY INSIGHTS (FIXED)
// =====================

// 1. Build categories
const categories = {
    Strength: Math.round((latest.benchPts + latest.squatPts + latest.cleanPts) / 3),
    Explosive: Math.round((latest.verticalPts + latest.broadPts + latest.medballPts) / 3),
    Speed: Math.round((latest.tenPts + latest.fortyPts + latest.agilityPts) / 3),
    Conditioning: Math.round(latest.situpsPts)
};

// 2. Sort
const sortedCats = Object.entries(categories).sort((a,b)=>b[1]-a[1]);

// 3. Get top + lowest
const topCat = sortedCats[0];
const lowCat = sortedCats[sortedCats.length - 1];

// 4. Render (LAST STEP)
const insightsEl = document.getElementById("insights");

if (insightsEl) {
    insightsEl.innerHTML = "";
}


if (!hasData) {
    const nameEl = document.getElementById("athleteName");
    if (nameEl) {
        nameEl.innerHTML +=
            ' <span style="color:#FF5252;font-size:16px;">(No Data)</span>';
    }
}



        // =====================
        // 📊 BAR CHART
        // =====================
        const chartEl = document.getElementById("progressChart");

        if (hasData && chartEl && typeof Chart !== "undefined") {

            if (window.athleteChart && typeof window.athleteChart.destroy === "function") {
                window.athleteChart.destroy();
            }

            const sorted = [...athleteData].sort(
                (a, b) => new Date(a.date) - new Date(b.date)
            );

            window.athleteChart = new Chart(chartEl, {
                type: "bar",
                data: {
                    labels: sorted.map(a =>
                        a.date ? new Date(a.date).toLocaleDateString() : ""
                    ),
                   
                   
                    datasets: [
    {
        label: "Strength Score",
        data: sorted.map(a =>
            Math.round(
                (a.benchPts + a.squatPts + a.cleanPts) / 3
            )
        ),
        backgroundColor: "rgba(33,150,243,0.8)",
        borderRadius: 6
    },
    {
    label: "Performance Score",
    data: sorted.map(a =>
    Math.round(
        (
            a.verticalPts +
            a.broadPts +
            a.medballPts +
            a.agilityPts +
            a.situpsPts +
            a.tenPts +
            a.fortyPts
        ) / 7
    )
),
    backgroundColor: "rgba(192,192,192,0.85)",
    borderRadius: 6
}
]
                },
                options: {
                    plugins: { legend: { labels: { color: "#fff" } } },
                    scales: {
                        x: { ticks: { color: "#fff" } },
                        y: { ticks: { color: "#fff" }, beginAtZero: true }
                    }
                }
            });
        }

        console.log("SPEED VALUES:", latest.tenPts, latest.fortyPts);


        const clamp = (v) => Math.max(0, Math.min(100, v));

     // =====================
// 🕸️ RADAR CHART
// =====================

const radarEl = document.getElementById("radarChart");

if (hasData && radarEl && typeof Chart !== "undefined") {

    if (window.radarChart && typeof window.radarChart.destroy === "function") {
        window.radarChart.destroy();
    }

    const strength = (
    latest.benchPts +
    latest.squatPts +
    latest.cleanPts
) / 3;

const explosive = (
    latest.verticalPts +
    latest.broadPts +
    latest.medballPts
) / 3;

const speed = (
    latest.tenPts +
    latest.fortyPts +
    latest.agilityPts
) / 3;

const conditioning = (
    latest.situpsPts
);

    window.radarChart = new Chart(radarEl, {
        type: "radar",
        data: {
            labels: ["Strength", "Explosive", "Speed", "Conditioning"],
            datasets: [
{
    label: latest.name,
    data: [
        clamp(Math.round(strength)),
        clamp(Math.round(explosive)),
        clamp(Math.round(speed)),
        clamp(Math.round(conditioning))
    ],
    backgroundColor: "rgba(0,188,212,0.2)",
    borderColor: "#00BCD4",
    borderWidth: 2
},
{
    label: "Team Avg",
    data: [
        clamp(Math.round(avg.strength)),
        clamp(Math.round(avg.explosive)),
        clamp(Math.round(avg.speed)),
        clamp(Math.round(avg.conditioning))
    ],
    borderColor: "#FFD54F",
    borderWidth: 2,
    borderDash: [6,6],
    fill: false
}
]
        },
       options: {
    scales: {
        r: {
            min: 0,
            max: 100, // 🔥 ADD THIS
            ticks: { color: "#fff" },
            grid: { color: "rgba(255,255,255,0.2)" },
            angleLines: { color: "rgba(255,255,255,0.2)" },
            pointLabels: { color: "#fff" }
        }
    },
    plugins: {
        legend: { labels: { color: "#fff" } }
    }
}
    });

    

    console.log({
    strength,
    explosive,
    speed,
    conditioning
});

}
    }
  
});
/* -----------------------------
TABLE SORT FUNCTION
----------------------------- */

const format = (val) => {
    if (!val || val === 0) return "-";
    return Math.round(val);
};


function sortTable(colIndex){

const table = document.getElementById("testingTable");
const tbody = table.querySelector("tbody");

const rows = Array.from(tbody.querySelectorAll("tr"));

const ascending =
table.dataset.sortCol == colIndex && table.dataset.sortDir === "asc"
? false
: true;

rows.sort((a,b)=>{

let A = a.children[colIndex].innerText.trim();
let B = b.children[colIndex].innerText.trim();

const numA = parseFloat(A);
const numB = parseFloat(B);

if(!isNaN(numA) && !isNaN(numB)){
return ascending ? numA - numB : numB - numA;
}

return ascending ? A.localeCompare(B) : B.localeCompare(A);

});

tbody.innerHTML = "";
rows.forEach(r => tbody.appendChild(r));

table.dataset.sortCol = colIndex;
table.dataset.sortDir = ascending ? "asc" : "desc";
}

/* -----------------------------
GOOGLE SHEET DATA LOAD
----------------------------- */

const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS81ri1sMtpBVl605PVV_Te2WdA3hVohdXIb1Lc22CrUJSdzXUzGa-0Z0THGtlSa9WVaa77owi-_BAR/pub?output=csv";

document.addEventListener("DOMContentLoaded", function () {

fetch(sheetURL)
.then(res => res.text())
.then(data => {

/* -----------------------------
SAFE CSV PARSER
----------------------------- */

function parseCSV(text) {
const rows = [];
let current = '';
let insideQuotes = false;
let row = [];

for (let char of text) {

if (char === '"') insideQuotes = !insideQuotes;

else if (char === ',' && !insideQuotes) {
row.push(current);
current = '';
}

else if (char === '\n' && !insideQuotes) {
row.push(current);
rows.push(row);
row = [];
current = '';
}

else {
current += char;
}
}

if (current) {
row.push(current);
rows.push(row);
}

return rows;
}

const parsed = parseCSV(data);

// 🔥 GET HEADERS (CRITICAL FIX)
const headers = parsed.shift().map(h => h.trim());

function getIndex(name){
return headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
}

/* -----------------------------
SAFE NUMBER CLEANER
----------------------------- */

function cleanNumber(val){
if(!val) return 0;

val = val.replace(/"/g,"").trim();

if(val === "#DIV/0!" || val === "") return 0;

return parseFloat(val) || 0;
}

/* -----------------------------
TABLE BUILD
----------------------------- */

const tableBody = document.querySelector("#testingTable tbody");
const athletes = [];

parsed.forEach(cols => {

if(!cols || !cols.length) return;

/* ---------- DATA (DYNAMIC MAPPING) ---------- */

const name = (cols[getIndex("student")] || "").replace(",", ", ");
if (!name || name.trim() === "") return;
const rawDate = cols[getIndex("date")] || "";
const score = cleanNumber(cols[getIndex("score")]);

let testDate = "";

if(rawDate){
const d = new Date(rawDate);
const month = d.toLocaleString("default",{month:"long"});
const year = d.getFullYear();
testDate = `${year}, ${month}`;
}

const hour = cleanNumber(cols[getIndex("hour")]);
const grade = cleanNumber(cols[getIndex("grade")]);
const weight = cleanNumber(cols[getIndex("actual weight")]);
const group = cols[getIndex("weight group")] || "";

const bench = cleanNumber(cols[getIndex("bench")]);
const squat = cleanNumber(cols[getIndex("squat")]);
const clean = cleanNumber(cols[getIndex("clean")]);
const vertical = cleanNumber(cols[getIndex("vertical")]);

const broad = cleanNumber(cols[getIndex("broad")]);
const med = cleanNumber(cols[getIndex("med")]);
const agility = cleanNumber(cols[getIndex("agility")]);
const situps = cleanNumber(cols[getIndex("sit")]);
const ten = cleanNumber(cols[getIndex("10")]);
const forty = cleanNumber(cols[getIndex("40")]);

/* ---------- CALCULATIONS ---------- */

const total = bench + squat + clean;
const points = total + vertical;
const strengthScore = weight ? (total / weight).toFixed(2) : 0;

/* ---------- TABLE ROW ---------- */

const tr = document.createElement("tr");

tr.innerHTML = `

<td>${name}</td>
<td>${testDate}</td>
<td>${hour}</td>
<td>${grade}</td>
<td>${format(weight)}</td>
<td>${group}</td>
<td>${format(bench)}</td>
<td>${format(squat)}</td>
<td>${format(clean)}</td>
<td>${format(vertical)}</td>
<td>${broad || "-"}</td>
<td>${med || "-"}</td>
<td>${agility || "-"}</td>
<td>${format(situps) || "-"}</td>
<td>${ten || "-"}</td>
<td>${forty || "-"}</td>
<td>${format(score)}</td>
`;

tableBody.appendChild(tr);

/* ---------- SAVE FOR LEADERBOARD ---------- */

athletes.push({
name,
weight,
group,
bench,
squat,
clean,
vertical,
total,
points,
strengthScore,
score
});

});

/* ---------- SAVE TO LOCAL STORAGE ---------- */

localStorage.setItem("athleteScores", JSON.stringify(athletes));

})
.catch(err => console.error("Sheet load error:", err));

/* -----------------------------
SEARCH (NAME ONLY)
----------------------------- */

const input = document.getElementById("searchInput");

if(input){
input.addEventListener("keyup", function(){

const filter = input.value.toLowerCase();
const rows = document.querySelectorAll("#testingTable tbody tr");

rows.forEach(row=>{

const nameCell = row.children[0];
if(!nameCell) return;

const name = nameCell.textContent.toLowerCase();

row.style.display = name.includes(filter) ? "" : "none";

});

});
}

});

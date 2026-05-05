
console.log("🔥 MAIN.JS LOADED"); 
  console.log("STEP 1");

   
/* ===================== STATE ===================== */
console.log("STEP 2");
let timer = null;
let timeLeft = 0;
let totalSeconds = 0;
let originalTotalSeconds = 0;
let isRunning = false;
let currentPhase = "idle";
let audioCtx = null;
let lastCountdownSpoken = null;
let phaseJustChanged = false;
let nextTickTime = null;
let workoutData = [];

/* ✅ safer global access (no desync risk) */
Object.defineProperty(window, "workoutData", {
    get: () => workoutData
});

/* ===================== SETS ===================== */

let currentSet = 1;
let maxSets = 1;
let rotationCount = 0;
const maxRotations = 4;



/* ===================== PERIOD AUTO START ===================== */

let autoStartEnabled = true;
let monTimes = [];
let tueTimes = [];
let wedTimes = [];
let thurTimes = [];
let friTimes = [];
let autoStartTimer = null;
let lastAutoStartMinute = null;
let todayOnlyMode = false;
let forceDateString = null;
let sheetWorkDuration = null;
let sheetRotateDuration = null;
let manualWorkoutOverride = null;


/* ===================== DURATIONS ===================== */


let classBlockLength = 45 * 60;
let dressOutDuration = [];
let dynamicStretchDuration = [];
let breakDuration = [];
let cooldownDuration = [];

/* ===================== FLAGS ===================== */

let dressWarningSpoken = false;
let onBreak = false;
let selectedVoice = null;
let displaySetNumber = 1;

function goFullscreen() {
    document.documentElement.requestFullscreen();
}

/* ======================================================
   START / STOP + TOTAL TIME CALCULATION
====================================================== */

/* ---------- COUNT TOTAL SETS ---------- */
function getTotalSets() {
    return window.workoutData.filter(item => item.type === "set").length;
}

/* ======================================================
   RESET STATE (NEW - SAFE INITIALIZATION)
====================================================== */

function resetWorkoutState() {
    displaySetNumber = 1;
    rotationCount = 0;
    currentSet = 1;
}

/* ======================================================
   CALCULATE TOTAL CLASS TIME
====================================================== */
function calculateTotalTime() {

    if (!workoutData.length) {
        console.warn("Workout still loading...");
        return;
    }

    const work = parseInt(document.getElementById("workTime").value, 10) || 0;
    const rest = parseInt(document.getElementById("restTime").value, 10) || 0;

    let prepTotal = 0;
    let workoutTotal = 0;
    let breakTotal = 0;

    /* ---------- PREP ---------- */
    prepTotal += Number(dressOutDuration) || 0;
prepTotal += Number(dynamicStretchDuration) || 0;

    /* ---------- WORKOUT ---------- */
    window.workoutData.forEach(item => {

        if (item.type === "set") {

            for (let i = 0; i < maxRotations; i++) {
                workoutTotal += work;

                if (i < maxRotations - 1) {
                    workoutTotal += rest;
                }
            }
        }

        if (item.type === "break") {
            breakTotal += item.breakSec || breakDuration;
        }

    });

   /* ---------- TOTAL WORKOUT BEFORE COOLDOWN ---------- */
    const workoutBlock = prepTotal + workoutTotal + breakTotal;

   /* ---------- COOLDOWN CALCULATION ---------- */
    cooldownDuration = Math.max(
        classBlockLength - workoutBlock,
        0
    );

    console.log("Cooldown calculated:", cooldownDuration);

   /* ---------- FINAL TOTAL (ALWAYS CLASS LENGTH) ---------- */
    return classBlockLength;
}

function preciseTick() {

    if (!isRunning) return;

    const now = Date.now();

    if (!nextTickTime) {
        nextTickTime = now + 1000;
    }

    // catch up if browser slept
    while (nextTickTime <= now) {
        tick();
        nextTickTime += 1000;
    }

    const delay = Math.max(0, nextTickTime - now);
    timer = setTimeout(preciseTick, delay);

 }

function startTimer() {

  stopAllTimers();
  
    // Safety: require workout
    if (!workoutData.length) {
        console.warn("Workout not loaded yet.");
        return;
    }

    // Initialize audio once
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Toggle stop if already running
    if (isRunning) {
        stopAllTimers();
        return;
    }

/* ---------- START STATE ---------- */
    isRunning = true;
    

classBlockLength = calculateTotalTime(); // 🔥 NOW DYNAMIC

totalSeconds = classBlockLength;
originalTotalSeconds = classBlockLength;
updateTotalDisplay();

document.getElementById("startBtn").innerText = "STOP";

    // FULL RESET
    displaySetNumber = 1;
    rotationCount = 0;
    currentSet = 1;
    dressWarningSpoken = false;
    lastAutoStartMinute = null;

    preloadFirstSet();

    /* ---------- START WITH DRESS PHASE ---------- */
    currentPhase = "dress";
    timeLeft = dressOutDuration;
      
    updatePhaseDisplay();
    updateClock();
    updateTotalDisplay();

    nextTickTime = Date.now() + 1000;
    timer = setTimeout(preciseTick, 1000);
}


/* ---------- AUTO START ---------- */

function getEffectiveNow() {

    // ⭐ FORCE_DATE override (LOCAL TIME SAFE)
    if (forceDateString) {
        const parts = forceDateString.split(/[T:\-]/);

        if (parts.length >= 6) {
            const forced = new Date(
                Number(parts[0]),     // year
                Number(parts[1]) - 1, // month
                Number(parts[2]),     // day
                Number(parts[3]),     // hour
                Number(parts[4]),     // minute
                Number(parts[5])      // second
            );

            // ✅ FIXED (proper Date validation)
            if (!isNaN(forced.getTime())) return forced;
        }
    }

    return new Date();
}


function autoDetectActiveClass() {

    // ✅ FIXED (allow sync even if already running)
    if (!autoStartEnabled) return;

    const now = getEffectiveNow();
    const day = now.getDay();

    let todaySchedule = [];

if (day === 1) todaySchedule = monTimes;
else if (day === 2) todaySchedule = tueTimes;
else if (day === 3) todaySchedule = wedTimes;
else if (day === 4) todaySchedule = thurTimes;
else if (day === 5) todaySchedule = friTimes;
else return;

    for (const timeStr of todaySchedule) {

        if (!timeStr || !timeStr.includes(":")) continue;

        const [h, m] = timeStr.split(":").map(Number);

        const start = new Date(now);
        start.setHours(h, m, 0, 0);

        const end = new Date(start.getTime() + classBlockLength * 1000);

        if (now >= start && now < end) {

            console.log("⚡ Class already in progress. Auto syncing timer.");

            startTimer();

            const elapsed = Math.floor((now - start) / 1000);
            
            totalSeconds = Math.max(classBlockLength - elapsed, 1);
            originalTotalSeconds = totalSeconds;

            updateTotalDisplay();

            break;
        }
    }
}


function startAutoScheduler() {

    if (autoStartTimer) {
        clearInterval(autoStartTimer);
    }

    autoStartTimer = setInterval(() => {

        if (!autoStartEnabled) return;

        const now = getEffectiveNow();
        const day = now.getDay(); // 0=Sun, 1=Mon...

        if (todayOnlyMode) {
            const today = now.getDay();
            if (today === 0 || today === 6) return; // block weekends
        }

        if (isRunning) return;

        let todaySchedule = [];

        if (day === 1) todaySchedule = monTimes;
else if (day === 2) todaySchedule = tueTimes;
else if (day === 3) todaySchedule = wedTimes;
else if (day === 4) todaySchedule = thurTimes;
else if (day === 5) todaySchedule = friTimes;

        for (const timeStr of todaySchedule) {

            const parts = timeStr.split(":");
            if (parts.length !== 2) continue;

            const targetHour = parseInt(parts[0], 10);
            const targetMinute = parseInt(parts[1], 10);

            if (isNaN(targetHour) || isNaN(targetMinute)) continue;

            // start within first 5 seconds of the minute
            const currentMinuteStamp =
                String(now.getHours()).padStart(2, "0") + ":" +
                String(now.getMinutes()).padStart(2, "0");

            const currentTotalSeconds =
                now.getHours() * 3600 +
                now.getMinutes() * 60 +
                now.getSeconds();

            const targetTotalSeconds =
                targetHour * 3600 +
                targetMinute * 60;

            if (
                currentTotalSeconds >= targetTotalSeconds &&
                currentTotalSeconds < targetTotalSeconds + 5 &&
                lastAutoStartMinute !== currentMinuteStamp
            ) {
                lastAutoStartMinute = currentMinuteStamp;

                console.log("🔔 Auto starting:", timeStr);
                startTimer();
                break;
            }
        }

    }, 1000);
}


/* ======================================================
   LOAD WORKOUT FROM GOOGLE SHEETS — CLEAN + BULLETPROOF
====================================================== */

function preloadFirstSet() {
    if (!workoutData.length) return;
    loadSetData(1);
}

function previewNextSet() {
    if (!workoutData.length) return;

    const nextItem = workoutData[currentSet] ?? null;

    if (nextItem && nextItem.type === "set") {
        loadSetData(currentSet + 1); // loadSetData is 1-based
    }
}


/* ======================================================
   SAFE NUMBER PARSER
====================================================== */
function parseSheetNumber(val, fallback = null) {
    if (val === undefined || val === null) return fallback;

    const cleaned = String(val)
        .replace(/\r/g, "")
        .trim();

    if (!cleaned) return fallback;

    const num = Number(cleaned);
    return isNaN(num) ? fallback : num;
}

  setInterval(checkAutoStart, 1000);


/* ======================================================
   MAIN LOADER
====================================================== */
console.log("STEP 3");
function isEffectivelyBlankRow(row) {
    if (!row || row.length === 0) return true;

    return row.every(cell =>
        String(cell || "")
            .replace(/\u00A0/g, "") // non-breaking space
            .replace(/\s/g, "")
            .trim() === ""
    );
}


function getSheetGid() {
    const params = new URLSearchParams(window.location.search);

    // URL override still allowed
    const urlGid = params.get("gid");
    if (urlGid) return urlGid;

    // Auto by day only
    const today = new Date().getDay();

    if (today === 1) return "MON_GID";
if (today === 2) return "TUE_GID";
if (today === 3) return "WED_GID";
if (today === 4) return "THUR_GID";
if (today === 5) return "FRI_GID";

    return "MON_GID";
}

    console.log("STEP 4 — BEFORE LOADWORKOUT");


async function loadWorkout() {
    console.log("🚀 loadWorkout started");

    try {
        const gid = getSheetGid();

const response = await fetch(
`https://docs.google.com/spreadsheets/d/e/2PACX-1vRjAVNz1buONnBF0Fkqse6QQwdpcreJdvdQGWiVNWp6UGewHgd-4f5uC0ZcyHhfRZxTU7BDC3_AjQA1/pub?gid=${gid}&single=true&output=csv`
);

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const text = await response.text();

        console.log("CSV length:", text.length);

        const rows = parseCSV(text);

        const DEBUG = true;

        if (DEBUG) {
        console.log("CSV preview:", text.slice(0,200));
        console.log("First rows:", rows.slice(0,10));
        }
        console.log("Rows parsed:", rows.length);
        

        console.log("First 10 rows:", rows.slice(0, 10));

        /* =============================
           RESET GLOBALS
        ============================= */
        workoutData.length = 0;
        autoStartEnabled = false;
        mondayTimes = [];
        tueWedTimes = [];
        thuFriTimes = [];

        const clean = v =>
            String(v || "")
                .replace(/\u00A0/g, "")
                .replace(/\r/g, "")
                .trim();

      
       /* =============================
   PROCESS ROWS
============================= */
for (const r of rows) {

    // ---------- TRUE EMPTY ROW ----------
    if (!r || r.length === 0) {
        workoutData.push({
            type: "break",
            breakSec: breakDuration
        });
        console.log("📥 Empty CSV row → break inserted");
        continue;
    }

    const firstRaw = clean(r[0] ?? "");
    const firstCell = firstRaw.toLowerCase();

    // ---------- BULLETPROOF BLANK ROW ----------
    if (isEffectivelyBlankRow(r)) {
        workoutData.push({
            type: "break",
            breakSec: breakDuration
        });
        continue;
    }

    // ---------- EXPLICIT BREAK ----------
    if (firstCell.replace(/\s+/g, "") === "break") {
        const breakSec = parseSheetNumber(r[10], breakDuration);

        workoutData.push({
            type: "break",
            breakSec
        });

        console.log("📥 Explicit break parsed:", breakSec);
        continue;
    }

    // ---------- HEADER SKIP ----------
    if (firstCell === "set" || firstCell === "sets") continue;

    /* =================================================
       CONFIG FLAGS
    ================================================= */

    if (firstCell === "auto_start") {
        autoStartEnabled = clean(r[1]).toLowerCase() === "true";
        continue;
    }

    if (firstCell === "today_only") {
        todayOnlyMode = clean(r[1]).toLowerCase() === "true";
        continue;
    }

    if (firstCell === "force_date") {
        forceDateString = clean(r[1]) || null;
        continue;
    }

    /* ---------- CLASS LENGTH BY DAY ---------- */

    if (firstCell === "monday_minutes") {
        const v = parseSheetNumber(r[1]);
        if (v !== null) mondayMinutes = v;
        continue;
    }

    if (firstCell === "tuewed_minutes") {
        const v = parseSheetNumber(r[1]);
        if (v !== null) tueWedMinutes = v;
        continue;
    }

    if (firstCell === "thufri_minutes") {
        const v = parseSheetNumber(r[1]);
        if (v !== null) thuFriMinutes = v;
        continue;
    }

    /* ---------- SCHEDULE TIMES ---------- */

    if (firstCell === "monday_times") {
        mondayTimes = clean(r[1] || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        continue;
    }

    if (firstCell === "tuewed_times") {
        tueWedTimes = clean(r[1] || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        continue;
    }

    if (firstCell === "thufri_times") {
        thuFriTimes = clean(r[1] || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        continue;
    }

    /* ---------- GLOBAL TIMINGS ---------- */

    if (
        firstCell === "dress_seconds" ||
        firstCell === "dress" ||
        firstCell === "get_dressed" ||
        firstCell === "get_dress"
    ) {
        const v = parseSheetNumber(r[1]);
        if (v !== null) {
            dressOutDuration = v;
            console.log("📥 Dress time:", dressOutDuration);
        }
        continue;
    }

    if (firstCell === "stretch_seconds") {
        const v = parseSheetNumber(r[1]);
        if (v !== null) {
            dynamicStretchDuration = v;
            console.log("📥 Stretch time:", dynamicStretchDuration);
        }
        continue;
    }

    if (firstCell === "break_seconds") {
        const v = parseSheetNumber(r[1]);
        if (v !== null) breakDuration = v;
        continue;
    }
}

          
            /* =================================================
               FLEXIBLE SET DETECTION
            ================================================= */

            const looksLikeSetNumber =
                /^\d+$/.test(firstCell) ||
                /^\d+\.$/.test(firstCell) ||
                /^set\s*\d*$/i.test(firstRaw);

            if (looksLikeSetNumber) {

                const workSec = parseSheetNumber(r[8]);
                const rotateSec = parseSheetNumber(r[9]);
                const breakSec = parseSheetNumber(r[10], breakDuration);

                workoutData.push({
                    type: "set",
                    core: clean(r[1]),
                    percent: clean(r[2]),
                    reps: clean(r[3]),
                    aux: clean(r[4]),
                    auxReps: clean(r[5]),
                    move: clean(r[6]),
                    moveReps: clean(r[7]),
                    workSec,
                    rotateSec,
                    breakSec
                });

                console.log("📥 Set parsed:", {
                    set: firstRaw,
                    workSec,
                    rotateSec,
                    breakSec
                });

                continue;
            }
        }

        console.log("✅ Workout rows:", workoutData.length);
        console.log("✅ Auto start:", autoStartEnabled);

        preloadFirstSet();
startAutoScheduler();

// ⭐ Apply class minutes from worksheet
applyDaySpecificClassLength();

// ⭐ Recalculate preview total
const planned = calculateTotalTime();
const finalTotal = Math.min(planned, classBlockLength);

totalSeconds = finalTotal;
originalTotalSeconds = finalTotal;

updateTotalDisplay();

    } catch (err) {
        console.error("❌ Failed to load workout:", err);
    }
}


/* ======================================================
   SPEECH ENGINE (shared helper)
====================================================== */

function speak(text, rate = 1, pitch = 1) {

    // Prevent queue pile-up
    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    if (selectedVoice) utter.voice = selectedVoice;

    utter.volume = 1;
    utter.rate = rate;
    utter.pitch = pitch;

    // ✅ slight delay prevents overlap glitches
    setTimeout(() => speechSynthesis.speak(utter), 50);
}


/* ---------- COUNTDOWN ---------- */
function speakNumber(num) {
    speak(num.toString(), 1, 1);
}


/* ---------- ROTATE ---------- */
function speakRotate() {
    speak("Rotate!", 1.6, 1.5);
}


/* ---------- DRESS WARNING ---------- */
function speakDressWarning() {
    speak("Two minute warning", 1, 1);
}


/* ---------- LIFT ---------- */
function speakLift() {
    speak("Lift!", 1.6, 1.3);
}


/* ---------- STRETCH ---------- */
function speakStretch() {
    speak("Dynamic Stretch!", 1.3, 1.2);
}


/* ---------- BREAK PREP ---------- */
function speakBreakPrep() {
    speak("Break! Prep next lift!", 1.2, 1.1);
}














/* ===================== TIMELINE ===================== */

let timelineData = [];

function buildSegmentTimeline() {
    if (!window.workoutData?.length) return;

    timelineData = [];

    // DRESS
    timelineData.push({ phase: "dress", duration: dressOutDuration });

    // STRETCH
    if (dynamicStretchDuration > 0) {
        timelineData.push({ phase: "stretch", duration: dynamicStretchDuration });
    }

    // WORKOUT
    window.workoutData.forEach((item, index) => {

        if (item.type === "set") {
            for (let r = 0; r < maxRotations; r++) {

                timelineData.push({
                    phase: "work",
                    duration: item.workSec || parseInt(document.getElementById("workTime").value, 10) || 0
                });

                if (r < maxRotations - 1) {
                    timelineData.push({
                        phase: "rotate",
                        duration: item.rotateSec || parseInt(document.getElementById("restTime").value, 10) || 0
                    });
                }
            }
        }

        if (item.type === "break") {
            timelineData.push({
                phase: "break",
                duration: item.breakSec || breakDuration
            });
        }

    });

    renderTimeline(); // ✅ correct place
}


/* ===== MUST BE OUTSIDE (GLOBAL) ===== */

function renderTimeline() {
    const container = document.getElementById("timelineSegments");
    if (!container) return;

    container.innerHTML = "";

    const total = timelineData.reduce((sum, seg) => sum + seg.duration, 0);

    timelineData.forEach((seg, index) => {
        const div = document.createElement("div");

        div.classList.add("timeline-segment", `seg-${seg.phase}`);

        const percent = (seg.duration / total) * 100;
        div.style.width = percent + "%";

        div.dataset.index = index;

        container.appendChild(div);
    });
}

function updateSegmentHighlight() {
    if (!window.classStartTime) return;

    const now = getEffectiveNow().getTime();
    let elapsed = (now - window.classStartTime) / 1000;

    let currentIndex = 0;

    for (let i = 0; i < timelineData.length; i++) {
        if (elapsed < timelineData[i].duration) {
            currentIndex = i;
            break;
        }
        elapsed -= timelineData[i].duration;
    }

    document.querySelectorAll(".timeline-segment").forEach((el, i) => {
        el.classList.toggle("active", i === currentIndex);
    });
}



 function updateTotalDisplay() {
    const el = document.getElementById("headerTimer"); // 🔥 NEW TARGET
    if (!el) return;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    el.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
} 

function updateClock() {
    const el = document.getElementById("clock");
    if (!el) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    el.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function getSyncedNow() {
    return new Date(Date.now() + timeOffset);
}

function syncClockOffset() {
    if (!window.serverTime) {
        console.warn("⚠️ No server time found");
        return;
    }

    const clientNow = Date.now();
    const serverNow = new Date(window.serverTime).getTime();

    timeOffset = serverNow - clientNow;

    console.log("⏱ Clock offset (ms):", timeOffset);
}

/* ===================== UTIL ===================== */

async function loadHeader() {
    const res = await fetch("components/header.html");
    const html = await res.text();

    const container = document.getElementById("headerContainer");
    if (!container) return;

    container.innerHTML = html;

    // ✅ ONLY modify AFTER it's inserted
    const timer = document.getElementById("headerTimer");
    const menu = document.getElementById("headerMenu");

    // 🔥 Only switch to timer mode IF we're on timer page
    if (window.location.pathname.includes("timer")) {
        if (timer) timer.style.display = "block";
        // ✅ KEEP MENU VISIBLE
if (menu) menu.style.display = "flex";

// 🔥 OPTIONAL: hide only logout button on timer page
const logoutBtn = document.querySelector(".logout-btn");
if (logoutBtn) logoutBtn.style.display = "none";
    }

    // 🔥 Ensure header styling applies correctly
    const header = document.getElementById("schoolHeader");
    if (header) {
        header.classList.add("loaded");
    }
}



function parseTimeToToday(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);

    const now = getEffectiveNow();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        h,
        m,
        0
    );
}

function workoutFinishScreen() {
    stopAllTimers();
    document.getElementById("phase").innerText = "WORKOUT COMPLETE";
}



function applyCoachControl() {

  if (!window.classStartTime && window.controlTimestamp) {
    window.classStartTime = new Date(window.controlTimestamp).getTime();
}

  // 🔥 FORCE SYNC FOR LATE JOIN (even without new START command)
if (window.classStartTime && isRunning) {
    const now = getEffectiveNow().getTime();
    const state = computeWorkoutState(now);

    if (state) {
        currentPhase = state.phase;
        timeLeft = state.timeLeft;

        if (state.setIndex !== undefined) {
            currentSet = state.setIndex;
            displaySetNumber = state.setNumber;
            loadSetData(currentSet);
        }

        rotationCount = state.rotation || 0;

        updateClock();
        updatePhaseDisplay();
        updateTotalDisplay();
    }
}

    if (!window.controlAction) return;

    const signature = [
        window.controlAction,
        window.controlTimestamp,
        window.controlPhase,
        window.controlSet,
        window.controlRotation
    ].join("|");

    // 🚫 prevent re-running same command
    if (signature === lastControlSignature) return;

    lastControlSignature = signature;

    const now = getEffectiveNow().getTime();

    console.log("🎮 Applying control:", signature);

    switch (window.controlAction) {

       case "START":
    window.classStartTime = new Date(window.controlTimestamp).getTime();
    isRunning = true;

    // 🔥 FIXED — DEFINE nowMs FIRST
    const nowMs = getEffectiveNow().getTime();
    const state = computeWorkoutState(nowMs);

    if (!state) return;

    // 🔥 ROTATE CHECK (optional but good)
    if (
        state.phase === "rotate" &&
        state.rotation !== rotationCount
    ) {
        console.log("🔁 ROTATING QUADRANTS (COACH SYNC)");
        rotateQuadrantColors();
    }

    currentPhase = state.phase;
    timeLeft = state.timeLeft;

    rotationCount = state.rotation || 0;

    updateClock();
    updatePhaseDisplay();
    updateTotalDisplay();
break;

        case "STOP":
    stopAllTimers();
    window.classStartTime = null;
        updatePhaseDisplay();
updateClock();
updateTotalDisplay();
    break;

        case "PAUSE":
            isRunning = false;
        updatePhaseDisplay();
updateClock();
updateTotalDisplay();
            break;

        case "RESUME":
            isRunning = true;
        updatePhaseDisplay();
updateClock();
updateTotalDisplay();
            break;

        case "JUMP":

            const offset = calculateOffsetForTarget(
                window.controlPhase,
                window.controlSet,
                window.controlRotation
            );

            window.classStartTime = now - (offset * 1000);
        updatePhaseDisplay();
updateClock();
updateTotalDisplay();
            break;
    }
} 



function rotateQuadrantColors() {
    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");
    const q3 = document.getElementById("q3");
    const q4 = document.getElementById("q4");

    if (!q1 || !q2 || !q3 || !q4) return;

    const getColor = (el) => {
        if (el.classList.contains("blackQuad")) return "blackQuad";
        if (el.classList.contains("whiteQuad")) return "whiteQuad";
        if (el.classList.contains("blueQuad")) return "blueQuad";
        if (el.classList.contains("greyQuad")) return "greyQuad";
    };

    const c1 = getColor(q1);
    const c2 = getColor(q2);
    const c3 = getColor(q3);
    const c4 = getColor(q4);

    // remove all
    [q1, q2, q3, q4].forEach(q =>
        q.classList.remove("blackQuad","whiteQuad","blueQuad","greyQuad")
    );

    // 🔥 YOUR ROTATION RULE
    q2.classList.add(c1); // q1 → q2
    q4.classList.add(c2); // q2 → q4
    q3.classList.add(c4); // q4 → q3
    q1.classList.add(c3); // q3 → q1
}

function applyQuadrantColors() {
    const config = window.SCHOOL_CONFIG;
    if (!config || !config.theme) return;

    const primary = config.theme.primary;
    const secondary = config.theme.secondary;

       const q3 = document.getElementById("q3");

    
    if (q3) {
        q3.style.backgroundColor = primary;
        q3.style.color = "#fff";
    }
}

function computeWorkoutState(nowMs) {

    if (!window.classStartTime) return null;

    let elapsed = Math.floor((nowMs - window.classStartTime) / 1000);
    let cursor = 0;

    // 1️⃣ DRESS
    if (elapsed < cursor + dressOutDuration) {
        return {
            phase: "dress",
            timeLeft: (cursor + dressOutDuration) - elapsed
        };
    }
    cursor += dressOutDuration;

    // 2️⃣ STRETCH
    if (elapsed < cursor + dynamicStretchDuration) {
        return {
            phase: "stretch",
            timeLeft: (cursor + dynamicStretchDuration) - elapsed
        };
    }
    cursor += dynamicStretchDuration;

    // 3️⃣ WORKOUT LOOP
    for (let i = 0; i < window.workoutData.length; i++) {

        const item = window.workoutData[i];

        if (item.type === "set") {

            for (let r = 0; r < maxRotations; r++) {

                const work = item.workSec || getWorkDuration();

                // WORK
                if (elapsed < cursor + work) {
                    return {
                        phase: "work",
                        setIndex: i,
                        setNumber: window.workoutData
                            .slice(0, i + 1)
                            .filter(x => x.type === "set").length,
                        rotation: r,
                        timeLeft: (cursor + work) - elapsed
                    };
                }
                cursor += work;

                // ROTATE (always exists)
                const rest = Math.max(1, item.rotateSec || getRestDuration());

                if (elapsed < cursor + rest) {
                    return {
                        phase: "rotate",
                        setIndex: i,
                        rotation: r,
                        timeLeft: (cursor + rest) - elapsed
                    };
                }
                cursor += rest;
            }
        }

        if (item.type === "break") {
            const b = item.breakSec || breakDuration;

            if (elapsed < cursor + b) {
                return {
                    phase: "break",
                    setIndex: i,
                    timeLeft: (cursor + b) - elapsed
                };
            }
            cursor += b;
        }
    }

    return { phase: "done", timeLeft: 0 };
}

function checkAutoStart() {

  if (window.workoutData?.length) {
    classBlockLength = calculateTotalTime();
}

    if (!autoStartEnabled) return;
    if (isRunning) return;

    const now = getEffectiveNow();

    const day = now.getDay();

    let todaySchedule = [];

    if (day === 1) todaySchedule = monTimes;
    else if (day === 2) todaySchedule = tueTimes;
    else if (day === 3) todaySchedule = wedTimes;
    else if (day === 4) todaySchedule = thurTimes;
    else if (day === 5) todaySchedule = friTimes;
    else return;

    if (!todaySchedule.length) return;

    // 🔥 convert ALL schedule times to timestamps
    const timestamps = todaySchedule.map(t => parseTimeToToday(t));

    // 🔥 find the most recent start time that has passed
    let bestStart = null;

    for (const t of timestamps) {
        if (t <= now) {
            if (!bestStart || t > bestStart) {
                bestStart = t;
            }
        }
    }

    if (!bestStart) return;

    // 🔥 prevent restarting same session
    if (window.lastStartTime &&
        Math.abs(window.lastStartTime - bestStart.getTime()) < 60000) {
        return;
    }

    console.log("🔥 AUTO START (ABSOLUTE):", bestStart);

    window.classStartTime = bestStart.getTime();
    window.lastStartTime = bestStart.getTime();

    startTimer();
}
  
    
/* ======================================================
   STOP ALL TIMERS
====================================================== */

 function stopAllTimers() {

    if (timer) {
        clearTimeout(timer); // ✅ CORRECT for setTimeout loop
        timer = null;
    }

    nextTickTime = null; // prevents drift on restart

    isRunning = false;
    document.getElementById("startBtn").innerText = "START";
}

/* ======================================================
   GET NEXT SET INDEX (1-BASED)
====================================================== */

  function getNextSetIndex() {

    // Start searching AFTER currentSet
    for (let i = currentSet; i < workoutData.length; i++) {
        if (workoutData[i].type === "set") {
            return i + 1; // convert to 1-based index
        }
    }

    // No more sets found
    return null;
}

  
/* ======================================================
   WORK DURATION (seconds)
====================================================== */

  function getWorkDuration() {

    const currentItem = workoutData[currentSet - 1] || {};

    // 1️⃣ per-set override
    if (currentItem?.workSec) {
        console.log("⏱ Work time (set override):", {
            set: currentSet,
            value: currentItem.workSec
        });
        return currentItem.workSec;
    }

    // 2️⃣ sheet global override
    if (sheetWorkDuration) {
        console.log("⏱ Work time (sheet global):", sheetWorkDuration);
        return sheetWorkDuration;
    }

    // 3️⃣ UI fallback
    const val = parseInt(document.getElementById("workTime").value, 10);
    const safeVal = isNaN(val) || val <= 0 ? 1 : val;

    console.log("⏱ Work time (UI fallback):", safeVal);

    return safeVal;
}

  
/* ======================================================
   MAIN TICK
====================================================== */

function tick() {

    if (!isRunning) return;

    phaseJustChanged = false;

  
    /* ======================================================
       1️⃣ MASTER CLASS TIMER (authoritative)
    ====================================================== */
    if (totalSeconds <= 0) {
        workoutFinishScreen();
        return;
    }

    totalSeconds = Math.max(0, totalSeconds - 1);
    updateTotalDisplay();

  
    /* ======================================================
       2️⃣ PHASE TIMER
    ====================================================== */
   
  timeLeft = Math.max(0, timeLeft - 1);

  
    /* ======================================================
       3️⃣ DRESS WARNING (exact trigger)
    ====================================================== */
  
  if (
        currentPhase === "dress" &&
        timeLeft === 120 &&
        !dressWarningSpoken
    ) {
        speakDressWarning();
        dressWarningSpoken = true;
    }

    
    /* ======================================================
       4️⃣ FINAL COUNTDOWN (no repeats)
    ====================================================== */
    
  if (timeLeft >= 1 && timeLeft <= 5) {
        if (lastCountdownSpoken !== timeLeft) {
            speakNumber(timeLeft);
            lastCountdownSpoken = timeLeft;
        }
    }

    
    /* ======================================================
       5️⃣ UPDATE CLOCK
    ====================================================== */
    
  updateClock();

  
    /* ======================================================
       6️⃣ EXIT IF TIME REMAINS
    ====================================================== */
    
  if (timeLeft > 0) return;

    lastCountdownSpoken = null;

    console.log("Set:", currentSet, "Rotation:", rotationCount);

  
    /* ======================================================
       PHASE TRANSITIONS (STATE MACHINE)
    ====================================================== */
   
  switch (currentPhase) {

        case "dress":
            currentPhase = "stretch";
            timeLeft = dynamicStretchDuration;
            dressWarningSpoken = false;
            phaseJustChanged = true;
            speakStretch();
            break;

        case "stretch":
            currentPhase = "work";
            rotationCount = 0;
            currentSet = 1;
            displaySetNumber = 1;

            loadSetData(1);

            timeLeft = getWorkDuration();
            phaseJustChanged = true;
            speakLift();
            break;

        case "work": {
            rotateQuadrantcolors();
            rotationCount++;

            currentPhase = "rotate";
            timeLeft = getRestDuration();
            phaseJustChanged = true;
            speakRotate();
            break;
        }

      
        /* ---------- ROTATE → NEXT ---------- */
      
    case "rotate": {

    const finishedRotations = rotationCount >= maxRotations;

    if (finishedRotations) {

        rotationCount = 0;

        const nextItem = workoutData[currentSet] ?? null;

        // 🔴 no more items
        if (!nextItem) {
            workoutComplete();
            return;
        }


        // 🟡 break row
        if (nextItem.type === "break") {

            // advance pointer onto the break row
            currentSet++;

            currentPhase = "break";

            timeLeft = Math.max(
                1,
                nextItem.breakSec || breakDuration
            );

            phaseJustChanged = true;
            speakBreakPrep();

            previewNextSet();
            break;
        }


        // ✅ next is real set
        currentSet++;
        displaySetNumber++;
        loadSetData(currentSet);
    }

    currentPhase = "work";
    timeLeft = getWorkDuration();
    phaseJustChanged = true;
    speakLift();
    break;
}

        case "break": {

            const nextItem = workoutData[currentSet] ?? null;

            if (!nextItem) {
                workoutComplete();
                return;
            }

          
            // ✅ ONLY advance when next is a set
            if (nextItem.type === "set") {
                currentSet++;
                displaySetNumber++;
                loadSetData(currentSet);
            }

            currentPhase = "work";
            timeLeft = getWorkDuration();
            phaseJustChanged = true;
            speakLift();
            break;
        }

    } // ✅ CLOSES switch(currentPhase)

  
    /* ======================================================
       FINAL UI UPDATE
    ====================================================== */
    
  if (phaseJustChanged) {
    lastCountdownSpoken = null;
    updatePhaseDisplay();
}
}

  
/* ======================================================
   PHASE DISPLAY + CENTER MODES
====================================================== */

function updatePhaseDisplay() {

    const logo = document.getElementById("teamLogo");
    const center = document.getElementById("center");
    const phaseEl = document.getElementById("phase");

    if (!center || !logo || !phaseEl) return;

    // RESET
    center.classList.remove(
        "workMode",
        "rotateMode",
        "breakMode",
        "dressMode",
        "stretchMode"
    );

    logo.classList.remove(
        "logoDefault",
        "logoWork",
        "logoRotate",
        "logoBreak"
    );

    /* ===================== PHASES ===================== */

    if (currentPhase === "work") {

        center.classList.add("workMode");
        logo.classList.add("logoWork");

        phaseEl.innerHTML = `
            <div>WORK</div>
            <div>Set ${displaySetNumber} of ${getTotalSets()}</div>
            <div>Rotation ${rotationCount + 1} of ${maxRotations}</div>
        `;

        return;
    }

    if (currentPhase === "rotate") {
        center.classList.add("rotateMode");
        logo.classList.add("logoRotate");

        phaseEl.innerHTML = `<div>ROTATE</div>`;
        return;
    }

    if (currentPhase === "break") {
        center.classList.add("breakMode");
        logo.classList.add("logoBreak");

        phaseEl.innerHTML = `
            <div>BREAK</div>
            <div>PREP NEXT LIFT</div>
        `;
        return;
    }

    if (currentPhase === "dress") {
        center.classList.add("dressMode");
        logo.classList.add("logoDefault");

        phaseEl.innerHTML = `<div>DRESS OUT & ATTENDANCE</div>`;
        return;
    }

    if (currentPhase === "stretch") {
        center.classList.add("stretchMode");
        logo.classList.add("logoDefault");

        phaseEl.innerHTML = `<div>DYNAMIC STRETCH</div>`;
        return;
    }

    if (currentPhase === "cooldown") {
        center.classList.add("dressMode");
        logo.classList.add("logoDefault");

        phaseEl.innerHTML = `<div>COOL DOWN / CLEAN-UP / DRESS</div>`;
        return;
    }

    phaseEl.innerHTML = `<div>${currentPhase}</div>`;
}

    /* ---------- LABEL MAP ---------- */
    const labels = {
        dress: "DRESS OUT & ATTENDANCE",
        stretch: "DYNAMIC STRETCH",
        work: "WORK",
        rotate: "ROTATE",
        break: "BREAK",
        cooldown: "COOL DOWN / CLEAN-UP / DRESS"
    };

    /* ---------- WORK SPECIAL LABEL ---------- */
    if (currentPhase === "work") {
        phaseEl.innerText =
`WORK\nSet ${displaySetNumber} of ${getTotalSets()}\nRotation ${rotationCount + 1} of ${maxRotations}`;
    } else {
        phaseEl.innerText = labels[currentPhase] || "";
    }
}

  
/* ======================================================
   SPEECH ENGINE (shared helper)
====================================================== */

function speak(text, rate = 1, pitch = 1) {

    // Prevent queue pile-up
    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    if (selectedVoice) utter.voice = selectedVoice;

    utter.volume = 1;
    utter.rate = rate;
    utter.pitch = pitch;

    // ✅ slight delay prevents overlap glitches
    setTimeout(() => speechSynthesis.speak(utter), 50);
}


/* ---------- COUNTDOWN ---------- */
function speakNumber(num) {
    speak(num.toString(), 1, 1);
}


/* ---------- ROTATE ---------- */
function speakRotate() {
    speak("Rotate!", 1.6, 1.5);
}


/* ---------- DRESS WARNING ---------- */
function speakDressWarning() {
    speak("Two minute warning", 1, 1);
}


/* ---------- LIFT ---------- */
function speakLift() {
    speak("Lift!", 1.6, 1.3);
}


/* ---------- STRETCH ---------- */
function speakStretch() {
    speak("Dynamic Stretch!", 1.3, 1.2);
}


/* ---------- BREAK PREP ---------- */
function speakBreakPrep() {
    speak("Break! Prep next lift!", 1.2, 1.1);
}


/* ======================================================
   REST DURATION (seconds)
====================================================== */

function getRestDuration() {

    // 1️⃣ per-set override
    const currentItem = workoutData[currentSet - 1] || {}; // ✅ safer
    if (currentItem.rotateSec) {
        console.log("⏱ Using per-set rotate:", currentItem.rotateSec);
        return currentItem.rotateSec;
    }

    // 2️⃣ sheet override
    if (sheetRotateDuration) {
        console.log("⏱ Using sheet rotate:", sheetRotateDuration);
        return sheetRotateDuration;
    }

    // 3️⃣ UI fallback
    const val = parseInt(document.getElementById("restTime").value, 10);
    const safe = isNaN(val) || val <= 0 ? 1 : val;

    console.log("⏱ Using UI rotate:", safe);
    return safe;
}


function syncTime() {

    if (!isRunning) {

        const workVal = getWorkDuration();
        const restVal = getRestDuration();

        timeLeft = (currentPhase === "work") ? workVal : restVal;

        updateClock();

        // Always show full class block
        totalSeconds = classBlockLength;
        originalTotalSeconds = classBlockLength;

        updateTotalDisplay();
    }
}


/* ======================================================
   RESET CENTER CLOCK
====================================================== */

function resetCenterClock() {

    const center = document.getElementById("center");

    center.classList.remove(
        "workMode",
        "rotateMode",
        "breakMode",
        "dressMode",
        "stretchMode"
    );

    center.classList.add("workMode");

    document.getElementById("clock").innerText =
        document.getElementById("workTime").value;

    document.getElementById("phase").innerText = "WORK";
}


/* ======================================================
   LOAD SET INTO QUADRANTS
====================================================== */

function loadSetData(setNumber) {

    const workout = workoutData[setNumber - 1];

    if (!workout || workout.type !== "set") return;

    /* ---------- CORE ---------- */
    const q1Texts = document.querySelectorAll("#q1 .quad-text");
    if (q1Texts.length >= 3) {
        q1Texts[0].innerText = workout.core;
        q1Texts[1].innerText = "Reps: " + workout.reps;
        q1Texts[2].innerText =
            "Percentage: " + (workout.percent ? workout.percent + "%" : "");
    }

    /* ---------- AUX ---------- */
    const q2Texts = document.querySelectorAll("#q2 .quad-text");
    if (q2Texts.length >= 2) {
        q2Texts[0].innerText = workout.aux;
        q2Texts[1].innerText = "Reps: " + workout.auxReps;
    }

    /* ---------- MOVEMENT ---------- */
    const q4Texts = document.querySelectorAll("#q4 .quad-text");
    if (q4Texts.length >= 2) {
        q4Texts[0].innerText = workout.move;
        q4Texts[1].innerText = "Reps/Time: " + workout.moveReps;
    }
}


/* ======================================================
   SPACEBAR CONTROL
====================================================== */

window.addEventListener("keydown", (e) => {

    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.repeat) return;

    if (e.code === "Space") {
        e.preventDefault();
        startTimer();
    }
});


/* ======================================================
   INITIAL PAGE LOAD
====================================================== */

window.addEventListener("unhandledrejection", e => {
    console.warn("Unhandled promise:", e.reason);
});

window.addEventListener("DOMContentLoaded", () => {

    applyDaySpecificClassLength();

    totalSeconds = classBlockLength;
    originalTotalSeconds = classBlockLength;
    updateTotalDisplay();

    loadWorkout();

    // auto detect if class already started
    setTimeout(autoDetectActiveClass, 2000);

});


/* ======================================================
   SPACEBAR CONTROL
====================================================== */

window.addEventListener("keydown", (e) => {

    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.repeat) return;

    if (e.code === "Space") {
        e.preventDefault();
        startTimer();
    }
});

document.addEventListener("click", function (e) {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("dropdownMenu");

    if (!toggle || !menu) return;

    if (toggle.contains(e.target)) {
        menu.classList.toggle("show");
    } else {
        menu.classList.remove("show");
    }
});


window.addEventListener("DOMContentLoaded", async () => {

    await loadHeader(); // 🔥 MUST BE FIRST
  
    try {

        if (!window.APP_READY) {
            console.error("❌ APP_READY missing — themeLoader not loaded");
            return;
        }

        const config = await window.APP_READY;
        

        if (!config) {
            console.error("❌ Config failed to load");
            return;
        }

        console.log("✅ SCHOOL CONFIG READY:", config);

      document.documentElement.style.setProperty('--secondary', config.theme.secondary);

        applyQuadrantColors();

        let isPolling = false;

        setInterval(async () => {
            if (isPolling) return;

            isPolling = true;

            try {
                await loadWorkout();
                buildSegmentTimeline();
                applyCoachControl(); // 🔥 keep UI synced
            } catch (e) {
                console.error("Polling error:", e);
            }

            isPolling = false;
        }, 3000);

        updateTotalDisplay();

        if (typeof loadWorkout !== "function") {
            console.error("❌ loadWorkout is NOT defined");
            return;
        }

        await loadWorkout();
        buildSegmentTimeline();

        // 🔥 sync clocks BEFORE scheduler starts
        syncClockOffset();

        // 🔥 immediate late-join sync
        applyCoachControl();

        // 🔥 START TIMER AUTOMATICALLY
        startAutoScheduler();

        setTimeout(autoDetectActiveClass, 2000);

    } catch (err) {
        console.error("🔥 CRITICAL INIT ERROR:", err);
    }

});

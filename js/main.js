
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
let timeOffset = 0;
let lastControlSignature = null;
let lastRotationIndex = -1;



/* ===================== SETS ===================== */

let currentSet = -1;
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

let monMinutes = 45;
let tueMinutes = 45;
let wedMinutes = 45;
let thurMinutes = 45;
let friMinutes = 45
let classBlockLength = 45 * 60;
let dressOutDuration = 180;
let dynamicStretchDuration = 0;
let breakDuration = 120;
let cooldownDuration = 0;

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

/* ===================== FLAGS ===================== */

let dressWarningSpoken = false;
let onBreak = false;
let selectedVoice = null;
let displaySetNumber = 0;

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
    displaySetNumber = 0;
    rotationCount = 0;
    currentSet = 0;
}


  

/* ======================================================
   CALCULATE TOTAL CLASS TIME
====================================================== */
function calculateTotalTime() {

    if (!window.workoutData || !window.workoutData.length) {
        console.warn("Workout still loading...");
        return 0;
    }

    const work = parseInt(document.getElementById("workTime").value, 10) || 0;
    const rest = parseInt(document.getElementById("restTime").value, 10) || 0;

    let total = 0;

    /* ---------- PREP ---------- */
    total += dressOutDuration;
    total += dynamicStretchDuration;

    /* ---------- WORKOUT ---------- */
    window.workoutData.forEach(item => {

        if (item.type === "set") {

            for (let i = 0; i < maxRotations; i++) {
                total += item.workSec || work;

                if (i < maxRotations - 1) {
                    total += item.rotateSec || rest;
                }
            }
        }

        if (item.type === "break") {
            total += item.breakSec || breakDuration;
        }

    });

    /* ---------- COOLDOWN ---------- */
    total += cooldownDuration; // optional if you want manual cooldown

    console.log("🧮 Calculated class length (sec):", total);

    return total;
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

function startTimer() {

  stopAllTimers();
  
if (!window.classStartTime) {
    window.classStartTime = getEffectiveNow().getTime();
}
  
    // Safety: require workout
    if (!window.workoutData || !window.workoutData.length) {
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
    displaySetNumber = 0;
    rotationCount = 0;
    currentSet = 0;
    dressWarningSpoken = false;
    lastAutoStartMinute = null;

    preloadFirstSet();

    /* ---------- START WITH DRESS PHASE ---------- */
    

      
    updatePhaseDisplay();
    updateClock();
    updateTotalDisplay();

    nextTickTime = Date.now() + 1000;
    timer = setTimeout(preciseTick, 1000);
}

window.loadSetData = function(index) {
    const set = window.workoutData[index];

    if (!set) {
        console.error("❌ No set found at index", index);
        return;
    }

    console.log("🎯 Loading set:", set);

  // CORE
const map = {
    ".core-lift-title": set.coreLift,
    ".core-reps": "Reps: " + set.coreReps,
    ".core-percent": "Percentage: " + set.percentage,
    ".aux-lift-title": set.auxLift,
    ".aux-reps": "Reps: " + set.auxReps,
    ".movement-title": set.movement,
    ".movement-reps": "Reps/Time: " + set.movementReps
};

Object.entries(map).forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
});
  }; 

/* ---------- AUTO START ---------- */

function getEffectiveNow() {

    // use server-synced time if available
    if (window.serverTime) {
        return getSyncedNow();
    }

    return new Date();
}

 

function autoDetectActiveClass() {

  if (window.workoutData?.length) {
    classBlockLength = calculateTotalTime();
}

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
            window.classStartTime = start.getTime();
            totalSeconds = Math.max(classBlockLength - elapsed, 1);
            originalTotalSeconds = totalSeconds;

            updateTotalDisplay();

            break;
        }
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
   LOAD WORKOUT FROM GOOGLE SHEETS — CLEAN + BULLETPROOF
====================================================== */

function preloadFirstSet() {
    if (!window.workoutData || !window.workoutData.length) return;
    loadSetData(0);
}

function previewNextSet() {
    if (!window.workoutData || !window.workoutData.length) return;

    const nextIndex = currentSet + 1;
    const nextItem = window.workoutData[nextIndex];

    if (nextItem && nextItem.type === "set") {
        loadSetData(nextIndex);
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

  
/* ======================================================
   AUTO-DETECT WORKOUT BY DAY (ELITE)
====================================================== */
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
    for (let i = currentSet + 1; i < window.workoutData.length; i++) {
        if (window.workoutData[i].type === "set") {
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

    const currentItem = window.workoutData[currentSet - 1] || {};

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

    if (!window.workoutData?.length) return;

    applyCoachControl();

    if (!isRunning) return;

    phaseJustChanged = false;

    updateSegmentHighlight();

    /* ======================================================
       1️⃣ MASTER CLASS TIMER
    ====================================================== */

    if (totalSeconds <= 0) {
        workoutFinishScreen();
        return;
    }

    if (window.classStartTime) {
        const now = getEffectiveNow().getTime();
        const elapsed = Math.floor((now - window.classStartTime) / 1000);
        totalSeconds = Math.max(classBlockLength - elapsed, 0);
    }

    updateTotalDisplay();

    /* ======================================================
       2️⃣ PHASE TIMER
    ====================================================== */

   const nowMs = getEffectiveNow().getTime();
const state = computeWorkoutState(nowMs);

if (!state) {
    console.warn("⚠️ No workout state yet (waiting for classStartTime)");
    return;
}

// 🔥 CAPTURE PREVIOUS STATE
const prevPhase = currentPhase;
const prevTime = timeLeft;

  // 🔍 DEBUG — ADD THIS LINE RIGHT HERE
console.log("DEBUG:", prevPhase, prevTime, "→", state.phase);

// 🔥 STABLE ROTATION DETECTION (FINAL FIX)
if (
    state.phase === "rotate" &&
    state.rotation !== lastRotationIndex
) {
    console.log("🔁 ROTATING QUADRANTS (NEW ROTATION)", state.rotation);
    rotateQuadrantColors();
    lastRotationIndex = state.rotation;
}

// Phase change tracking (for UI only)
if (prevPhase !== state.phase) {
    console.log("PHASE CHANGE:", prevPhase, "→", state.phase);
    phaseJustChanged = true;
}

// 🔥 UPDATE CURRENT STATE AFTER CHECKS
currentPhase = state.phase;
timeLeft = state.timeLeft;

if (state.setIndex !== undefined && state.setIndex !== currentSet) {
    currentSet = state.setIndex;
    displaySetNumber = state.setNumber;
    loadSetData(currentSet);
}

rotationCount = state.rotation || 0;

    /* ======================================================
       3️⃣ DRESS WARNING
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
       4️⃣ FINAL COUNTDOWN
    ====================================================== */

    if (timeLeft >= 1 && timeLeft <= 5) {
        if (lastCountdownSpoken !== timeLeft) {
            speakNumber(timeLeft);
            lastCountdownSpoken = timeLeft;
        }
    }

    /* ======================================================
       5️⃣ UPDATE UI
    ====================================================== */

    updateClock();
    updatePhaseDisplay();
    updateCenterVisuals();

    if (timeLeft > 0) return;

    lastCountdownSpoken = null;

    console.log("Set:", currentSet, "Rotation:", rotationCount);
}
    
/* ======================================================
   PHASE DISPLAY + CENTER MODES
====================================================== */

function updatePhaseDisplay() {

    const logo = document.getElementById("teamLogo");
    const center = document.getElementById("center");

    // ✅ safety check (prevents crashes if DOM changes)
    if (!center || !logo) return;

    // 🔥 CLEAR ALL CENTER MODES FIRST (CRITICAL)
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

    const phaseEl = document.getElementById("phase");

    switch (currentPhase) {

        case "dress":
            center.classList.add("dressMode");
            logo.classList.add("logoDefault");
            break;

        case "stretch":
            center.classList.add("stretchMode");
            logo.classList.add("logoDefault");
            break;

        case "cooldown":
            center.classList.add("dressMode");
            logo.classList.add("logoDefault");
            break;

        case "work":
            center.classList.add("workMode");
            logo.classList.add("logoWork"); // ✅ FIXED
            break;

        case "rotate":
            center.classList.add("rotateMode");
            logo.classList.add("logoRotate"); // ✅ FIXED
            break;

        case "break":
            center.classList.add("breakMode");
            logo.classList.add("logoBreak"); // ✅ consistency improvement
            phaseEl.innerText = "BREAK\nPREP NEXT LIFT";
            return;
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
    phaseEl.innerHTML = `
        <div>WORK</div>
        <div style="font-size:0.7em; margin-top:6px;">
            Set ${displaySetNumber} of ${getTotalSets()}
        </div>
        <div style="font-size:0.65em; opacity:0.85;">
            Rotation ${rotationCount + 1} of ${maxRotations}
        </div>
    `;
} else {
    phaseEl.innerText = labels[currentPhase] || "";
}
}

function updateCenterVisuals() {
    const center = document.getElementById("center");
    if (!center) return;

    // 🔥 force repaint (fixes rare stuck glow issue)
    center.style.transform = center.style.transform;
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
    const currentItem = window.workoutData[currentSet - 1] || {}; // ✅ safer
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

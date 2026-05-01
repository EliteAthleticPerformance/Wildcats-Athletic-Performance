
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

/* ===================== SETS ===================== */

let currentSet = 0;
let maxSets = 1;
let rotationCount = 0;
const maxRotations = 4;


/* ===================== PERIOD AUTO START ===================== */

let autoStartEnabled = false;
let summonTimes = [];
let sumtueTimes = [];
let sumthurTimes = [];
let sumfriTimes = [];
let autoStartTimer = null;
let lastAutoStartMinute = null;
let todayOnlyMode = false;
let forceDateString = null;
let sheetWorkDuration = null;
let sheetRotateDuration = null;
let manualWorkoutOverride = null;


/* ===================== DURATIONS ===================== */

let summonMinutes = 45;
let sumtueMinutes = 45;
let sumthurMinutes = 45;
let sumfriMinutes = 45
let classBlockLength = 45 * 60;
let dressOutDuration = 180;
let dynamicStretchDuration = 0;
let breakDuration = 120;
let cooldownDuration = 0;


/* ===================== FLAGS ===================== */

let dressWarningSpoken = false;
let onBreak = false;
let selectedVoice = null;
let displaySetNumber = 0;

 function updateTotalDisplay() {
    const el = document.getElementById("totalTime");
    if (!el) return;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    el.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
} 

/* ===================== UTIL ===================== */

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
   APPLY DAY-SPECIFIC CLASS LENGTH
====================================================== */

function applyDaySpecificClassLength() {
    const now = getEffectiveNow();
    const day = now.getDay(); // 0=Sun

    let minutes = summonMinutes; // safe default

    if (day === 1) minutes = summonMinutes;
    else if (day === 2) minutes = sumtueMinutes;
    else if (day === 3) minutes = sumthurMinutes;
    else if (day === 4) minutes = sumfriMinutes;

    classBlockLength = minutes * 60;

    console.log("📅 Using class length:", minutes, "minutes");
    console.log("📊 SumMon minutes:", summonMinutes);
    console.log("📊 SumTue minutes:", sumtueMinutes);
    console.log("📊 SumThur minutes:", sumthurMinutes);
    console.log("📊 SumFri minutes:", sumfriMinutes);
}

  

/* ======================================================
   CALCULATE TOTAL CLASS TIME
====================================================== */
function calculateTotalTime() {

    if (!window.workoutData || !window.workoutData.length) {
        console.warn("Workout still loading...");
        return;
    }

    const work = parseInt(document.getElementById("workTime").value, 10) || 0;
    const rest = parseInt(document.getElementById("restTime").value, 10) || 0;

    let prepTotal = 0;
    let workoutTotal = 0;
    let breakTotal = 0;

    /* ---------- PREP BLOCKS ---------- */
    prepTotal += dressOutDuration;
    prepTotal += dynamicStretchDuration;

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
    applyDaySpecificClassLength();

// ⭐ Force fresh class time calculation
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
    currentPhase = "dress";
    timeLeft = dressOutDuration;

      
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
    document.querySelector(".core-lift-title").textContent = set.coreLift;
    document.querySelector(".core-reps").textContent = "Reps: " + set.coreReps;
    document.querySelector(".core-percent").textContent = "Percentage: " + set.percentage;

    // AUX
    document.querySelector(".aux-lift-title").textContent = set.auxLift;
    document.querySelector(".aux-reps").textContent = "Reps: " + set.auxReps;

    // MOVEMENT
    document.querySelector(".movement-title").textContent = set.movement;
    document.querySelector(".movement-reps").textContent = "Reps/Time: " + set.movementReps;
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

    if (day === 1) minutes = summonMinutes;
    else if (day === 2) minutes = sumtueMinutes;
    else if (day === 3) minutes = sumthurMinutes;
    else if (day === 4) minutes = sumfriMinutes;

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

    if (autoStartTimer) clearInterval(autoStartTimer);

    autoStartTimer = setInterval(() => {

        if (!autoStartEnabled) return;
        if (isRunning) return;

        const now = getEffectiveNow();
        const day = now.getDay();

        if (todayOnlyMode && (day === 0 || day === 6)) return;

        let todaySchedule = [];

        if (day === 1) minutes = summonMinutes;
    else if (day === 2) minutes = sumtueMinutes;
    else if (day === 3) minutes = sumthurMinutes;
    else if (day === 4) minutes = sumfriMinutes;
        else return;

        const currentTotalSeconds =
            now.getHours() * 3600 +
            now.getMinutes() * 60 +
            now.getSeconds();

        for (const raw of todaySchedule) {

            // 🔥 supports: "06:10,06:58"
            const times = raw.split(",").map(t => t.trim());

            for (const timeStr of times) {

                if (!timeStr.includes(":")) continue;

                const parts = timeStr.split(":");

                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);

                if (isNaN(h) || isNaN(m)) continue;

                const targetTotalSeconds = h * 3600 + m * 60;

                // 🔥 60-second window (instead of 5)
                if (
                    currentTotalSeconds >= targetTotalSeconds &&
                    currentTotalSeconds < targetTotalSeconds + 60 &&
                    lastAutoStartMinute !== timeStr
                ) {
                    lastAutoStartMinute = timeStr;

                    console.log("🔔 Auto starting:", timeStr);
                    startTimer();
                    return;
                }
            }
        }

    }, 1000);
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

    if (today === 1) return "1830705073";
    if (today === 2 || today === 3) return "313721530";
    if (today === 4 || today === 5) return "1752992010";

    return "1830705073";
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
    for (let i = currentSet; i < window.workoutData.length; i++) {
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
            currentSet = 0;
            displaySetNumber = 0;

            loadSetData(0)

            timeLeft = getWorkDuration();
            phaseJustChanged = true;
            speakLift();
            break;

        case "work": {
            rotateQuadrants();
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

        const nextItem = window.workoutData[currentSet] || null;

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

            const nextItem = window.workoutData[currentSet] || null;

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


/* ======================================================
   INITIAL PAGE LOAD
====================================================== */

window.addEventListener("DOMContentLoaded", async () => {

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

        applyDaySpecificClassLength();

        totalSeconds = classBlockLength;
        originalTotalSeconds = classBlockLength;
        updateTotalDisplay();

        // 🔥 IMPORTANT: ensure function exists BEFORE calling
        if (typeof loadWorkout !== "function") {
            console.error("❌ loadWorkout is NOT defined");
            return;
        }

        await loadWorkout();
loadSetData(0);

// 🔥 START TIMER AUTOMATICALLY
startTimer();

// optional: keep this if using schedules
setTimeout(autoDetectActiveClass, 2000);

    } catch (err) {
        console.error("🔥 CRITICAL INIT ERROR:", err);
    }

});

  


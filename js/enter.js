/* ========================================
   🔥 ELITE V3 ENTER ENGINE (FINAL PROD)
   ======================================== */

/* ========================================
   INIT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  focusFirstInput();
  setupEnterSubmit();
});

/* ========================================
   HELPERS
   ======================================== */

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function toNumber(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ========================================
   WAIT FOR SCHOOL CONFIG
   ======================================== */

function waitForConfig(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (window.SCHOOL_CONFIG) {
        return resolve(window.SCHOOL_CONFIG);
      }

      if (Date.now() - start > timeout) {
        return reject("SCHOOL_CONFIG not loaded");
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

/* ========================================
   ⚖️ WEIGHT CLASS SYSTEM
   ======================================== */

function getWeightClass(weight) {
  if (weight <= 120) return "100";
  if (weight <= 140) return "121";
  if (weight <= 160) return "141";
  if (weight <= 180) return "161";
  if (weight <= 195) return "181";
  if (weight <= 210) return "196";
  if (weight <= 225) return "211";
  if (weight <= 240) return "226";
  if (weight <= 255) return "241";
  if (weight <= 270) return "256";
  if (weight <= 285) return "271";
  if (weight <= 300) return "286";
  return "301+";
}

/* ========================================
   MAIN SAVE FUNCTION
   ======================================== */

async function saveAthlete() {

  const btn = document.querySelector(".save-btn");
  if (btn) btn.disabled = true;

  try {
    const config = await waitForConfig();

    if (!config.submitURL) {
      alert("❌ No submit URL configured");
      throw new Error("Missing submitURL");
    }

    console.log("🚀 Submitting to:", config.submitURL);

    const entry = buildEntry();

    if (!validateEntry(entry)) {
      if (btn) btn.disabled = false;
      return;
    }

    const res = await sendToGoogle(entry, config.submitURL);

    const text = await res.text();
    console.log("✅ Response:", text);

    showMessage("✅ Saved to Google Sheets!", "success");

  } catch (err) {
    console.warn("⚠️ Cloud save failed, using offline:", err);

    const entry = buildEntry();
    saveOffline(entry);

    showMessage("⚠️ Offline — saved locally", "warning");
  }

  clearForm();

  if (btn) btn.disabled = false;
}

/* ========================================
   BUILD ENTRY
   ======================================== */

function buildEntry() {

  const weight = toNumber(getValue("weight"));

  const entry = {
    name: getValue("name"),
    date: getValue("date") || todayISO(),
    hour: getValue("hour"),
    grade: getValue("grade"),
    weight,

    bench: toNumber(getValue("bench")),
    squat: toNumber(getValue("squat")),
    clean: toNumber(getValue("clean")),

    vertical: toNumber(getValue("vertical")),
    broad: toNumber(getValue("broad")),
    medball: toNumber(getValue("medball")),

    agility: toNumber(getValue("agility")),
    ten: toNumber(getValue("ten")),
    forty: toNumber(getValue("forty")),
    situps: toNumber(getValue("situps")),

    weightClass: getWeightClass(weight)
  };

  return entry;
}

/* ========================================
   VALIDATION
   ======================================== */

function validateEntry(entry) {

  if (!entry.name) {
    showMessage("Enter athlete name", "error");
    return false;
  }

  if (!entry.weight) {
    showMessage("Enter weight", "error");
    return false;
  }

  return true;
}

/* ========================================
   🚀 API CALL (CORS FIXED)
   ======================================== */

async function sendToGoogle(entry, url) {

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(entry) // ✅ NO headers (fixes CORS)
  });
}

/* ========================================
   OFFLINE SAVE
   ======================================== */

function saveOffline(entry) {

  let data = [];

  try {
    data = JSON.parse(localStorage.getItem("athleteScores")) || [];
  } catch {
    data = [];
  }

  data.push(entry);

  localStorage.setItem("athleteScores", JSON.stringify(data));
}

/* ========================================
   UI HELPERS
   ======================================== */

function clearForm() {
  document.querySelectorAll("input, select").forEach(el => {
    el.value = "";
  });

  focusFirstInput();
}

function showMessage(msg, type) {

  let el = document.getElementById("formMessage");

  if (!el) {
    el = document.createElement("div");
    el.id = "formMessage";
    el.style.marginTop = "15px";
    el.style.textAlign = "center";
    document.querySelector(".card")?.appendChild(el);
  }

  el.textContent = msg;

  el.style.color =
    type === "success" ? "#00e676" :
    type === "error" ? "#ff5252" :
    "#ffd740";

  setTimeout(() => {
    el.textContent = "";
  }, 3000);
}

/* ========================================
   UX BOOSTS
   ======================================== */

function focusFirstInput() {
  document.getElementById("name")?.focus();
}

function setupEnterSubmit() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const active = document.activeElement;

      if (active && ["INPUT", "SELECT"].includes(active.tagName)) {
        e.preventDefault();
        saveAthlete();
      }
    }
  });
}

/* ========================================
   🔥 MAKE GLOBAL (CRITICAL)
   ======================================== */

window.saveAthlete = saveAthlete;

// =====================
// 1) STATE
// =====================
let stopCount   = 0;
let citeCount   = 0;
let arrestCount = 0;
let ebpCount    = 0;
let log = JSON.parse(localStorage.getItem("log") || "[]");
let serviceDay = localStorage.getItem("serviceDay") || currentServiceDay();

const PRESS_THRESHOLD_MS = 400;

// =====================
// 2) ELEMENTS
// =====================
const stopBtn    = document.getElementById("stopBtn");
const citeBtn    = document.getElementById("citeBtn");
const arrestBtn  = document.getElementById("arrestBtn");
const ebpBtn     = document.getElementById("ebpBtn");
const logModal     = document.getElementById("logModal");
const logModalBody = document.getElementById("logModalBody");
const logCloseBtn  = document.getElementById("logCloseBtn");
const viewLogBtn = document.getElementById("viewLogBtn");


// =====================
/* 3) LOAD SAVED COUNTS */
// =====================
const sStop   = localStorage.getItem("stopCount");
const sCite   = localStorage.getItem("citeCount");
const sArrest = localStorage.getItem("arrestCount");
const sEbp    = localStorage.getItem("ebpCount");

if (sStop   !== null) stopCount   = parseInt(sStop,   10);
if (sCite   !== null) citeCount   = parseInt(sCite,   10);
if (sArrest !== null) arrestCount = parseInt(sArrest, 10);
if (sEbp    !== null) ebpCount    = parseInt(sEbp,    10);

// =====================
// 4) HELPERS
// =====================
function currentServiceDay(d = new Date()) {
  const x = new Date(d);
  if (x.getHours() < 6) x.setDate(x.getDate() - 1); // before 06:00 counts as yesterday
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function renderLogText() {
  if (!log.length) return "No entries yet.";
  return log.map(e => {
    const t = e.totals;
    return `${e.date}  stops:${t.stop}  cites:${t.cite}  arrests:${t.arrest}  ebp:${t.ebp}`;
  }).join("\n");
}

function currentMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // "YYYY-MM"
}

function fmtMMDD(yyyyMmDd) {
  // input "YYYY-MM-DD" -> "MM/DD"
  return `${yyyyMmDd.slice(5,7)}/${yyyyMmDd.slice(8,10)}`;
}

// Renders only the entries for the current calendar month
function renderCurrentMonthList() {
  const container = document.getElementById("monthList");
  const monthKey = currentMonthKey();

  // Filter log entries for this month
  const entries = log.filter(e => e.date.startsWith(monthKey));

  if (!entries.length) {
    container.innerHTML = `<div class="month-item"><span class="month-date">—</span><span class="month-metrics">No entries this month yet.</span></div>`;
    return;
  }

  // Sort ascending by date so early days appear first
  entries.sort((a,b) => a.date.localeCompare(b.date));

  // Build DOM
  const frag = document.createDocumentFragment();
  entries.forEach(e => {
    const row = document.createElement("div");
    row.className = "month-item";

    const dateEl = document.createElement("span");
    dateEl.className = "month-date";
    dateEl.textContent = fmtMMDD(e.date);

    const t = e.totals;
    const metrics = document.createElement("span");
    metrics.className = "month-metrics";
    // Order per your example: Arrests, Citations, then the rest inline
    

    metrics.innerHTML = 
  metrics.innerHTML = `
  <span class="badge">
    <!-- Stop (car) -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="16" height="16" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="7" rx="2"></rect>
      <path d="M3 11l1-4h16l1 4"></path>
      <circle cx="7.5" cy="18" r="1.5"></circle>
      <circle cx="16.5" cy="18" r="1.5"></circle>
    </svg>
    ${t.stop}
  </span>
  <span class="badge">
    <!-- Citation (document) -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="16" height="16" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2h9l5 5v15H6z"></path>
      <path d="M14 2v6h6"></path>
      <line x1="8" y1="13" x2="16" y2="13"></line>
      <line x1="8" y1="17" x2="16" y2="17"></line>
    </svg>
    ${t.cite}
  </span>
  <span class="badge">
    <!-- Arrest (handcuffs) -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="16" height="16" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="7" cy="17" r="3"></circle>
      <circle cx="17" cy="7" r="3"></circle>
      <path d="M9.5 14.5l5-5"></path>
    </svg>
    ${t.arrest}
  </span>
  <span class="badge">
    <!-- EBP (map pin) -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="16" height="16" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"></path>
      <circle cx="12" cy="11" r="2"></circle>
    </svg>
    ${t.ebp}
  </span>
`;

  



    row.appendChild(dateEl);
    row.appendChild(metrics);
    frag.appendChild(row);
  });

  container.innerHTML = "";
  container.appendChild(frag);
}


// Turn "YYYY-MM-DD" -> "YYYY-MM"
function monthKeyFromDate(dateStr) {
  return dateStr.slice(0, 7);
}

// Build an index { 'YYYY-MM': [entries...] }
function buildMonthIndex() {
  const idx = {};
  for (const e of log) {
    const key = monthKeyFromDate(e.date);
    (idx[key] ||= []).push(e);
  }
  return idx;
}

// Create .txt and download it for a single month
function downloadMonthTxt(monthKey, entries) {
  const lines = entries.map(e => {
    const t = e.totals;
    return `${e.date}  stops:${t.stop}  cites:${t.cite}  arrests:${t.arrest}  ebp:${t.ebp}`;
  });
  const text = lines.join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stattrak_${monthKey}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderMonthPicker() {
  const idx = buildMonthIndex();
  const months = Object.keys(idx).sort().reverse(); // newest first

  if (!months.length) {
    logModalBody.textContent = "No monthly logs yet.";
    return;
  }

  // Build a simple list of buttons
  const frag = document.createDocumentFragment();
  const title = document.createElement("div");
  title.textContent = "Choose a month to download:";
  title.style.marginBottom = "8px";
  frag.appendChild(title);

  months.forEach(m => {
    const btn = document.createElement("button");
    // Parse "YYYY-MM"
    const [year, month] = m.split("-");
    const date = new Date(year, month - 1); 
    btn.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });
// → "August 2025"

    btn.style.width = "100%";
    btn.style.margin = "6px 0";
    btn.style.textAlign = "center";
    btn.addEventListener("click", () => downloadMonthTxt(m, idx[m]));
    frag.appendChild(btn);
  });

  // Swap the modal body content
  logModalBody.innerHTML = "";
  logModalBody.appendChild(frag);
}


function openLogModal() {
  renderMonthPicker();                 // show the list right away
  logModal.classList.add("is-open");
  logModal.setAttribute("aria-hidden", "false");
}



function closeLogModal() {
  logModal.classList.remove("is-open");
  logModal.setAttribute("aria-hidden", "true");
}


function saveAll() {
  localStorage.setItem("stopCount",   stopCount);
  localStorage.setItem("citeCount",   citeCount);
  localStorage.setItem("arrestCount", arrestCount);
  localStorage.setItem("ebpCount",    ebpCount);
  localStorage.setItem("serviceDay",  serviceDay);
  localStorage.setItem("log",         JSON.stringify(log));
}

function renderAll() {
  stopBtn.querySelector(".btn-count").textContent   = stopCount;
  citeBtn.querySelector(".btn-count").textContent   = citeCount;
  arrestBtn.querySelector(".btn-count").textContent = arrestCount;
  ebpBtn.querySelector(".btn-count").textContent    = ebpCount;
}




function exportLog() {
  if (!log.length) {
    alert("No log entries to export.");
    return;
  }
  const lines = log.map(entry => {
    const t = entry.totals;
    return `${entry.date}  stops:${t.stop}  cites:${t.cite}  arrests:${t.arrest}  ebp:${t.ebp}`;
  });
  const text = lines.join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stattrak_log.txt";
  a.click();
  URL.revokeObjectURL(url);
}

// Long-press helper: attach to any button/counter pair
function attachLongPress(button, getCount, setCount) {
  let pressTimer = null;
  let isLongPress = false;

  viewLogBtn.addEventListener("click", openLogModal);
logCloseBtn.addEventListener("click", closeLogModal);
logModal.addEventListener("click", (e) => {
  if (e.target.dataset.close) closeLogModal(); // click backdrop to close
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLogModal();
});


  button.addEventListener("pointerdown", () => {
    isLongPress = false;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      setCount(Math.max(0, getCount() - 1)); // decrement
      saveAll();
      renderAll();
    }, PRESS_THRESHOLD_MS);
  });

  button.addEventListener("pointerup", () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (!isLongPress) {
      setCount(getCount() + 1); // increment
      saveAll();
      renderAll();
    }
    isLongPress = false;
  });

  button.addEventListener("pointerleave", () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    isLongPress = false;
  });

  button.addEventListener("pointercancel", () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    isLongPress = false;
  });

  // Prevent context menu on long hold (mobile/desktop)
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}




// =====================
// 5) ATTACH HANDLERS
// =====================
attachLongPress(stopBtn,   () => stopCount,   v => (stopCount   = v));
attachLongPress(citeBtn,   () => citeCount,   v => (citeCount   = v));
attachLongPress(arrestBtn, () => arrestCount, v => (arrestCount = v));
attachLongPress(ebpBtn,    () => ebpCount,    v => (ebpCount    = v));




// =====================
// 6) ROLLOVER ON LOAD
// =====================
const nowDay = currentServiceDay();
if (serviceDay !== nowDay) {
  // Log the completed day
  log.push({
    date: serviceDay,
    totals: { stop: stopCount, cite: citeCount, arrest: arrestCount, ebp: ebpCount }
  });
  // Zero for new day
  stopCount = citeCount = arrestCount = ebpCount = 0;
  serviceDay = nowDay;
  saveAll();
  renderAll();
  renderCurrentMonthList();
}

// First paint
renderAll();
renderCurrentMonthList();


// =====================
// 7) ROLLOVER WHILE OPEN
// =====================
setInterval(() => {
  const cur = currentServiceDay();
  if (cur !== serviceDay) {
    log.push({
      date: serviceDay,
      totals: { stop: stopCount, cite: citeCount, arrest: arrestCount, ebp: ebpCount }
    });
    stopCount = citeCount = arrestCount = ebpCount = 0;
    serviceDay = cur;
    saveAll();
    renderAll();
    renderCurrentMonthList();
  }
}, 60 * 1000);

/**
 * Mercedes-Benz Central Warranty Gateway & Operations Engine
 * Version: 2026.08 Release
 */

// ==========================================================================
// 1. GLOBAL STATE & DATASETS
// ==========================================================================
const MB_WARRANTY_CLAIMS = {
  "RO-88301": {
    roNumber: "RO-88301",
    model: "2024 Mercedes-Benz S580 4MATIC Sedan",
    vin: "WD1702951A8271049",
    mileage: "14,280 MILES",
    tech: "Marcus Vance (#1042 - Master Certified)",
    advisor: "Sarah Lin (#8821)",
    foreman: "D. Henderson (Foreman Signature Verified)",
    bay: "BAY 01 (Heavy Diagnostic Lift)",
    submittedVal: "$2,779.00",
    paidVal: "$2,779.00",
    variance: "$0.00",
    status: "PAID",
    score: 94,
    grade: "WIS GRADE: A (READY TO SUBMIT)",
    verdict: "Claim adheres strictly to Daimler AG warranty policies with verified diagnostic labor trees and required stretch fastener part numbers.",
    complaint: "Customer states Check Engine Light is illuminated; transmission slips intermittently and shifts harshly between 2nd and 3rd gear.",
    cause: "Connected XENTRY with Midtronics battery maintainer. Retrieved fault code P073000 (Incorrect Gear Ratio). Followed WIS guided test tree. Found internal pressure solenoid sticking in electrohydraulic valve body.",
    correction: "Replaced electrohydraulic control unit (VGS) per WIS AR27.10-P-7021. Installed new oil pan gasket and 10x one-time aluminum stretch bolts (tightened to 4 Nm + 90°). Refilled 7.5L MB 236.17 ATF. Executed SCN coding and completed adaptation road test.",
    hardware: [
      { name: "Aluminum Pan Screws (M6x25)", part: "A0029908303", qty: "10 Qty", status: "VERIFIED BILLED", rule: "WIS AR27.10-P-7021 (Yield Angle)" },
      { name: "Oil Pan Molded Gasket", part: "A7252710180", qty: "1 Qty", status: "VERIFIED BILLED", rule: "Single Use Gasket" },
      { name: "MB 236.17 Blue ATF Fluid", part: "A0029890602", qty: "8 Liters", status: "VERIFIED SPEC", rule: "Specification 236.17" }
    ],
    badges: ["Quick Test Attached", "Punch Aligned", "WIS AR Ref", "Fasteners Billed"],
    appealLetter: `MERCEDES-BENZ WARRANTY AUDIT APPEALS COMMITTEE
Attn: Central Warranty Services & Claims Reconsideration Department

Subject: Formal Warranty Claim Appeal & Reversal Request
Repair Order: RO-88301 | VIN: WD1702951A8271049 | Amount: $2,779.00

Dear Warranty Reconsideration Team,

This document represents the formal compliance dossier for Repair Order #RO-88301. The electrohydraulic control unit (VGS) replacement was executed in rigorous adherence to WIS AR27.10-P-7021.

TECHNICAL & POLICY JUSTIFICATIONS:
1. Diagnostic Verification: Stored DTC P073000 was confirmed using XENTRY Diagnosis with continuous Midtronics battery voltage stabilization (13.8V).
2. Hardware Compliance: All 10x single-use aluminum stretch fasteners (Part # A0029908303) were renewed and torqued to 4 Nm + 90° specification.
3. Fluid Specification: Refilled with factory-approved MB 236.17 automatic transmission fluid.
4. Adaptations: SCN flash coding and shift adaptation procedures were successfully written to the VGS.

The claim complies with all Mercedes-Benz warranty audit standards and is verified for full credit approval.

Respectfully submitted,
Amanda M. - Warranty Director (#MB-7492)`
  },

  "RO-88412": {
    roNumber: "RO-88412",
    model: "2023 Mercedes-Benz GLE 450 4MATIC SUV",
    vin: "4JG1671591B339102",
    mileage: "26,140 MILES",
    tech: "Christian Ramirez (#1088 - Chassis Specialist)",
    advisor: "David Kim (#8834)",
    foreman: "D. Henderson (Foreman Signature Verified)",
    bay: "BAY 02 (Alignment & Suspension Rack)",
    submittedVal: "$1,640.00",
    paidVal: "$1,120.00",
    variance: "-$520.00",
    status: "VARIANCE",
    score: 72,
    grade: "WIS GRADE: C (ACTION REQUIRED)",
    verdict: "Front axle lower control arm replaced. Subframe torque-to-yield stretch bolts were missing from billed parts lines, and Romess ride height baseline degrees were omitted from the alignment sheet.",
    complaint: "Customer states knocking and clunking noise audible from front suspension when traveling over speed bumps and during low-speed parking lot turns.",
    cause: "Raised vehicle on 2-post lift. Performed suspension lever test per WIS AR33.10-P-0100. Discovered torn hydraulic rubber bushing on front left lower control arm with silicone dampening fluid leakage.",
    correction: "Replaced front left lower control arm assembly per WIS AR33.10-P-0100. Replaced subframe stretch bolts. Conducted full 4-wheel electronic alignment using Romess inclinometer and calibrated steering angle sensor (SAS) to 0.0°.",
    hardware: [
      { name: "Subframe M14 Stretch Bolts", part: "A0009904407", qty: "4 Qty", status: "MISSING ON INVOICE", rule: "WIS AR33.10-P-0100 (Yield Fastener)" },
      { name: "Self-Locking Camber Nuts", part: "N000000003175", qty: "2 Qty", status: "VERIFIED BILLED", rule: "Single Use" },
      { name: "Romess Ride Height Printout", part: "ALIGN-ROMESS", qty: "1 Sheet", status: "ACTION REQUIRED", rule: "Mercedes MB Alignment Policy" }
    ],
    badges: ["Suspension Leak Verified", "Stretch Bolts Missing", "Romess Pending"],
    appealLetter: `MERCEDES-BENZ WARRANTY AUDIT APPEALS COMMITTEE
Attn: Central Warranty Claims Division

Subject: Reconsideration of Underpaid Warranty Claim
Repair Order: RO-88412 | VIN: 4JG1671591B339102 | Disputed Variance: $520.00

Dear Claims Adjudication Team,

We are appealing the $520.00 labor variance on RO-88412 regarding front lower control arm replacement and four-wheel alignment.

RECONSIDERATION GROUNDS:
1. Physical Defect: The hydraulic control arm bushing experienced internal membrane failure leading to total loss of dampening fluid, constituting a warrantable manufacturing defect under NVLW.
2. Alignment Flat Rate: Wheel alignment operation (Op 40-6500) was technically mandated due to suspension subframe unbolting. Romess ride height degree measurements (+4.2° Front / -1.8° Rear) have now been appended to the Paperless Xentry folder.
3. Fastener Rectification: Fastener line item for 4x M14 stretch bolts has been updated in DMS reconciliation.

We respectfully request reversal of the $520.00 variance and issuance of full credit.

Sincerely,
Amanda M. - Warranty Director (#MB-7492)`
  },

  "RO-88509": {
    roNumber: "RO-88509",
    model: "2024 Mercedes-Benz E450 All-Terrain Wagon",
    vin: "W1K2132591A902814",
    mileage: "8,920 MILES",
    tech: "Derrick Vance (#1031 - Engine Specialist)",
    advisor: "Sarah Lin (#8821)",
    foreman: "D. Henderson (Foreman Signature Verified)",
    bay: "BAY 03 (Engine & Fuel Injection Bay)",
    submittedVal: "$3,120.00",
    paidVal: "$3,120.00",
    variance: "$0.00",
    status: "PAID",
    score: 98,
    grade: "WIS GRADE: A+ (PERFECT AUDIT)",
    verdict: "High-pressure fuel injection warranty claim complete with all copper crush washers, hold-down stretch bolts, and high-pressure fuel rail leak-check logs.",
    complaint: "Customer states engine misfires under hard acceleration and Check Engine Light flashes.",
    cause: "Connected XENTRY with Midtronics maintainer. Retrieved fault codes P030100 (Cylinder 1 Misfire) and P030000. Followed WIS guided test tree. High-pressure direct piezo injector #1 piezo actuator internal short-circuit.",
    correction: "Replaced high-pressure direct fuel injector on cylinder 1 per WIS AR07.03-P-6534. Installed new copper combustion seal washer and new injector hold-down stretch bolt. Programmed 14-digit injector voltage IMA code into ME engine control unit. Performed fuel rail pressure leak-down test.",
    hardware: [
      { name: "Copper Seal Washer", part: "A0009906707", qty: "1 Qty", status: "VERIFIED BILLED", rule: "WIS AR07.03-P-6534" },
      { name: "Injector Hold-Down Bolt", part: "A0009902302", qty: "1 Qty", status: "VERIFIED BILLED", rule: "Torque-to-Yield (7 Nm + 90°)" },
      { name: "High Pressure Fuel Line Clip", part: "A0009951101", qty: "2 Qty", status: "VERIFIED BILLED", rule: "Single Use Clip" }
    ],
    badges: ["IMA Coding Verified", "Leak Test Passed", "One-Time Hardware 100%"],
    appealLetter: `MERCEDES-BENZ WARRANTY AUDIT APPEALS COMMITTEE
Attn: Engine Warranty Management

Subject: Certified Documentation Submission
Repair Order: RO-88509 | VIN: W1K2132591A902814 | Total: $3,120.00

This repair order represents exemplary compliance with WIS AR07.03-P-6534. IMA 14-digit calibration stamps and 200-bar fuel rail pressure verification curves are archived in Central Xentry. Approved for immediate payment without review hold.

Amanda M. - Warranty Director`
  },

  "RO-88620": {
    roNumber: "RO-88620",
    model: "2023 Mercedes-AMG GT 53 4-Door Coupe",
    vin: "W1K2906591A019283",
    mileage: "18,450 MILES",
    tech: "Marcus Vance (#1042 - Master Certified)",
    advisor: "Michael Chen (#8819)",
    foreman: "D. Henderson (Foreman Signature Verified)",
    bay: "BAY 02 (Alignment & Suspension Rack)",
    submittedVal: "$4,250.00",
    paidVal: "$4,250.00",
    variance: "$0.00",
    status: "PAID",
    score: 96,
    grade: "WIS GRADE: A (READY TO SUBMIT)",
    verdict: "AIRMATIC compressor and valve block replaced under warranty. Pneumatic pressure test logs and Romess ride height baseline confirmed.",
    complaint: "Customer states instrument cluster displays 'AIRMATIC Malfunction' warning message and vehicle sits low on left rear corner after parking overnight.",
    cause: "Connected XENTRY. Stored code C102500 (Compressor Pressure Low). Performed pneumatic pressure fill test; valve block internal solenoid 2 leaking to ambient air.",
    correction: "Replaced AIRMATIC pneumatic compressor and distribution valve block assembly per WIS AR32.22-P-1000. Replaced intake air filter and relay. Calibrated suspension level sensors with Romess inclinometer.",
    hardware: [
      { name: "AIRMATIC Compressor Relay", part: "A0009828023", qty: "1 Qty", status: "VERIFIED BILLED", rule: "Mandatory Relay Replacement" },
      { name: "Compressor Intake Filter", part: "A2203200004", qty: "1 Qty", status: "VERIFIED BILLED", rule: "Single Use Filter" },
      { name: "Brass Pneumatic Line Fittings", part: "A0003270369", qty: "5 Qty", status: "VERIFIED BILLED", rule: "One-Time Olive Ferrules" }
    ],
    badges: ["Pneumatic Test Attached", "Relay Renewed", "Level Calibrated"],
    appealLetter: `MERCEDES-BENZ WARRANTY AUDIT APPEALS COMMITTEE
Attn: AMG Chassis & Suspension Warranty

Subject: AIRMATIC Claim Documentation
Repair Order: RO-88620 | VIN: W1K2906591A019283 | Value: $4,250.00

Claim fully compliant with pneumatic pressure test curves and level sensor calibration printouts attached. Fully documented.`
  },

  "RO-88734": {
    roNumber: "RO-88734",
    model: "2025 Mercedes-Benz GLC 300 4MATIC SUV",
    vin: "W1N2546591R110294",
    mileage: "3,410 MILES",
    tech: "Alex Torres (#1094 - Diagnostic Specialist)",
    advisor: "Sarah Lin (#8821)",
    foreman: "D. Henderson (Foreman Signature Verified)",
    bay: "BAY 04 (Electrical & SCN Flash Terminal)",
    submittedVal: "$890.00",
    paidVal: "$890.00",
    variance: "$0.00",
    status: "PAID",
    score: 95,
    grade: "WIS GRADE: A (READY TO SUBMIT)",
    verdict: "MBUX NTG7 Central Gateway Control Unit SCN flash update performed under factory bulletin LI82.70-P-074120.",
    complaint: "Customer states central MBUX touchscreen reboots intermittently while using Apple CarPlay navigation.",
    cause: "Connected XENTRY with Midtronics maintainer. Retrieved DTC U118700. Software version mismatch in Hermes communication module.",
    correction: "Updated Central Gateway and MBUX Head Unit software to latest factory release using XENTRY Flash per LI82.70-P-074120. Executed SCN coding and verified zero active faults.",
    hardware: [
      { name: "Software License Token", part: "FLASH-NTG7", qty: "1 Op", status: "VERIFIED BILLED", rule: "Op 54-0650" }
    ],
    badges: ["Flash Log Stored", "Midtronics Attached", "LI Bulletin Reference"],
    appealLetter: `MERCEDES-BENZ WARRANTY AUDIT APPEALS COMMITTEE
Attn: MBUX Telematics Warranty

Subject: Software Flash Claim RO-88734
Repair Order: RO-88734 | VIN: W1N2546591R110294 | Total: $890.00

Software flash log and SCN confirmation code attached. Complies with LI82.70-P-074120.`
  }
};

const BAYS_DATA = [
  {
    id: "BAY-01",
    name: "BAY 01",
    type: "Heavy Diagnostic Lift",
    tech: "Marcus Vance",
    techBadge: "Master Certified",
    ro: "RO-88301",
    model: "2024 S580 4MATIC",
    task: "9G-Tronic VGS Replacement & Pan Yield Fasteners",
    status: "ACTIVE",
    statusText: "IN PROGRESS",
    timeElapsed: "01:45 / 03.8h",
    progress: 46
  },
  {
    id: "BAY-02",
    name: "BAY 02",
    type: "Romess Alignment & Suspension",
    tech: "Christian Ramirez",
    techBadge: "Chassis Master",
    ro: "RO-88412",
    model: "2023 GLE 450 4MATIC",
    task: "Lower Control Arm Bushing & 4-Wheel Romess Alignment",
    status: "CALIBRATION",
    statusText: "ROMESS MEASURE",
    timeElapsed: "02:10 / 02.4h",
    progress: 88
  },
  {
    id: "BAY-03",
    name: "BAY 03",
    type: "Direct Injection & High Pressure",
    tech: "Derrick Vance",
    techBadge: "Engine Specialist",
    ro: "RO-88509",
    model: "2024 E450 All-Terrain",
    task: "Piezo Injector IMA Coding & Fuel Rail Leak Test",
    status: "ACTIVE",
    statusText: "POST-TEST RUN",
    timeElapsed: "01:15 / 01.8h",
    progress: 70
  },
  {
    id: "BAY-04",
    name: "BAY 04",
    type: "SCN Flash & High-Voltage Bay",
    tech: "Alex Torres",
    techBadge: "Diagnostic Master",
    ro: "RO-88734",
    model: "2025 GLC 300 4MATIC",
    task: "MBUX NTG7 Software Flash & Hermes SCN Coding",
    status: "DIAG",
    statusText: "SCN FLASHING",
    timeElapsed: "00:40 / 01.0h",
    progress: 65
  }
];

const TANKS_DATA = [
  { lid: "LID-01", label: "Hydraulic Fluid (MB 345.0)", color: "#00FF66", level: 85, vol: "425L / 500L" },
  { lid: "LID-02", label: "Coolant Concentrate (MB 325.0)", color: "#FFB300", level: 42, vol: "210L / 500L" },
  { lid: "LID-03", label: "9G-Tronic ATF (MB 236.17 Blue)", color: "#00adef", level: 92, vol: "460L / 500L" },
  { lid: "LID-04", label: "Synthetic 0W-40 (MB 229.52)", color: "#a855f7", level: 68, vol: "340L / 500L" }
];

const RECONCILIATION_DATA = [
  { ro: "RO-88301", date: "2026-08-29", model: "2024 S580", tech: "Marcus Vance", submitted: "$2,779.00", paid: "$2,779.00", variance: "$0.00", reason: "100% Reconciled - Pan stretch bolts & VGS labor matched.", status: "PAID" },
  { ro: "RO-88412", date: "2026-08-28", model: "2023 GLE 450", tech: "Christian Ramirez", submitted: "$1,640.00", paid: "$1,120.00", variance: "-$520.00", reason: "Variance: Subframe stretch bolts missing; Romess degrees appended for appeal.", status: "VARIANCE" },
  { ro: "RO-88509", date: "2026-08-28", model: "2024 E450 Wagon", tech: "Derrick Vance", submitted: "$3,120.00", paid: "$3,120.00", variance: "$0.00", reason: "100% Reconciled - Direct injector IMA codes confirmed.", status: "PAID" },
  { ro: "RO-88620", date: "2026-08-27", model: "2023 AMG GT 53", tech: "Marcus Vance", submitted: "$4,250.00", paid: "$4,250.00", variance: "$0.00", reason: "100% Reconciled - AIRMATIC compressor & relay approved.", status: "PAID" },
  { ro: "RO-88734", date: "2026-08-27", model: "2025 GLC 300", tech: "Alex Torres", submitted: "$890.00", paid: "$890.00", variance: "$0.00", reason: "100% Reconciled - SCN flash log attached.", status: "PAID" },
  { ro: "RO-88190", date: "2026-08-26", model: "2024 C300 Sedan", tech: "Christian Ramirez", submitted: "$1,450.00", paid: "$1,450.00", variance: "$0.00", reason: "100% Reconciled - Steering rack harness bulletin applied.", status: "PAID" }
];

let activeSelectedClaim = "RO-88301";
let isThermalMode = false;
let isAiTelemetryOn = true;

// ==========================================================================
// 2. REQUIRED EXACT FUNCTION SPECIFICATION
// ==========================================================================
function jumpToVideoTime(timecode, label) {
  showToast(`Jumping to [${timecode}]: ${label}`, "success");
  const timeDisplay = document.getElementById("hudVideoElapsedTimer");
  if (timeDisplay) timeDisplay.textContent = `${timecode} / 02:15`;
}

// ==========================================================================
// 3. INITIALIZATION & CLOCK
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initSidebarNav();
  renderDashboardClaims();
  renderBays(BAYS_DATA);
  renderTanks(TANKS_DATA);
  onClaimSelected("RO-88301");
  renderReconciliationTable(RECONCILIATION_DATA);
  initHudCanvas();
  renderClaimCharts();
});

function initClock() {
  const clockEl = document.getElementById("hubLiveClock");
  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = `${now.toISOString().substring(11, 19)} UTC`;
    }
  }
  update();
  setInterval(update, 1000);
}

// ==========================================================================
// 4. SIDEBAR NAVIGATION CONTROLLER
// ==========================================================================
function initSidebarNav() {
  const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetView = btn.getAttribute("data-view");
      if (targetView) {
        switchView(targetView);
      }
    });
  });
}

function switchView(viewId) {
  // Update nav highlights
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(b => {
    if (b.getAttribute("data-view") === viewId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  // Update view visibility
  document.querySelectorAll(".view-section").forEach(sec => {
    if (sec.id === viewId) {
      sec.classList.add("active");
    } else {
      sec.classList.remove("active");
    }
  });

  showToast(`Switched to ${viewId.replace("view-", "").toUpperCase()} view`, "success");

  // Trigger chart or canvas re-draw if needed
  if (viewId === "view-dashboard") {
    renderClaimCharts();
  } else if (viewId === "view-videohud") {
    drawHudCanvasFrame();
  }
}

// ==========================================================================
// 5. EXECUTIVE DASHBOARD & CHARTS
// ==========================================================================
function renderDashboardClaims() {
  const tbody = document.getElementById("dashboardClaimsTableBody");
  if (!tbody) return;

  tbody.innerHTML = Object.values(MB_WARRANTY_CLAIMS).map(claim => {
    const isPaid = claim.status === "PAID";
    const statusTag = isPaid 
      ? `<span class="tag-status tag-pass">APPROVED</span>` 
      : `<span class="tag-status tag-warn">VARIANCE</span>`;

    return `
      <tr>
        <td class="font-mono font-bold text-cyan-400">${claim.roNumber}</td>
        <td>
          <div class="font-bold text-slate-100">${claim.model}</div>
          <div class="font-mono text-[10px] text-slate-400">${claim.vin}</div>
        </td>
        <td class="font-medium">${claim.tech}</td>
        <td>${claim.advisor}</td>
        <td class="max-w-xs truncate">${claim.complaint.substring(0, 55)}...</td>
        <td>${statusTag}</td>
        <td class="font-mono font-bold ${isPaid ? 'text-slate-400' : 'text-amber-400'}">${claim.variance}</td>
        <td>
          <button class="btn btn-xs btn-secondary" onclick="auditSpecificClaim('${claim.roNumber}')">
            <span>Audit</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function auditSpecificClaim(roNumber) {
  switchView("view-auditor");
  const sel = document.getElementById("claimSelector");
  if (sel) {
    sel.value = roNumber;
    onClaimSelected(roNumber);
  }
}

function refreshDashboardMetrics() {
  showToast("Refreshing live Mercedes-Benz DMS telemetry...", "success");
  const submittedEl = document.getElementById("kpi-submitted");
  const approvedEl = document.getElementById("kpi-approved");
  if (submittedEl) submittedEl.textContent = "$482,910";
  if (approvedEl) approvedEl.textContent = "$468,450";
  renderClaimCharts();
}

// Canvas-based crisp charts
function renderClaimCharts() {
  renderTrendChart();
  renderDonutChart();
}

function renderTrendChart() {
  const canvas = document.getElementById("claimTrendChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = (canvas.width = canvas.parentElement.clientWidth || 600);
  const h = (canvas.height = 230);

  ctx.clearRect(0, 0, w, h);

  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const submitted = [380, 410, 440, 465, 472, 482];
  const approved = [360, 395, 428, 452, 460, 468];

  const maxVal = 550;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  // Grid lines
  ctx.strokeStyle = "#1a2744";
  ctx.lineWidth = 1;
  ctx.font = "10px JetBrains Mono";
  ctx.fillStyle = "#64748b";

  for (let i = 0; i <= 4; i++) {
    const yVal = (maxVal / 4) * i;
    const y = h - padB - (yVal / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(`$${yVal}k`, 4, y + 3);
  }

  const stepX = chartW / (months.length - 1);

  // Draw Bars (Submitted)
  const barW = Math.min(24, stepX * 0.4);
  months.forEach((m, i) => {
    const x = padL + i * stepX;
    const val = submitted[i];
    const barH = (val / maxVal) * chartH;
    const y = h - padB - barH;

    const grad = ctx.createLinearGradient(0, y, 0, h - padB);
    grad.addColorStop(0, "rgba(0, 173, 239, 0.8)");
    grad.addColorStop(1, "rgba(0, 173, 239, 0.1)");

    ctx.fillStyle = grad;
    ctx.fillRect(x - barW / 2, y, barW, barH);
    ctx.strokeStyle = "#00adef";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, y, barW, barH);

    // Month Label
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText(m, x, h - 10);
  });

  // Draw Line (Approved)
  ctx.beginPath();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2.5;
  months.forEach((m, i) => {
    const x = padL + i * stepX;
    const val = approved[i];
    const y = h - padB - (val / maxVal) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots for Approved
  months.forEach((m, i) => {
    const x = padL + i * stepX;
    const val = approved[i];
    const y = h - padB - (val / maxVal) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function renderDonutChart() {
  const canvas = document.getElementById("categoryDonutChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = (canvas.width = canvas.height = 230);
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const thickness = 22;

  ctx.clearRect(0, 0, size, cy * 2);

  const categories = [
    { label: "Powertrain / 9G", pct: 0.38, color: "#00adef" },
    { label: "Chassis & Romess", pct: 0.28, color: "#a855f7" },
    { label: "MBUX & SCN", pct: 0.20, color: "#10b981" },
    { label: "One-Time Fasteners", pct: 0.14, color: "#f59e0b" }
  ];

  let currentAngle = -Math.PI / 2;

  categories.forEach(cat => {
    const sliceAngle = cat.pct * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, currentAngle, currentAngle + sliceAngle);
    ctx.arc(cx, cy, r - thickness, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.strokeStyle = "#0d1527";
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px JetBrains Mono";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("148 ROs", cx, cy - 8);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px Inter";
  ctx.fillText("97.0% Pass", cx, cy + 12);
}

// ==========================================================================
// 6. GARAGE & BAY TERMINAL
// ==========================================================================
function renderBays(bays) {
  const grid = document.getElementById("baysGrid");
  if (!grid) return;

  grid.innerHTML = bays.map(bay => {
    const badgeColor = bay.status === "ACTIVE" 
      ? "bg-emerald-950 text-emerald-300 border-emerald-800" 
      : bay.status === "CALIBRATION" 
      ? "bg-purple-950 text-purple-300 border-purple-800" 
      : "bg-cyan-950 text-cyan-300 border-cyan-800";

    return `
      <div class="bay-card">
        <div class="bay-header">
          <div>
            <div class="bay-num">${bay.name}</div>
            <div class="bay-type">${bay.type}</div>
          </div>
          <span class="badge-status ${badgeColor}">${bay.statusText}</span>
        </div>

        <div class="bay-ro-box">
          <div class="bay-ro-title">${bay.ro} • ${bay.model}</div>
          <div class="bay-ro-desc">${bay.task}</div>
        </div>

        <div class="bay-meta-grid">
          <div class="bay-meta-item">
            <span class="bay-meta-k">PRIMARY TECH</span>
            <span class="bay-meta-v">${bay.tech}</span>
          </div>
          <div class="bay-meta-item">
            <span class="bay-meta-k">TIME / FLAT RATE</span>
            <span class="bay-meta-v font-mono">${bay.timeElapsed}</span>
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Procedure Progress</span>
            <span>${bay.progress}%</span>
          </div>
          <div class="health-bar-bg">
            <div class="health-bar-fill" style="width: ${bay.progress}%;"></div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-800/60">
          <button class="btn btn-xs btn-secondary flex-1" onclick="auditSpecificClaim('${bay.ro}')">
            <span>Audit Claim</span>
          </button>
          <button class="btn btn-xs btn-primary flex-1" onclick="switchView('view-videohud')">
            <span>Live Camera</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function filterBays(type, btnEl) {
  document.querySelectorAll(".tab-pill-group .tab-pill").forEach(p => p.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  if (type === "ALL") {
    renderBays(BAYS_DATA);
  } else {
    const filtered = BAYS_DATA.filter(b => b.status === type);
    renderBays(filtered);
  }
}

function renderTanks(tanks) {
  const grid = document.getElementById("tanksGaugesGrid");
  if (!grid) return;

  grid.innerHTML = tanks.map(t => `
    <div class="tank-gauge-item">
      <div class="tank-info">
        <span class="font-bold text-slate-200">${t.label}</span>
        <span class="font-mono font-bold" style="color: ${t.color}">${t.level}%</span>
      </div>
      <div class="tank-progress-bg">
        <div class="tank-progress-bar" style="width: ${t.level}%; background-color: ${t.color}"></div>
      </div>
      <div class="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
        <span>Tank LID: ${t.lid}</span>
        <span>${t.vol}</span>
      </div>
    </div>
  `).join("");
}

function toggleAllBayStatus() {
  showToast("Re-polling workshop IoT sensor hubs & Xentry network...", "success");
  renderBays(BAYS_DATA);
}

// ==========================================================================
// 7. AI AUDIT ENGINE & CLAIM ADJUDICATION
// ==========================================================================
function onClaimSelected(roNumber) {
  activeSelectedClaim = roNumber;
  const claim = MB_WARRANTY_CLAIMS[roNumber];
  if (!claim) return;

  // 1. Meta strip
  const metaStrip = document.getElementById("claimMetaStrip");
  if (metaStrip) {
    metaStrip.innerHTML = `
      <span class="badge-status bg-slate-900 text-slate-200 border-slate-700 font-mono font-bold">${claim.roNumber}</span>
      <span class="badge-status bg-cyan-950 text-cyan-300 border-cyan-800">${claim.model}</span>
      <span class="badge-status bg-slate-900 text-slate-400 font-mono">${claim.vin}</span>
      <span class="badge-status bg-purple-950 text-purple-300 border-purple-800">Tech: ${claim.tech}</span>
    `;
  }

  // 2. 3C Story
  const compEl = document.getElementById("auditComplaintText");
  const causeEl = document.getElementById("auditCauseText");
  const corrEl = document.getElementById("auditCorrectionText");

  if (compEl) compEl.textContent = claim.complaint;
  if (causeEl) causeEl.textContent = claim.cause;
  if (corrEl) corrEl.textContent = claim.correction;

  // 3. Hardware table
  const hwList = document.getElementById("hardwareList");
  const hwTag = document.getElementById("hardwareStatusTag");
  if (hwList) {
    hwList.innerHTML = claim.hardware.map(item => `
      <div class="hardware-item">
        <div>
          <div class="font-bold text-slate-200">${item.name}</div>
          <div class="font-mono text-[10px] text-slate-400">Part: ${item.part} (${item.qty}) • Rule: ${item.rule}</div>
        </div>
        <span class="tag-status ${item.status.includes('MISSING') || item.status.includes('ACTION') ? 'tag-warn' : 'tag-pass'}">
          ${item.status}
        </span>
      </div>
    `).join("");
  }
  if (hwTag) {
    hwTag.className = `tag-status ${claim.score < 80 ? 'tag-warn' : 'tag-pass'}`;
    hwTag.textContent = claim.score < 80 ? 'ACTION REQUIRED' : 'COMPLIANT';
  }

  // 4. Score Ring & Badges
  const scoreNum = document.getElementById("auditScoreNum");
  const scoreGrade = document.getElementById("auditGrade");
  const scoreVerdict = document.getElementById("auditVerdict");
  const scoreCircle = document.getElementById("auditScoreCircle");
  const badgesWrap = document.getElementById("auditBadges");

  if (scoreNum) scoreNum.textContent = claim.score;
  if (scoreGrade) scoreGrade.textContent = claim.grade;
  if (scoreVerdict) scoreVerdict.textContent = claim.verdict;

  if (scoreCircle) {
    const dashOffset = 264 - (264 * claim.score) / 100;
    scoreCircle.style.strokeDashoffset = dashOffset;
    scoreCircle.style.stroke = claim.score >= 90 ? "#10b981" : claim.score >= 75 ? "#f59e0b" : "#ef4444";
  }

  if (badgesWrap) {
    badgesWrap.innerHTML = claim.badges.map(b => `
      <span class="badge-status bg-slate-900 text-slate-200 border-slate-700">${b}</span>
    `).join("");
  }

  // 5. Appeal letter
  const appealBox = document.getElementById("appealLetterContent");
  if (appealBox) {
    appealBox.textContent = claim.appealLetter;
  }

  // 6. Update Dispatch Preview
  updateDispatchSlip(claim);
}

function reEvaluateClaim() {
  showToast(`Running deep WIS 3C & factory compliance audit on ${activeSelectedClaim}...`, "success");
  onClaimSelected(activeSelectedClaim);
}

function copyStoryText() {
  const claim = MB_WARRANTY_CLAIMS[activeSelectedClaim];
  if (!claim) return;
  const fullText = `COMPLAINT:\n${claim.complaint}\n\nCAUSE:\n${claim.cause}\n\nCORRECTION:\n${claim.correction}`;
  navigator.clipboard.writeText(fullText).then(() => {
    showToast("Formatted 3C Story copied to clipboard!", "success");
  }).catch(() => {
    showToast("Copied 3C Story.", "success");
  });
}

function copyAppealLetter() {
  const claim = MB_WARRANTY_CLAIMS[activeSelectedClaim];
  if (!claim) return;
  navigator.clipboard.writeText(claim.appealLetter).then(() => {
    showToast("Official Appeal Letter copied to clipboard!", "success");
  }).catch(() => {
    showToast("Copied Appeal Letter.", "success");
  });
}

function exportCurrentAuditReport() {
  const claim = MB_WARRANTY_CLAIMS[activeSelectedClaim];
  if (!claim) return;
  const blob = new Blob([JSON.stringify(claim, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MB_Audit_${claim.roNumber}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported JSON report for ${claim.roNumber}`, "success");
}

// ==========================================================================
// 8. RECONCILIATION & TRANS-TRANSPARENCY
// ==========================================================================
function renderReconciliationTable(data) {
  const tbody = document.getElementById("reconciliationTableBody");
  if (!tbody) return;

  tbody.innerHTML = data.map(item => `
    <tr>
      <td class="font-mono font-bold text-cyan-400">${item.ro}</td>
      <td class="font-mono text-slate-400">${item.date}</td>
      <td class="font-bold text-slate-200">${item.model}</td>
      <td>${item.tech}</td>
      <td class="font-mono">${item.submitted}</td>
      <td class="font-mono text-emerald-400">${item.paid}</td>
      <td class="font-mono font-bold ${item.variance === '$0.00' ? 'text-slate-400' : 'text-amber-400'}">${item.variance}</td>
      <td class="text-xs max-w-sm">${item.reason}</td>
      <td>
        <span class="tag-status ${item.status === 'PAID' ? 'tag-pass' : 'tag-warn'}">${item.status}</span>
      </td>
    </tr>
  `).join("");
}

function filterReconciliationTable() {
  const term = (document.getElementById("reconSearchInput")?.value || "").toLowerCase();
  const filtered = RECONCILIATION_DATA.filter(item => {
    return item.ro.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      item.tech.toLowerCase().includes(term) ||
      item.reason.toLowerCase().includes(term);
  });
  renderReconciliationTable(filtered);
}

function setReconFilter(status, btnEl) {
  document.querySelectorAll(".filter-pills .filter-pill").forEach(p => p.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  if (status === "ALL") {
    renderReconciliationTable(RECONCILIATION_DATA);
  } else {
    const filtered = RECONCILIATION_DATA.filter(i => i.status === status);
    renderReconciliationTable(filtered);
  }
}

function triggerDmsSync() {
  showToast("Opening DMS C-File upload bridge...", "success");
}

function runAutoReconcile() {
  showToast("Auto-Reconciling 148 DMS claims against Daimler Credit Remittances...", "success");
  renderReconciliationTable(RECONCILIATION_DATA);
}

// ==========================================================================
// 9. VIDEO HUD & WORKSHOP TELEMETRY
// ==========================================================================
function initHudCanvas() {
  drawHudCanvasFrame();
}

function drawHudCanvasFrame() {
  const canvas = document.getElementById("hudCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#070c18";
  ctx.fillRect(0, 0, w, h);

  // Draw simulated workshop background geometry
  ctx.strokeStyle = "#142344";
  ctx.lineWidth = 2;

  // Floor perspective lines
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.4, h * 0.6);
  ctx.moveTo(w, h);
  ctx.lineTo(w * 0.6, h * 0.6);
  ctx.stroke();

  // Draw hydraulic lift posts
  ctx.fillStyle = "#0f1c38";
  ctx.fillRect(w * 0.2, h * 0.1, 40, h * 0.8);
  ctx.fillRect(w * 0.75, h * 0.1, 40, h * 0.8);

  // Draw Mercedes vehicle silhouette
  ctx.fillStyle = "#1e2d52";
  ctx.beginPath();
  ctx.roundRect(w * 0.28, h * 0.28, w * 0.44, h * 0.38, [20, 20, 10, 10]);
  ctx.fill();
  ctx.strokeStyle = "#00adef";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Star logo in center of car schematic
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.45, 24, 0, Math.PI * 2);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tech crosshair
  ctx.strokeStyle = "rgba(0, 173, 239, 0.4)";
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.35);
  ctx.lineTo(w * 0.5, h * 0.55);
  ctx.moveTo(w * 0.45, h * 0.45);
  ctx.lineTo(w * 0.55, h * 0.45);
  ctx.stroke();
}

function switchHudCamera(camId, camLabel, btnEl) {
  document.querySelectorAll(".camera-selector-strip .cam-btn").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  const labelEl = document.getElementById("hudActiveCamLabel");
  if (labelEl) labelEl.textContent = camLabel;

  showToast(`Switched HUD Feed to [${camId}]: ${camLabel}`, "success");
  drawHudCanvasFrame();
}

function toggleThermalMode() {
  isThermalMode = !isThermalMode;
  const wrap = document.querySelector(".hud-canvas-wrap");
  const btnLabel = document.getElementById("thermalBtnLabel");
  const modePill = document.getElementById("hudModePill");

  if (wrap) {
    if (isThermalMode) {
      wrap.classList.add("thermal-mode");
      if (btnLabel) btnLabel.textContent = "Thermal Vision: ON";
      if (modePill) {
        modePill.textContent = "THERMAL SPECTRUM";
        modePill.style.color = "#f59e0b";
        modePill.style.borderColor = "#f59e0b";
      }
      showToast("Thermal infrared sensor overlay enabled.", "warning");
    } else {
      wrap.classList.remove("thermal-mode");
      if (btnLabel) btnLabel.textContent = "Thermal Vision: OFF";
      if (modePill) {
        modePill.textContent = "OPTICAL SPECTRUM";
        modePill.style.color = "#10b981";
        modePill.style.borderColor = "#10b981";
      }
      showToast("Returned to optical standard spectrum.", "success");
    }
  }
}

function toggleAiTelemetry() {
  isAiTelemetryOn = !isAiTelemetryOn;
  const boxes = document.querySelectorAll(".hud-ai-box");
  const btnLabel = document.getElementById("telemetryBtnLabel");

  boxes.forEach(box => {
    box.style.display = isAiTelemetryOn ? "block" : "none";
  });

  if (btnLabel) {
    btnLabel.textContent = isAiTelemetryOn ? "AI Bounding Boxes: ON" : "AI Bounding Boxes: OFF";
  }

  showToast(`AI optical telemetry ${isAiTelemetryOn ? 'enabled' : 'disabled'}.`, "success");
}

// ==========================================================================
// 10. DISPATCH SLIP & PDF PREVIEW
// ==========================================================================
function updateDispatchSlip(claim) {
  const dspRo = document.getElementById("dspRo");
  const dspModel = document.getElementById("dspModel");
  const dspVin = document.getElementById("dspVin");
  const dspMileage = document.getElementById("dspMileage");
  const dspTech = document.getElementById("dspTech");
  const dspAdvisor = document.getElementById("dspAdvisor");
  const dspComplaint = document.getElementById("dspComplaint");
  const dspCause = document.getElementById("dspCause");
  const dspCorrection = document.getElementById("dspCorrection");
  const dspTotalVal = document.getElementById("dspTotalVal");

  if (dspRo) dspRo.textContent = claim.roNumber;
  if (dspModel) dspModel.textContent = claim.model;
  if (dspVin) dspVin.textContent = claim.vin;
  if (dspMileage) dspMileage.textContent = claim.mileage;
  if (dspTech) dspTech.textContent = claim.tech;
  if (dspAdvisor) dspAdvisor.textContent = claim.advisor;
  if (dspComplaint) dspComplaint.textContent = claim.complaint;
  if (dspCause) dspCause.textContent = claim.cause;
  if (dspCorrection) dspCorrection.textContent = claim.correction;
  if (dspTotalVal) dspTotalVal.textContent = claim.submittedVal;
}

function openPrintDispatchWindow() {
  showToast("Opening print dialog for official Mercedes-Benz Warranty Dispatch PDF...", "success");
  window.print();
}

function exportDispatchCsv() {
  const claim = MB_WARRANTY_CLAIMS[activeSelectedClaim];
  if (!claim) return;
  const csvContent = `data:text/csv;charset=utf-8,RO,VIN,Model,Tech,Advisor,Amount,Status\n${claim.roNumber},${claim.vin},"${claim.model}","${claim.tech}","${claim.advisor}",${claim.submittedVal},${claim.status}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Mercedes_Dispatch_${claim.roNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported CSV for ${claim.roNumber}`, "success");
}

// ==========================================================================
// 11. TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-dot ${type === 'success' ? 'bg-emerald-400' : type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'}"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "all 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

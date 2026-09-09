/**
 * Luxury Mercedes-Benz PDF & Print Generator
 * Formats high-end executive warranty audit reports embodying the Mercedes-Benz luxury aesthetic
 * with "Playfair Display", platinum/obsidian accents, Halo Burst logo, and Landscape/Portrait orientation modes.
 */

export interface LuxuryPdfReportData {
  dealershipName: string;
  reportTitle?: string;
  reportSubtitle?: string;
  orientation: "portrait" | "landscape";
  roNumber: string;
  vin: string;
  model: string;
  mileage: string;
  inServiceDate?: string;
  advisorName: string;
  techName: string;
  alignmentTechName?: string;
  managerName?: string;
  // Verdict
  verdictTitle: string;
  verdictStatus: string; // e.g. "COVERED_UNDER_WARRANTY", "NON_COVERED", "ACTION_REQUIRED"
  confidenceScore?: number;
  warrantyProgram?: string;
  applicablePolicyClause?: string;
  // 3C Story
  complaint: string;
  cause: string;
  correction: string;
  fullDmsStory?: string;
  // Manufacturer Defect Definition
  manufacturerDefectDefinition?: string;
  outsideInfluenceDefense?: string;
  // Parts & One-Time Hardware
  partsRiskSummary?: string;
  oneTimeHardwareItems?: Array<{ name: string; spec?: string; status?: string }>;
  // Xentry & Diagnostic Verification
  xentrySummary?: string;
  faultCodes?: string;
  // Wheel Alignment (optional)
  alignmentSummary?: string;
  // Policies applied
  appliedPolicies?: string[];
  // Coaching notes & Advisor scripts
  advisorCustomerScript?: string;
  techCoaching?: string;
  advisorCoaching?: string;
}

export function generateLuxuryMercedesHtml(data: LuxuryPdfReportData): string {
  const isLandscape = data.orientation === "landscape";
  const logoUrl = window.location.origin + "/Halo Burst.png";
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatted = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.reportTitle || "Mercedes-Benz Warranty Compliance Assessment"} - RO ${data.roNumber || "RO"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${isLandscape ? "landscape" : "portrait"};
      margin: 12mm 14mm 14mm 14mm;
    }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: ${isLandscape ? "14px 20px" : "20px 24px"};
      color: #0f172a;
      background-color: #ffffff;
      font-size: 10.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .luxury-font-display {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .luxury-font-sub {
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    .luxury-font-mono {
      font-family: 'Space Mono', monospace;
    }

    /* Header Container */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .logo-img {
      height: 48px;
      width: auto;
      max-width: 180px;
      object-fit: contain;
    }
    .dealership-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #090d16;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .report-subtitle {
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #0284c7;
      text-transform: uppercase;
      margin: 0;
    }

    /* Meta Grid */
    .meta-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .meta-label {
      font-family: 'Space Mono', monospace;
      font-size: 7.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      display: block;
      margin-bottom: 1px;
    }
    .meta-value {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Personnel Strip */
    .personnel-strip {
      background: #0f172a;
      color: #ffffff;
      border-radius: 6px;
      padding: 7px 12px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
    }
    .personnel-strip strong {
      color: #38bdf8;
    }

    /* Verdict Banner */
    .verdict-banner {
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      background: #f0fdf4;
      border-color: #16a34a;
    }
    .verdict-banner.non-covered {
      background: #fef2f2;
      border-color: #ef4444;
    }
    .verdict-banner.action-required {
      background: #fffbeb;
      border-color: #f59e0b;
    }
    .verdict-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 3px 0;
      color: #0f172a;
    }

    /* Content Layout */
    .two-col-grid {
      display: grid;
      grid-template-columns: ${isLandscape ? "1.15fr 0.85fr" : "1fr"};
      gap: 14px;
      margin-bottom: 12px;
    }

    .section-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .section-card-header {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* 3C Boxes */
    .c-box {
      padding: 7px 10px;
      border-radius: 4px;
      margin-bottom: 6px;
      border-left: 3.5px solid #0284c7;
      background: #f8fafc;
    }
    .c-box.cause {
      border-left-color: #d97706;
      background: #fffbeb;
    }
    .c-box.correction {
      border-left-color: #16a34a;
      background: #f0fdf4;
    }
    .c-label {
      font-family: 'Space Mono', monospace;
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
      color: #475569;
    }

    .dms-text-block {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      white-space: pre-wrap;
      line-height: 1.4;
      color: #1e293b;
    }

    /* Table */
    table.luxury-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin: 6px 0;
    }
    table.luxury-table th, table.luxury-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    table.luxury-table th {
      background: #f1f5f9;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8px;
      color: #334155;
    }

    /* Signatures Footer */
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1.5px solid #0f172a;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
      font-family: 'Space Mono', monospace;
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .cert-stamp {
      text-align: right;
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      color: #0284c7;
      font-size: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>

  <!-- Top Header with Luxury Branding -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 60px;">
        <img src="${logoUrl}" alt="Mercedes-Benz ASP" class="logo-img" onerror="this.style.display='none'" />
      </td>
      <td style="vertical-align: top; padding-left: 12px;">
        <h1 class="dealership-title">${data.dealershipName || "MERCEDES-BENZ OF ROCKVILLE CENTRE"}</h1>
        <p class="report-subtitle">TECHNICAL WARRANTY INTEGRITY & OEM COMPLIANCE ASSURANCE DIVISION</p>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div class="cert-stamp">ASP Certified Compliance</div>
        <div class="luxury-font-mono" style="font-size:8px; color:#64748b;">Generated: ${dateFormatted} • ${timeFormatted}</div>
        <div class="luxury-font-mono" style="font-size:9px; font-weight:700; color:#0f172a;">RO: ${data.roNumber || "N/A"}</div>
      </td>
    </tr>
  </table>

  <!-- Personnel Assignment Bar (Wired to Directory) -->
  <div class="personnel-strip">
    <div>ADVISOR: <strong>${data.advisorName || "Unassigned"}</strong></div>
    <div>PRIMARY TECH: <strong>${data.techName || "Unassigned"}</strong></div>
    <div>ALIGNMENT SPEC.: <strong>${data.alignmentTechName || "N/A"}</strong></div>
    <div>SERVICE DIRECTOR: <strong>${data.managerName || "Amanda Plywacz"}</strong></div>
  </div>

  <!-- Vehicle & Claim Metadata Grid -->
  <div class="meta-box">
    <div>
      <span class="meta-label">VEHICLE MODEL</span>
      <span class="meta-value">${data.model || "Mercedes-Benz"}</span>
    </div>
    <div>
      <span class="meta-label">VIN IDENTIFICATION</span>
      <span class="meta-value luxury-font-mono">${data.vin || "N/A"}</span>
    </div>
    <div>
      <span class="meta-label">ODOMETER MILEAGE</span>
      <span class="meta-value">${data.mileage || "N/A"}</span>
    </div>
    <div>
      <span class="meta-label">WARRANTY PROGRAM</span>
      <span class="meta-value" style="color:#0284c7;">${data.warrantyProgram || "New Vehicle Limited Warranty (4yr/50k)"}</span>
    </div>
  </div>

  <!-- Verdict Banner -->
  <div class="verdict-banner ${
    data.verdictStatus.includes("DENIAL") || data.verdictStatus.includes("NON_COVERED") 
      ? "non-covered" 
      : data.verdictStatus.includes("ACTION") 
      ? "action-required" 
      : ""
  }">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 class="verdict-heading">${data.verdictTitle || "OEM WARRANTY COMPLIANCE DETERMINATION"}</h2>
        <div style="font-size:10px; color:#334155; font-weight:600;">
          Applicable Clause: ${data.applicablePolicyClause || "MBUSA Warranty Policy Section 3.1 (Material/Workmanship Defect)"}
        </div>
      </div>
      ${data.confidenceScore ? `
        <div style="text-align:right;">
          <span class="luxury-font-mono" style="font-size:16px; font-weight:800; color:#0f172a;">${data.confidenceScore}%</span>
          <span class="luxury-font-mono" style="font-size:7.5px; display:block; color:#64748b;">CONFIDENCE SCORE</span>
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Two Column Content Layout -->
  <div class="two-col-grid">
    <!-- Left Column: 3C Technical Story & Causation Defense -->
    <div>
      <div class="section-card">
        <div class="section-card-header">
          <span>1. TECHNICAL JUSTIFICATION & 3C REPAIR STORY</span>
          <span class="luxury-font-mono" style="font-size:8px; color:#0284c7;">WIS COMPLIANT</span>
        </div>

        <div class="c-box">
          <span class="c-label" style="color:#0284c7;">CUSTOMER CONCERN / COMPLAINT</span>
          <div>${data.complaint || "Customer concern logged per service intake."}</div>
        </div>

        <div class="c-box cause">
          <span class="c-label" style="color:#b45309;">DIAGNOSTIC FINDINGS / FACTORY CAUSE</span>
          <div>${data.cause || "Root-cause component failure verified per diagnostic logs."}</div>
        </div>

        <div class="c-box correction">
          <span class="c-label" style="color:#15803d;">CORRECTION / WORK PERFORMED PER WIS</span>
          <div>${data.correction || "Replaced defective component with genuine Mercedes-Benz parts."}</div>
        </div>
      </div>

      ${data.manufacturerDefectDefinition ? `
        <div class="section-card" style="border-left: 3.5px solid #0f172a;">
          <div class="section-card-header">
            <span>2. MANUFACTURER DEFECT DEFINITION & AUDIT DEFENSE</span>
          </div>
          <div style="font-size:10px; color:#1e293b; margin-bottom:6px; line-height:1.45;">
            <strong>Internal Defect Causation:</strong> ${data.manufacturerDefectDefinition}
          </div>
          ${data.outsideInfluenceDefense ? `
            <div style="font-size:9.5px; color:#475569; line-height:1.4; padding:6px 8px; background:#f8fafc; border-radius:4px;">
              <strong>Defense vs Outside Influence:</strong> ${data.outsideInfluenceDefense}
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${data.fullDmsStory ? `
        <div class="section-card">
          <div class="section-card-header">
            <span>3. FORMATTED DMS NARRATIVE (NETSTAR READY)</span>
          </div>
          <div class="dms-text-block">${data.fullDmsStory}</div>
        </div>
      ` : ''}
    </div>

    <!-- Right Column: Parts, Diagnostic Verification & Alignment -->
    <div>
      ${data.partsRiskSummary || (data.oneTimeHardwareItems && data.oneTimeHardwareItems.length > 0) ? `
        <div class="section-card">
          <div class="section-card-header">
            <span>PARTS AUDIT & ONE-TIME HARDWARE</span>
          </div>
          ${data.partsRiskSummary ? `
            <p style="margin:0 0 6px 0; font-size:9.5px;">${data.partsRiskSummary}</p>
          ` : ''}
          ${data.oneTimeHardwareItems && data.oneTimeHardwareItems.length > 0 ? `
            <table class="luxury-table">
              <thead>
                <tr>
                  <th>ONE-TIME FASTENER / HARDWARE</th>
                  <th>SPECIFICATION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${data.oneTimeHardwareItems.map(item => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.spec || "WIS Mandated"}</td>
                    <td style="color:${item.status === 'MISSING' ? '#dc2626' : '#16a34a'}; font-weight:bold;">
                      ${item.status || "VERIFIED"}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </div>
      ` : ''}

      ${data.xentrySummary || data.faultCodes ? `
        <div class="section-card">
          <div class="section-card-header">
            <span>PAPERLESS XENTRY DIAGNOSTICS</span>
          </div>
          ${data.faultCodes ? `
            <div class="luxury-font-mono" style="font-size:9px; background:#0f172a; color:#38bdf8; padding:6px 8px; border-radius:4px; margin-bottom:6px;">
              DTC LOG: ${data.faultCodes}
            </div>
          ` : ''}
          <p style="margin:0; font-size:9.5px; color:#334155;">${data.xentrySummary || "Diagnostic test steps verified against repair order."}</p>
        </div>
      ` : ''}

      ${data.alignmentSummary ? `
        <div class="section-card">
          <div class="section-card-header">
            <span>WHEEL ALIGNMENT & ROMESS INCLINATION</span>
          </div>
          <p style="margin:0; font-size:9.5px; color:#334155;">${data.alignmentSummary}</p>
        </div>
      ` : ''}

      ${data.appliedPolicies && data.appliedPolicies.length > 0 ? `
        <div class="section-card">
          <div class="section-card-header">
            <span>VERIFIED FACTORY POLICIES APPLIED</span>
          </div>
          <ul style="margin:0; padding-left:14px; font-size:9px; color:#475569;">
            ${data.appliedPolicies.map(pol => `<li>${pol}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${data.techCoaching || data.advisorCoaching || data.advisorCustomerScript ? `
        <div class="section-card" style="background:#f8fafc;">
          <div class="section-card-header">
            <span>PERSONNEL COACHING & ADVISOR SCRIPT</span>
          </div>
          ${data.techCoaching ? `
            <div style="font-size:9px; margin-bottom:4px;">
              <strong>Technician Coaching:</strong> ${data.techCoaching}
            </div>
          ` : ''}
          ${data.advisorCoaching ? `
            <div style="font-size:9px; margin-bottom:4px;">
              <strong>Advisor Directive:</strong> ${data.advisorCoaching}
            </div>
          ` : ''}
          ${data.advisorCustomerScript ? `
            <div style="font-size:9px; color:#0f172a; background:#e0f2fe; border-left:3px solid #0284c7; padding:4px 6px; border-radius:0 4px 4px 0;">
              <strong>Advisor Customer Script:</strong> "${data.advisorCustomerScript}"
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Signatures & Authorization Block -->
  <div class="signatures-grid">
    <div>
      <div class="sig-line">SERVICE ADVISOR SIGN-OFF</div>
      <div style="font-size:9px; font-weight:bold; margin-top:2px;">${data.advisorName || "Service Advisor"}</div>
    </div>
    <div>
      <div class="sig-line">PRIMARY MASTER TECHNICIAN</div>
      <div style="font-size:9px; font-weight:bold; margin-top:2px;">${data.techName || "Primary Technician"}</div>
    </div>
    <div>
      <div class="sig-line">WARRANTY ADMINISTRATOR</div>
      <div style="font-size:9px; font-weight:bold; margin-top:2px;">${data.managerName || "Amanda Plywacz"}</div>
    </div>
    <div style="text-align:right;">
      <div class="sig-line">DIGITAL AUDIT TOKEN</div>
      <div class="luxury-font-mono" style="font-size:8px; color:#0284c7; margin-top:2px;">
        MB-${Date.now().toString().slice(-8)}-ASP
      </div>
    </div>
  </div>

</body>
</html>
  `;
}

export function printLuxuryMercedesReport(data: LuxuryPdfReportData) {
  const html = generateLuxuryMercedesHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup window was blocked by your browser. Please allow popups to view and print the Luxury Mercedes-Benz PDF report.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Trigger print after fonts load
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 600);
}

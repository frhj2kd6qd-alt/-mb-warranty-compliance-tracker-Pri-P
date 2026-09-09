import React, { useState, useMemo } from "react";
import { ErrorRecord, ErrorCategory } from "../types";
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Copy, 
  Download, 
  Check, 
  Search, 
  Sparkles, 
  FileCheck2,
  ListFilter,
  DollarSign,
  Printer,
  Eye,
  X
} from "lucide-react";

interface ClaimAuditorProps {
  records: ErrorRecord[];
}

interface AuditResult {
  complianceScore: number;
  riskRating: "Low" | "Medium" | "High";
  issuesDetected: Array<{
    severity: "High" | "Medium" | "Low";
    issue: string;
    policyViolation: string;
    remedy: string;
  }>;
  technicalEvaluation: string;
  missingDocumentation: string[];
  recommendations: string;
}

interface AppealResult {
  appealLetter: string;
  appealArguments: string[];
}

export default function ClaimAuditor({ records }: ClaimAuditorProps) {
  // Navigation tabs: "audit" or "appeal"
  const [activeSubTab, setActiveSubTab] = useState<"audit" | "appeal">("audit");
  
  // Selection state
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Manual input fields (fallback if user wants custom entry)
  const [isManualEntry, setIsManualEntry] = useState<boolean>(false);
  const [manualClaim, setManualClaim] = useState({
    roNumber: "RO-204918",
    vin: "WD1702951A8271049",
    category: ErrorCategory.DENIAL,
    employeeName: "Marcus Vance",
    serviceAdvisor: "Sarah Lin",
    errorDescription: "Diagnostic fault code verify lacking. Punch time clock deviation over 1.2 hours without Foreman authorization stamp.",
    notes: "Part replaced: High-Pressure Fuel Pump. Initial claim rejected by central review claiming visual impact damage detected.",
    chargebackAmount: 1840,
    date: new Date().toISOString().split('T')[0]
  });

  // Action states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [appealData, setAppealData] = useState<AppealResult | null>(null);
  
  // Custom overriding arguments for appeal letter
  const [customAppealContext, setCustomAppealContext] = useState<string>("");

  // Copy success animation states
  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);
  const [copiedAudit, setCopiedAudit] = useState<boolean>(false);

  // PDF Preview modal state
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Filter records for list
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchCat = filterCategory === "ALL" || r.category === filterCategory;
      const term = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        r.roNumber.toLowerCase().includes(term) ||
        (r.vin && r.vin.toLowerCase().includes(term)) ||
        (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
        (r.errorDescription && r.errorDescription.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [records, filterCategory, searchQuery]);

  // Handle active claim context (manual or selected)
  const currentClaimDetails = useMemo(() => {
    if (isManualEntry) {
      return manualClaim;
    }
    const found = records.find(r => r.id === selectedRecordId);
    if (found) {
      return {
        roNumber: found.roNumber,
        vin: found.vin || "N/A",
        category: found.category || ErrorCategory.DENIAL,
        employeeName: found.employeeName,
        serviceAdvisor: found.serviceAdvisor || "N/A",
        errorDescription: found.errorDescription || "N/A",
        notes: found.notes || "",
        chargebackAmount: found.chargebackAmount || found.estimatedRevenueLost || 0,
        date: found.date
      };
    }
    return null;
  }, [isManualEntry, manualClaim, records, selectedRecordId]);

  // Select a record from ledger
  const handleSelectRecord = (id: string) => {
    setSelectedRecordId(id);
    setIsManualEntry(false);
    // Clear old state
    setAuditData(null);
    setAppealData(null);
    setErrorMsg("");
  };

  // Run Proactive AI Compliance Audit
  const handleRunAudit = async () => {
    if (!currentClaimDetails) {
      setErrorMsg("Please select a claim or configure a custom entry to audit.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setAuditData(null);

    try {
      const res = await fetch("/api/gemini/audit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimDetails: currentClaimDetails })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Claim audit failed");
      }

      const data = await res.json();
      setAuditData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during the audit process.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Rebuttal Appeal Letter
  const handleGenerateAppeal = async () => {
    if (!currentClaimDetails) {
      setErrorMsg("Please select a claim or configure a custom entry to draft an appeal.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setAppealData(null);

    try {
      const res = await fetch("/api/gemini/generate-appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          claimDetails: currentClaimDetails,
          customContext: customAppealContext 
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Appeal generation failed");
      }

      const data = await res.json();
      setAppealData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during the appeal generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLetter = () => {
    if (!appealData?.appealLetter) return;
    navigator.clipboard.writeText(appealData.appealLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleCopyAudit = () => {
    if (!auditData) return;
    const text = `ASP WARRANTY AUDIT REPORT
RO: ${currentClaimDetails?.roNumber} | VIN: ${currentClaimDetails?.vin}
Compliance Score: ${auditData.complianceScore}/100 | Risk Rating: ${auditData.riskRating}

Technical Evaluation:
${auditData.technicalEvaluation}

Detected Issues:
${auditData.issuesDetected.map((i, idx) => `${idx + 1}. [${i.severity} Severity] ${i.issue}\n   Violation: ${i.policyViolation}\n   Remedy: ${i.remedy}`).join("\n")}

Missing Documentation:
${auditData.missingDocumentation.map(d => `- ${d}`).join("\n")}

Recommendations:
${auditData.recommendations}`;

    navigator.clipboard.writeText(text);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  const handleDownloadLetterText = () => {
    if (!appealData?.appealLetter) return;
    const element = document.createElement("a");
    const file = new Blob([appealData.appealLetter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Warranty_Appeal_${currentClaimDetails?.roNumber || "Draft"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Print / Save PDF Handler for Auditor & Appeal
  const handlePrintAuditorPdf = (mode: "audit" | "appeal" | "full" = "full") => {
    if (!currentClaimDetails) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setShowPdfModal(true);
      alert("Popup was blocked by browser! Displaying on-screen PDF report preview modal. Click 'PRINT / SAVE AS PDF' inside the modal.");
      return;
    }

    const claim = currentClaimDetails;
    const includeAudit = (mode === "audit" || mode === "full") && !!auditData;
    const includeAppeal = (mode === "appeal" || mode === "full") && !!appealData;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASP Warranty Compliance Audit & Rebuttal Report - ${claim.roNumber}</title>
          <style>
            @page { size: letter; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; line-height: 1.5; font-size: 11px; }
            
            .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
            .brand-title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .brand-sub { font-size: 9px; color: #475569; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
            .doc-id { text-align: right; font-family: monospace; font-size: 10px; color: #334155; line-height: 1.4; }

            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-lbl { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-val { font-size: 11px; font-weight: 800; color: #0f172a; word-break: break-all; }

            .score-banner { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; border: 1.5px solid #0284c7; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
            .score-title { font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; }
            .score-num { font-size: 18px; font-weight: 900; color: #0284c7; font-family: monospace; }

            .section-title { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 8px; font-weight: 800; color: #334155; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; vertical-align: top; }

            .letter-box { background: #fafafa; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; font-family: 'Courier New', Courier, monospace; font-size: 10px; line-height: 1.5; white-space: pre-wrap; margin-top: 6px; color: #1e293b; }

            .signature-section { margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
            .sig-line { border-top: 1px solid #0f172a; margin-top: 28px; padding-top: 4px; font-size: 9px; color: #475569; font-weight: 700; text-transform: uppercase; }

            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background:#0f172a; color:#fff; padding:12px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-radius:8px;">
            <span style="font-family:sans-serif; font-size:13px; font-weight:bold;">📄 ASP WARRANTY CLAIM AUDIT & REBUTTAL PDF REPORT</span>
            <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px;">
              🖨️ PRINT / SAVE AS PDF
            </button>
          </div>

          <div class="report-header">
            <div>
              <div class="brand-title">ASP Warranty Audit & Rebuttal Report</div>
              <div class="brand-sub">Automotive Warranty Rejection Audit & Legal-Technical Appeals</div>
            </div>
            <div class="doc-id">
              <strong>REPAIR ORDER:</strong> ${claim.roNumber}<br/>
              <strong>STAMP DATE:</strong> ${new Date().toLocaleString()}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-lbl">VEHICLE VIN</span>
              <span class="meta-val" style="font-family:monospace;">${claim.vin}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">TECHNICIAN</span>
              <span class="meta-val">${claim.employeeName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">SERVICE ADVISOR</span>
              <span class="meta-val">${claim.serviceAdvisor}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">REVENUE AT RISK / CHARGEBACK</span>
              <span class="meta-val" style="color:#0284c7;">$${claim.chargebackAmount.toLocaleString()}</span>
            </div>
          </div>

          ${includeAudit && auditData ? `
            <div class="score-banner">
              <div>
                <div class="score-title">AI COMPLIANCE AUDIT DIAGNOSIS</div>
                <div style="font-size:10px; color:#475569;">Risk Severity: <strong>${auditData.riskRating.toUpperCase()} RISK</strong></div>
              </div>
              <div class="score-num">SCORE: ${auditData.complianceScore}/100</div>
            </div>

            <div class="section-title">1. TECHNICAL COMPLIANCE EVALUATION</div>
            <div style="background:#f8fafc; padding:8px 12px; border-left:3px solid #0284c7; border-radius:0 4px 4px 0; margin-bottom:10px; font-style:italic;">
              "${auditData.technicalEvaluation}"
            </div>

            <div class="section-title">2. COMPLIANCE DISCREPANCIES & POLICY VIOLATIONS</div>
            ${auditData.issuesDetected.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width:20%;">SEVERITY</th>
                    <th style="width:30%;">ISSUE</th>
                    <th style="width:25%;">POLICY VIOLATION</th>
                    <th style="width:25%;">RECOMMENDED REMEDY</th>
                  </tr>
                </thead>
                <tbody>
                  ${auditData.issuesDetected.map(iss => `
                    <tr>
                      <td style="font-weight:bold; color:${iss.severity === "High" ? "#dc2626" : iss.severity === "Medium" ? "#d97706" : "#059669"};">${iss.severity.toUpperCase()}</td>
                      <td><strong>${iss.issue}</strong></td>
                      <td>${iss.policyViolation}</td>
                      <td>${iss.remedy}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `<div style="color:#16a34a; font-weight:bold; margin-bottom:10px;">✓ No compliance violations detected in claim structure.</div>`}

            <div class="section-title">3. REQUIRED DOCUMENTATION & RECOMMENDATIONS</div>
            <ul style="padding-left:18px; margin-bottom:10px;">
              ${auditData.missingDocumentation.map(d => `<li>${d}</li>`).join('')}
            </ul>
            <div style="background:#f1f5f9; padding:8px; border-radius:4px; font-weight:500;">
              <strong>Strategic Recommendation:</strong> ${auditData.recommendations}
            </div>
          ` : ''}

          ${includeAppeal && appealData ? `
            <div class="section-title" style="margin-top:20px;">${includeAudit ? '4' : '1'}. STRATEGIC REBUTTAL ARGUMENTS</div>
            <ul style="padding-left:18px; margin-bottom:12px;">
              ${appealData.appealArguments.map(arg => `<li style="margin-bottom:4px;">${arg}</li>`).join('')}
            </ul>

            <div class="section-title">${includeAudit ? '5' : '2'}. OFFICIAL FACTORY APPEAL & REBUTTAL DEMAND LETTER</div>
            <div class="letter-box">${appealData.appealLetter}</div>
          ` : ''}

          <div class="signature-section">
            <div>
              <div class="sig-line">Warranty Administrator / Compliance Auditor Signature</div>
            </div>
            <div>
              <div class="sig-line">Dealership Executive / Service Director Stamp</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white font-sans w-full px-2 sm:px-4 lg:px-6 py-6">
      
      {/* LEFT COLUMN: Claim Selector & Input Pane (Col-span 4) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col">
        
        {/* Claim Context Header */}
        <div className="bg-[#0b0f17]/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <h3 className="font-serif text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-cyan-400" />
              Source Context
            </h3>
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-[10px] font-mono">
              <button 
                onClick={() => setIsManualEntry(false)}
                className={`px-2.5 py-1 font-bold ${!isManualEntry ? 'bg-cyan-600/80 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              >
                LEDGER
              </button>
              <button 
                onClick={() => {
                  setIsManualEntry(true);
                  setSelectedRecordId("");
                  setAuditData(null);
                  setAppealData(null);
                }}
                className={`px-2.5 py-1 font-bold ${isManualEntry ? 'bg-cyan-600/80 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              >
                CUSTOM
              </button>
            </div>
          </div>

          {!isManualEntry ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Search Claim */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search RO, VIN, Tech..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#030406] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Categories filters */}
              <div className="flex gap-1">
                {["ALL", ErrorCategory.DENIAL, ErrorCategory.TECHNICIAN, ErrorCategory.ADVISOR].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase border transition-colors ${
                      filterCategory === cat 
                        ? "bg-slate-800 text-cyan-300 border-cyan-500/30" 
                        : "bg-transparent text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Claims select list */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 border border-white/5 bg-[#030406]/55 rounded-xl p-2">
                {filteredRecords.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic text-center py-4">No matching records found.</p>
                ) : (
                  filteredRecords.map(rec => {
                    const isSelected = rec.id === selectedRecordId;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col space-y-1 ${
                          isSelected 
                            ? "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.1)]" 
                            : "bg-[#080c12]/40 border-transparent hover:border-white/5 hover:bg-[#0c121c]/60"
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs font-mono font-bold">
                          <span className={isSelected ? "text-cyan-300" : "text-slate-200"}>{rec.roNumber}</span>
                          <span className="text-slate-400 font-normal">{rec.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {rec.employeeName} • {rec.serviceAdvisor || "No Advisor"}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate italic">
                          {rec.errorDescription || "No description provided."}
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-900 border border-white/10 rounded font-mono text-slate-300">
                            {rec.category || "AUDIT"}
                          </span>
                          <span className="font-mono font-bold text-rose-400">
                            ${(rec.chargebackAmount || rec.estimatedRevenueLost || 0).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // Manual Custom Input
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">RO Number</label>
                  <input 
                    type="text" 
                    value={manualClaim.roNumber}
                    onChange={(e) => setManualClaim({...manualClaim, roNumber: e.target.value})}
                    className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Claim Amount ($)</label>
                  <input 
                    type="number" 
                    value={manualClaim.chargebackAmount}
                    onChange={(e) => setManualClaim({...manualClaim, chargebackAmount: parseInt(e.target.value) || 0})}
                    className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">VIN Number (17-char)</label>
                <input 
                  type="text" 
                  value={manualClaim.vin}
                  onChange={(e) => setManualClaim({...manualClaim, vin: e.target.value})}
                  className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Technician</label>
                  <input 
                    type="text" 
                    value={manualClaim.employeeName}
                    onChange={(e) => setManualClaim({...manualClaim, employeeName: e.target.value})}
                    className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Service Advisor</label>
                  <input 
                    type="text" 
                    value={manualClaim.serviceAdvisor}
                    onChange={(e) => setManualClaim({...manualClaim, serviceAdvisor: e.target.value})}
                    className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Error / Rejection description</label>
                <textarea 
                  rows={2}
                  value={manualClaim.errorDescription}
                  onChange={(e) => setManualClaim({...manualClaim, errorDescription: e.target.value})}
                  className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="e.g. Diagnostic verification log missing on RO."
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Additional Case Details / Parts</label>
                <textarea 
                  rows={2}
                  value={manualClaim.notes}
                  onChange={(e) => setManualClaim({...manualClaim, notes: e.target.value})}
                  className="w-full bg-[#030406] border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="Include any WIS codes or parts replaced."
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Claim Summary Box */}
        {currentClaimDetails && (
          <div className="bg-[#0b0f17]/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col space-y-3">
            <h4 className="font-mono text-[10px] uppercase text-slate-400 tracking-wider">Active Analysis Subject</h4>
            <div className="bg-[#030406] rounded-xl p-3 border border-white/5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-serif text-sm font-black text-slate-200">{currentClaimDetails.roNumber}</div>
                  <div className="text-[10px] text-slate-400 font-mono">VIN: {currentClaimDetails.vin}</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs px-2.5 py-1 rounded-lg">
                  ${currentClaimDetails.chargebackAmount.toLocaleString()}
                </div>
              </div>
              
              <div className="text-[11px] text-slate-300 space-y-1 border-t border-white/5 pt-2">
                <div><strong>Tech:</strong> {currentClaimDetails.employeeName}</div>
                <div><strong>Advisor:</strong> {currentClaimDetails.serviceAdvisor}</div>
                <div><strong>Claim Date:</strong> {currentClaimDetails.date}</div>
                <div className="text-slate-400 italic text-[10px] bg-slate-900/30 p-1.5 rounded border border-white/5 mt-1">
                  &ldquo;{currentClaimDetails.errorDescription}&rdquo;
                </div>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveSubTab("audit");
                  handleRunAudit();
                }}
                disabled={loading}
                className="w-full bg-[#080d16] hover:bg-[#0c1421] text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 py-2.5 rounded-xl text-xs font-serif font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                RUN AUDIT
              </button>
              <button
                onClick={() => {
                  setActiveSubTab("appeal");
                  handleGenerateAppeal();
                }}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-serif font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(8,145,178,0.3)] hover:shadow-[0_0_15px_rgba(8,145,178,0.5)]"
              >
                <Sparkles className="w-4 h-4" />
                GENERATE REBUTTAL
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Results Screen (Col-span 8) */}
      <div className="lg:col-span-8 flex flex-col min-h-[500px]">
        
        {/* Sub-tab Navigation */}
        <div className="bg-[#0b0f17]/95 border border-slate-800/80 p-2.5 rounded-2xl shadow-xl flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-[#030406] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveSubTab("audit")}
              className={`px-4 py-2 rounded-lg text-xs font-serif tracking-wider font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "audit"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              AI COMPLIANCE AUDITOR
            </button>
            <button
              onClick={() => setActiveSubTab("appeal")}
              className={`px-4 py-2 rounded-lg text-xs font-serif tracking-wider font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "appeal"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-4 h-4" />
              AUTOMATED APPEAL GENERATOR
            </button>
          </div>

          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden md:block">
            STATION // AUDIT_LAB_V4.8
          </div>
        </div>

        {/* Workspace Display Card */}
        <div className="flex-1 bg-[#0b0f17]/90 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col relative p-6">
          
          {/* Steel header shine line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          {/* Error Message banner */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loading state indicator */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-[#070b12]/80 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-serif text-sm font-bold tracking-wider text-slate-200">
                  {activeSubTab === "audit" ? "AUDITING WARRANTY MATRIX..." : "COMPILING OEM APPEALS REBUTTAL..."}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-1 max-w-xs px-4">
                  Evaluating claim structure with ASP AI Audit Engine. Citing Mercedes-Benz WIS procedure catalogs and administrative mandates.
                </p>
              </div>
            </div>
          )}

          {/* Empty Selection State */}
          {!currentClaimDetails && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 rounded-full bg-slate-900 border border-white/5 mb-4 text-slate-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <FileCheck2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-serif text-base font-bold text-slate-200">No Warranty Subject Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mt-2">
                Choose an existing denial claim from your Ledger index, or toggle to the <strong className="text-cyan-300">CUSTOM</strong> tab to input a unique claim. Then run a proactive audit or draft a persuasive factory rebuttal appeal.
              </p>
            </div>
          )}

          {/* 1. AUDIT RESULT PANEL */}
          {activeSubTab === "audit" && currentClaimDetails && !loading && (
            <div className="flex-1 flex flex-col space-y-5">
              {auditData ? (
                <>
                  {/* Top Stats block */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Score Gauge Widget */}
                    <div className="md:col-span-5 bg-[#030406]/60 border border-white/5 rounded-xl p-4 flex items-center space-x-4">
                      <div className="relative flex items-center justify-center shrink-0">
                        {/* Circle meter */}
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="34" className="stroke-slate-900 fill-none" strokeWidth="6" />
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="34" 
                            className="stroke-cyan-500 fill-none transition-all duration-1000" 
                            strokeWidth="6" 
                            strokeDasharray="213.6"
                            strokeDashoffset={213.6 - (213.6 * auditData.complianceScore) / 100}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-serif text-xl font-black text-slate-100">{auditData.complianceScore}</span>
                          <span className="text-[8px] font-mono uppercase text-slate-400">Score</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">COMPLIANCE DIAGNOSIS</div>
                        <div className="text-sm font-serif font-black text-slate-200">
                          {auditData.complianceScore >= 85 ? "EXCELLENT SHIELD" : auditData.complianceScore >= 60 ? "MODERATE EXPOSURE" : "CRITICAL RISK"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Risk Severity:</span>
                          <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            auditData.riskRating === "High" ? "bg-rose-950/40 border border-rose-500/30 text-rose-400" :
                            auditData.riskRating === "Medium" ? "bg-amber-950/40 border border-amber-500/30 text-amber-400" :
                            "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400"
                          }`}>
                            {auditData.riskRating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats list */}
                    <div className="md:col-span-7 bg-[#030406]/60 border border-white/5 rounded-xl p-4 flex flex-col justify-center space-y-2">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AUDIT METRIC INSIGHTS</div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Citing simulated policies representing <strong>Mercedes-Benz Central Warranty Section 4.5</strong>. Audit verified valid VIN structure, punch integrity ratios, and service operations consistency.
                      </div>
                    </div>

                  </div>

                  {/* Deep Analysis Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    
                    {/* Compliance Checklist & Deficits */}
                    <div className="space-y-4">
                      <div className="border-b border-white/5 pb-2">
                        <h4 className="font-serif text-xs font-bold uppercase text-slate-200 tracking-wide flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Compliance Discrepancies
                        </h4>
                      </div>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {auditData.issuesDetected.map((issue, idx) => (
                          <div key={idx} className="bg-[#030406]/40 border border-white/5 rounded-xl p-3 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-serif font-black text-slate-200 truncate">{issue.issue}</span>
                              <span className={`text-[8px] font-mono font-black uppercase px-1.5 rounded ${
                                issue.severity === "High" ? "bg-rose-950 text-rose-400" :
                                issue.severity === "Medium" ? "bg-amber-950 text-amber-400" :
                                "bg-emerald-950 text-emerald-400"
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400"><strong className="text-slate-300 font-mono">Violation:</strong> {issue.policyViolation}</p>
                            <p className="text-[10px] text-slate-400"><strong className="text-cyan-400 font-mono">Remedy:</strong> {issue.remedy}</p>
                          </div>
                        ))}

                        {auditData.issuesDetected.length === 0 && (
                          <div className="flex items-center gap-2 text-emerald-400 py-4">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-xs">No active compliance violations detected! Excellent.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Missing Documentation & Overall Recommendations */}
                    <div className="space-y-4">
                      {/* Missing documentation list */}
                      <div className="space-y-2">
                        <div className="border-b border-white/5 pb-2">
                          <h4 className="font-serif text-xs font-bold uppercase text-slate-200 tracking-wide">
                            Required Document checklist
                          </h4>
                        </div>
                        <ul className="space-y-1.5">
                          {auditData.missingDocumentation.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Technical evaluation summary */}
                      <div className="bg-[#030406]/30 border border-white/5 p-3 rounded-xl space-y-1">
                        <h5 className="text-[10px] font-mono uppercase text-cyan-400">TECHNICAL COMPLIANCE EVALUATION</h5>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          &ldquo;{auditData.technicalEvaluation}&rdquo;
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                    <button
                      onClick={handleRunAudit}
                      className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      RE-AUDIT CLAIM
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCopyAudit}
                        className="bg-slate-900 border border-white/10 hover:border-white/20 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedAudit ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>COPY SUMMARY</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowPdfModal(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                        PREVIEW PDF
                      </button>

                      <button
                        onClick={() => handlePrintAuditorPdf("audit")}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950"
                      >
                        <Printer size={14} />
                        PRINT / SAVE PDF
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="p-3.5 rounded-full bg-slate-950 border border-white/5 mb-3 text-slate-400 animate-pulse">
                    <ShieldCheck className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-slate-200">Proactive Compliance Audit Ready</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    Ready to run a complete diagnostic check on <strong>{currentClaimDetails.roNumber}</strong>. We will check policies, WIS references, and details.
                  </p>
                  <button
                    onClick={handleRunAudit}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    RUN AUDIT NOW
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. APPEAL RESULT PANEL */}
          {activeSubTab === "appeal" && currentClaimDetails && !loading && (
            <div className="flex-1 flex flex-col space-y-4">
              
              {/* Optional Overrides config input */}
              <div className="bg-[#030406]/55 border border-white/5 p-3 rounded-xl flex flex-col space-y-2">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Custom Appeal Strategy Override (Optional)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customAppealContext}
                    onChange={(e) => setCustomAppealContext(e.target.value)}
                    placeholder="e.g., Cite digital WIS log ID WIS-9104, confirm high-pressure test was completed."
                    className="flex-1 bg-[#050608] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button 
                    onClick={handleGenerateAppeal}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    RE-GENERATE
                  </button>
                </div>
              </div>

              {appealData ? (
                <>
                  {/* Generated Appeal Display */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
                    
                    {/* Persuasive Arguments Column */}
                    <div className="md:col-span-4 bg-[#030406]/30 border border-white/5 rounded-xl p-4 flex flex-col space-y-3">
                      <div className="border-b border-white/5 pb-1">
                        <h4 className="font-mono text-[9px] uppercase text-cyan-400 tracking-wider">AI STRATEGY ARGUMENTS</h4>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                        {appealData.appealArguments.map((arg, idx) => (
                          <div key={idx} className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                            <span className="font-mono text-xs text-cyan-300 font-bold block mb-1">Argument #{idx+1}</span>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{arg}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official Letter Template Column */}
                    <div className="md:col-span-8 flex flex-col">
                      <div className="bg-[#030406] border border-white/10 rounded-xl p-4 flex-1 overflow-y-auto max-h-[320px] font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-all cursor-text select-text scrollbar-thin">
                        {appealData.appealLetter}
                      </div>
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                    <button
                      onClick={handleDownloadLetterText}
                      className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DOWNLOAD TXT
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCopyLetter}
                        className="bg-slate-900 border border-white/10 hover:border-white/20 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedLetter ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>COPY LETTER</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowPdfModal(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                        PREVIEW PDF
                      </button>

                      <button
                        onClick={() => handlePrintAuditorPdf("appeal")}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950"
                      >
                        <Printer size={14} />
                        PRINT / SAVE PDF
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="p-3.5 rounded-full bg-slate-950 border border-white/5 mb-3 text-slate-400 animate-pulse">
                    <FileText className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-slate-200">Rebuttal Letter Draft Ready</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    Our AI Appeal Engine will synthesize Mercedes-Benz policy rebuttals, formatting a polished legal-administrative demand note for RO: <strong>{currentClaimDetails.roNumber}</strong>.
                  </p>
                  <button
                    onClick={handleGenerateAppeal}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    GENERATE APPEAL REBUTTAL
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ON-SCREEN PDF REPORT PREVIEW MODAL */}
      {showPdfModal && currentClaimDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-left space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  CLAIM AUDIT & REBUTTAL PDF REPORT PREVIEW
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Sheet Simulation */}
            <div className="bg-white text-slate-900 rounded-xl p-6 font-sans text-xs shadow-inner space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    ASP WARRANTY AUDIT & REBUTTAL REPORT
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    AUTOMOTIVE WARRANTY REJECTION AUDIT & LEGAL-TECHNICAL APPEALS
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-600 leading-tight">
                  <p><strong>REPAIR ORDER:</strong> {currentClaimDetails.roNumber}</p>
                  <p><strong>DATE:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">VIN</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{currentClaimDetails.vin}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">TECHNICIAN</span>
                  <span className="text-xs font-bold text-slate-900">{currentClaimDetails.employeeName}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">SERVICE ADVISOR</span>
                  <span className="text-xs font-bold text-slate-900">{currentClaimDetails.serviceAdvisor}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">CHARGEBACK AMOUNT</span>
                  <span className="text-xs font-bold text-cyan-700">${currentClaimDetails.chargebackAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Audit Data Section */}
              {auditData ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-sky-50 border border-sky-300 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sky-900 uppercase tracking-wider block text-xs">
                        AI COMPLIANCE AUDIT DIAGNOSIS
                      </span>
                      <span className="text-[10px] text-slate-600">
                        Risk Rating: <strong className="uppercase">{auditData.riskRating} Risk</strong>
                      </span>
                    </div>
                    <div className="font-mono text-lg font-black text-sky-700">
                      SCORE: {auditData.complianceScore}/100
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1">
                      1. TECHNICAL COMPLIANCE EVALUATION
                    </h4>
                    <p className="italic text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                      "{auditData.technicalEvaluation}"
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1">
                      2. COMPLIANCE DISCREPANCIES & POLICY VIOLATIONS
                    </h4>
                    {auditData.issuesDetected.length > 0 ? (
                      <table className="w-full text-left border-collapse text-[10px] my-1">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                            <th className="p-1.5">SEVERITY</th>
                            <th className="p-1.5">ISSUE</th>
                            <th className="p-1.5">VIOLATION</th>
                            <th className="p-1.5">REMEDY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditData.issuesDetected.map((iss, i) => (
                            <tr key={i} className="border-b border-slate-200">
                              <td className={`p-1.5 font-bold ${iss.severity === "High" ? "text-rose-600" : iss.severity === "Medium" ? "text-amber-600" : "text-emerald-600"}`}>
                                {iss.severity.toUpperCase()}
                              </td>
                              <td className="p-1.5 font-semibold">{iss.issue}</td>
                              <td className="p-1.5 text-slate-600">{iss.policyViolation}</td>
                              <td className="p-1.5 text-slate-600">{iss.remedy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-emerald-700 font-bold">✓ No compliance violations detected in claim structure.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded text-slate-500 italic text-[11px]">
                  (Audit analysis pending or not yet run for this claim)
                </div>
              )}

              {/* Appeal Data Section */}
              {appealData ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1">
                      OFFICIAL FACTORY APPEAL & REBUTTAL DEMAND LETTER
                    </h4>
                    <div className="p-3 bg-slate-50 border border-slate-300 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-slate-800">
                      {appealData.appealLetter}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded text-slate-500 italic text-[11px]">
                  (Rebuttal letter pending or not yet generated)
                </div>
              )}

              {/* Signature Block */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-6">
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Warranty Administrator / Compliance Auditor Signature
                </div>
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Dealership Executive / Service Director Stamp
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                CLOSE PREVIEW
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintAuditorPdf("full");
                  setShowPdfModal(false);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-950 transition-colors cursor-pointer"
              >
                <Printer size={15} />
                PRINT / SAVE AS PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import { 
  FileText, 
  Send, 
  Check, 
  Sparkles, 
  TrendingUp, 
  CheckSquare, 
  Square,
  ChevronDown,
  Calendar,
  Layers,
  AlertTriangle,
  Zap,
  Info,
  MessageSquare,
  Sliders,
  BarChart3,
  Mail,
  Download,
  Flame,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  Trash2,
  Plus,
  Printer,
  FileSpreadsheet,
  FileJson,
  User,
  DollarSign,
  GraduationCap,
  Coins,
  TrendingDown,
  X,
  Presentation,
  FormInput,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { generateAppUsagePDF } from "../lib/generateAppUsagePDF";
import { ErrorCategory, ErrorRecord, SeverityLevel, SeverityColor, Employee } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import aspLogo from "../assets/images/regenerated_image_1784897187473.png";
import bgImage from "../assets/images/command-center-bg.png";
import { WorkspaceHubModal } from "./WorkspaceHubModal";
import {
  signInWithGoogleWorkspace,
  getWorkspaceAccessToken,
  exportToGoogleSheets,
  exportToGoogleDoc,
  exportToGoogleSlides,
  downloadCsvFallback,
  downloadDocFallback,
  downloadSlidesFallback
} from "../lib/workspace";

interface ReportingCenterProps {
  onOpenPdf?: (data: { blobUrl: string, filename: string }) => void;
  records: ErrorRecord[];
  onNavigateToTab?: (tab: string) => void;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  dbEmployees: Employee[];
  onAddTestRecords?: (newRecs: ErrorRecord[]) => void;
  onDeleteRecord?: (id: string) => void;
}

export default function ReportingCenter({ 
  records, 
  onNavigateToTab, 
  greenCount, 
  yellowCount, 
  redCount, 
  dbEmployees,
  onAddTestRecords,
  onDeleteRecord
, onOpenPdf}: ReportingCenterProps) {
  
  // 1. Dropdown Filters State
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("ALL");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("2026-01-01");
  const [dateTo, setDateTo] = useState<string>("2026-12-31");

  // Auxiliary UI States
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState<string>(() => {
    return localStorage.getItem("asp_teams_webhook_url") || "";
  });
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  // Workspace Export States
  const [createdWorkspaceUrl, setCreatedWorkspaceUrl] = useState<string | null>(null);


  // Extract Advisors & Technicians dynamically for the dropdown filters
  const serviceAdvisorsList = useMemo(() => {
    const list = new Set<string>();
    // From DB
    dbEmployees.forEach(e => {
      if (e.role === "ServiceAdvisor") list.add(e.name);
    });
    // From records
    records.forEach(r => {
      if (r.category === ErrorCategory.ADVISOR) list.add(r.employeeName);
    });
    return Array.from(list).sort();
  }, [dbEmployees, records]);

  const techniciansList = useMemo(() => {
    const list = new Set<string>();
    // From DB
    dbEmployees.forEach(e => {
      if (e.role === "Technician" || e.role === "ShopForeman") list.add(e.name);
    });
    // From records
    records.forEach(r => {
      if (r.category === ErrorCategory.TECHNICIAN) list.add(r.employeeName);
    });
    return Array.from(list).sort();
  }, [dbEmployees, records]);

  // Extract Managers
  const managersList = useMemo(() => {
    const list = new Set<string>();
    dbEmployees.forEach(e => {
      if (e.role === "Manager") list.add(e.name);
    });
    list.add("Vinny Ruggieri");
    list.add("Amanda");
    return Array.from(list).sort();
  }, [dbEmployees]);
  // 2. Filter Records Dynamically
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // If advisor filter is set and it's not "ALL", check match
      const advisorMatch = selectedAdvisor === "ALL" || r.employeeName === selectedAdvisor;
      // If technician filter is set and it's not "ALL", check match
      const technicianMatch = selectedTechnician === "ALL" || r.employeeName === selectedTechnician;

      // When both filters are set to specific names, since an error is assigned to a single staff member,
      // we check if it matches either the advisor OR the technician to allow flexible cross-role analytics.
      let match = true;
      if (selectedAdvisor !== "ALL" && selectedTechnician !== "ALL") {
        match = r.employeeName === selectedAdvisor || r.employeeName === selectedTechnician;
      } else {
        if (selectedAdvisor !== "ALL") match = advisorMatch;
        if (selectedTechnician !== "ALL") match = technicianMatch;
      }

      if (!match) return false;

      // Date Range Match
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;

      return true;
    });
  }, [records, selectedAdvisor, selectedTechnician, dateFrom, dateTo]);

  // ==========================================
  // SEGMENT 1: RISK METRICS & CALCULATIONS
  // ==========================================
  const riskMetrics = useMemo(() => {
    const riskIncidents = filteredRecords.filter(r => r.category === ErrorCategory.TECHNICIAN || r.category === ErrorCategory.ADVISOR);
    const totalRiskCount = riskIncidents.length;
    const criticalRedCount = riskIncidents.filter(r => r.severityColor === SeverityColor.RED).length;
    const warningYellowCount = riskIncidents.filter(r => r.severityColor === SeverityColor.YELLOW).length;
    const lowGreenCount = riskIncidents.filter(r => r.severityColor === SeverityColor.GREEN).length;

    const systemicFailureRatio = totalRiskCount > 0 ? Math.round(((criticalRedCount + warningYellowCount) / totalRiskCount) * 100) : 0;

    // Group issues to find top systemic failures
    const issueMap: { [key: string]: number } = {};
    riskIncidents.forEach(r => {
      issueMap[r.errorDescription] = (issueMap[r.errorDescription] || 0) + 1;
    });
    const topIssues = Object.entries(issueMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      totalRiskCount,
      criticalRedCount,
      warningYellowCount,
      lowGreenCount,
      systemicFailureRatio,
      topIssues
    };
  }, [filteredRecords]);

  // ==========================================
  // SEGMENT 2: FINANCIAL METRICS & CALCULATIONS
  // ==========================================
  const financialMetrics = useMemo(() => {
    const denials = filteredRecords.filter(r => r.category === ErrorCategory.DENIAL);
    const totalExposure = denials.reduce((sum, r) => sum + (r.chargebackAmount || r.estimatedRevenueLost || 0), 0);
    
    // Administrative Declines: appealEligible = true (potential capital we can save)
    const adminDeclines = denials.filter(r => r.appealEligible).reduce((sum, r) => sum + (r.chargebackAmount || 0), 0);
    
    // Actual Factory Denials: appealEligible = false (lost capital)
    const factoryDenials = denials.filter(r => !r.appealEligible).reduce((sum, r) => sum + (r.chargebackAmount || 0), 0);
    
    // Capital Recovered
    const capitalRecovered = denials.reduce((sum, r) => sum + (r.recoveryAmount || 0), 0);

    // Group by description for visual chart
    const denialBreakdown = [
      { name: "Capital Recovered", value: capitalRecovered, color: "#10b981" },
      { name: "Admin Declines", value: adminDeclines, color: "#f59e0b" },
      { name: "Factory Denials", value: factoryDenials, color: "#ef4444" }
    ].filter(item => item.value > 0);

    return {
      totalExposure,
      adminDeclines,
      factoryDenials,
      capitalRecovered,
      denialBreakdown
    };
  }, [filteredRecords]);

  // ==========================================
  // CLOSED RECORDS FINANCIAL OUTCOMES CALCULATIONS
  // ==========================================
  const getClosedOutcomeCategory = (r: ErrorRecord): "Paid in Full" | "Partial" | "Full Loss" => {
    if (r.claimDecision === "Paid in Full") return "Paid in Full";
    if (r.claimDecision === "Partial Factory Paid" || r.claimDecision === "Correction Loop Partial Financial Recovery" || r.claimDecision === "Factory Paid - Parts Discrepancy Deduction") return "Partial";
    if (r.claimDecision === "Final Factory Denial" || r.claimDecision === "Dealer Self-Debit" || r.claimDecision === "Correction Loop Unresolved" || r.claimDecision === "Claim Processing Expelled (Company Expense)") return "Full Loss";

    if (r.revenueOutcome === "None" || r.financialImpact === "None" || r.riskLevel === "Optimization Opportunity (Low Risk)") return "Paid in Full";
    if (r.revenueOutcome === "Partial" || r.financialImpact === "Partial" || r.riskLevel === "Exposure / Financial Deviation (Moderate Risk)") return "Partial";
    if (r.revenueOutcome === "Full Loss Red" || r.financialImpact === "Full Loss" || r.riskLevel === "Critical Deficit / Hard Loss (High Risk)") return "Full Loss";

    return "Paid in Full";
  };

  const closedRecords = useMemo(() => {
    const explicitClosed = filteredRecords.filter(r => 
      r.claimLifecycleState === 'CLOSED_RESOLVED' || Boolean(r.claimDecision)
    );
    if (explicitClosed.length > 0) return explicitClosed;
    return filteredRecords;
  }, [filteredRecords]);

  const closedFinancialOutcomes = useMemo(() => {
    let paidInFullCount = 0;
    let partialCount = 0;
    let fullLossCount = 0;

    let paidInFullValue = 0;
    let partialValue = 0;
    let fullLossValue = 0;

    closedRecords.forEach(r => {
      const cat = getClosedOutcomeCategory(r);
      const amt = r.finalRecoveredRevenue || r.recoveryAmount || r.chargebackAmount || r.estimatedRevenueLost || 0;
      if (cat === "Paid in Full") {
        paidInFullCount++;
        paidInFullValue += amt;
      } else if (cat === "Partial") {
        partialCount++;
        partialValue += amt;
      } else if (cat === "Full Loss") {
        fullLossCount++;
        fullLossValue += amt;
      }
    });

    const totalClosedCount = closedRecords.length;

    const chartData = [
      { 
        name: "Paid in Full", 
        count: paidInFullCount, 
        value: paidInFullValue, 
        color: "#10b981", 
        percentage: totalClosedCount > 0 ? Math.round((paidInFullCount / totalClosedCount) * 100) : 0
      },
      { 
        name: "Partial", 
        count: partialCount, 
        value: partialValue, 
        color: "#f59e0b", 
        percentage: totalClosedCount > 0 ? Math.round((partialCount / totalClosedCount) * 100) : 0
      },
      { 
        name: "Full Loss", 
        count: fullLossCount, 
        value: fullLossValue, 
        color: "#ef4444", 
        percentage: totalClosedCount > 0 ? Math.round((fullLossCount / totalClosedCount) * 100) : 0
      }
    ];

    return {
      totalClosedCount,
      paidInFullCount,
      partialCount,
      fullLossCount,
      paidInFullValue,
      partialValue,
      fullLossValue,
      chartData
    };
  }, [closedRecords]);

  // ==========================================
  // SEGMENT 3: RECOVERY & TRAINING CALCULATIONS
  // ==========================================
  const recoveryTrainingMetrics = useMemo(() => {
    const totalRecovered = filteredRecords
      .filter(r => r.category === ErrorCategory.DENIAL)
      .reduce((sum, r) => sum + (r.recoveryAmount || 0), 0);

    // 15% allocation to continuing education/compliance training
    const trainingAllocation = Math.round(totalRecovered * 0.15);

    // Coachability Index Calculation
    const totalRecordsCount = filteredRecords.length;
    const redCountLocal = filteredRecords.filter(r => r.severityColor === SeverityColor.RED).length;
    const yellowCountLocal = filteredRecords.filter(r => r.severityColor === SeverityColor.YELLOW).length;

    let coachabilityIndex = 100;
    if (totalRecordsCount > 0) {
      coachabilityIndex = Math.max(25, Math.round(100 - (redCountLocal * 6) - (yellowCountLocal * 2)));
    }

    // Recommended Training Priorities: find staff with most red/yellow errors
    const staffErrorMap: { [key: string]: { red: number; yellow: number; name: string } } = {};
    filteredRecords.forEach(r => {
      if (!staffErrorMap[r.employeeName]) {
        staffErrorMap[r.employeeName] = { red: 0, yellow: 0, name: r.employeeName };
      }
      if (r.severityColor === SeverityColor.RED) staffErrorMap[r.employeeName].red += 1;
      if (r.severityColor === SeverityColor.YELLOW) staffErrorMap[r.employeeName].yellow += 1;
    });

    const trainingPriorities = Object.values(staffErrorMap)
      .map(item => ({
        ...item,
        score: item.red * 3 + item.yellow,
        priority: item.red > 1 ? "HIGH PRIORITY" : "STANDARD COACHING"
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return {
      totalRecovered,
      trainingAllocation,
      coachabilityIndex,
      trainingPriorities
    };
  }, [filteredRecords]);

  // ==========================================
  // REAL-TIME EXECUTIVE COMPLIANCE MATRIX CALCULATIONS (6 TABLES)
  // ==========================================
  const executiveMetrics = useMemo(() => {
    // Table 1: Tech Audit Risk Ledger
    const techAuditRiskLedger = records.filter(r => {
      const isAdminSpot = r.revenueOutcome === "Partial" || 
                          r.errorDescription.toLowerCase().includes("spot-check") || 
                          (r.category === ErrorCategory.ADVISOR && r.estimatedRevenueLost && r.estimatedRevenueLost > 0);
      const isTechRisk = r.category === ErrorCategory.TECHNICIAN || (r.category === ErrorCategory.ADVISOR && !isAdminSpot);
      return isTechRisk;
    });

    // Table 2: WSG Review Board
    const wsgReviewBoard = records.filter(r => {
      const hasRework = r.recoveryAmount !== undefined || (r.errorDescription.toLowerCase().includes("rework") || r.errorDescription.toLowerCase().includes("debit"));
      const hasDenial = r.category === ErrorCategory.DENIAL && !hasRework;
      return hasDenial;
    });

    // Table 3: PPM / RAPS Ledger (PPM/RAPS records that are recovered)
    const ppmRapsLedger = records.filter(r => {
      const desc = (r.errorDescription || "").toLowerCase();
      const notes = (r.notes || "").toLowerCase();
      return desc.includes("ppm") || desc.includes("raps") || notes.includes("ppm") || notes.includes("raps") || r.id.includes("ppm") || r.id.includes("raps");
    });

    // Table 4: WSG Claim Recovery Ledger (WSG/Denials that have been successfully recovered)
    const wsgClaimRecoveryLedger = records.filter(r => {
      const hasRework = r.recoveryAmount !== undefined || (r.errorDescription.toLowerCase().includes("rework") || r.errorDescription.toLowerCase().includes("debit"));
      const hasDenial = r.category === ErrorCategory.DENIAL && !hasRework;
      const isRecovered = (r.recoveredRevenue && r.recoveredRevenue > 0) || (r.recoveryAmount && r.recoveryAmount > 0) || r.overallStatus === "GREEN" || r.severityColor === SeverityColor.GREEN;
      return hasDenial && isRecovered;
    });

    // Table 5: Dealer Self-Debit / Rework Ledger
    const dealerSelfDebitReworkLedger = records.filter(r => {
      const hasRework = r.recoveryAmount !== undefined || (r.errorDescription.toLowerCase().includes("rework") || r.errorDescription.toLowerCase().includes("debit"));
      return hasRework;
    });

    // Table 6: Admin Spot-Checks Ledger
    const adminSpotChecksLedger = records.filter(r => {
      const isAdminSpot = r.revenueOutcome === "Partial" || 
                          r.errorDescription.toLowerCase().includes("spot-check") || 
                          (r.category === ErrorCategory.ADVISOR && r.estimatedRevenueLost && r.estimatedRevenueLost > 0);
      return isAdminSpot;
    });

    // RED CARD: TOTAL LIABILITY AT RISK (Tech Audit Risk Ledger + WSG Review Board active exposure)
    const techExposure = techAuditRiskLedger.reduce((sum, r) => {
      return sum + (r.estimatedRevenueLost || r.chargebackAmount || (r.severityColor === SeverityColor.RED ? 850 : r.severityColor === SeverityColor.YELLOW ? 350 : 150));
    }, 0);
    const wsgExposure = wsgReviewBoard.reduce((sum, r) => {
      return sum + (r.chargebackAmount || r.estimatedRevenueLost || 650);
    }, 0);
    const totalLiabilityAtRisk = techExposure + wsgExposure;

    // GREEN CARD: TOTAL RESCUED CAPITAL (PPM/RAPS Recovered cash + WSG Claim Recovery cash)
    const ppmRapsRecovered = ppmRapsLedger.reduce((sum, r) => {
      return sum + (r.recoveredRevenue || r.recoveryAmount || 650);
    }, 0);
    const wsgClaimRecovery = wsgClaimRecoveryLedger.reduce((sum, r) => {
      return sum + (r.recoveredRevenue || r.recoveryAmount || 550);
    }, 0);
    const aspTotalRecovery = ppmRapsRecovered + wsgClaimRecovery;

    // SHIELD CARD: AUDIT PENALTY AVOIDED (Audit Risk Saved from Self-Debit + Audit Risk Cleared from Admin Spot-Checks)
    const auditRiskSavedFromSelfDebit = dealerSelfDebitReworkLedger.reduce((sum, r) => {
      return sum + (r.recoveryAmount || r.recoveredRevenue || 450);
    }, 0);
    const auditRiskClearedFromAdminSpotChecks = adminSpotChecksLedger.reduce((sum, r) => {
      return sum + (r.estimatedRevenueLost || r.chargebackAmount || 300);
    }, 0);
    const auditPenaltyAvoided = auditRiskSavedFromSelfDebit + auditRiskClearedFromAdminSpotChecks;

    // AMBER CARD: UNRECOVERABLE LEAKAGE (Appeal Failed amounts + Rework Costs)
    const appealFailedLosses = wsgReviewBoard.filter(r => {
      const isFailed = !r.appealEligible || r.severityColor === SeverityColor.RED || r.overallStatus === "RED" || r.revenueOutcome === "Full Loss Red";
      return isFailed;
    }).reduce((sum, r) => {
      return sum + (r.chargebackAmount || r.estimatedRevenueLost || 500);
    }, 0);
    const reworkCosts = dealerSelfDebitReworkLedger.reduce((sum, r) => {
      return sum + (r.chargebackAmount || r.estimatedRevenueLost || 250);
    }, 0);
    const unrecoverableLeakage = appealFailedLosses + reworkCosts;

    return {
      techAuditRiskLedgerCount: techAuditRiskLedger.length,
      wsgReviewBoardCount: wsgReviewBoard.length,
      ppmRapsLedgerCount: ppmRapsLedger.length,
      wsgClaimRecoveryLedgerCount: wsgClaimRecoveryLedger.length,
      dealerSelfDebitReworkLedgerCount: dealerSelfDebitReworkLedger.length,
      adminSpotChecksLedgerCount: adminSpotChecksLedger.length,
      
      techExposure,
      wsgExposure,
      totalLiabilityAtRisk,
      
      ppmRapsRecovered,
      wsgClaimRecovery,
      aspTotalRecovery,
      
      auditRiskSavedFromSelfDebit,
      auditRiskClearedFromAdminSpotChecks,
      auditPenaltyAvoided,
      
      appealFailedLosses,
      reworkCosts,
      unrecoverableLeakage
    };
  }, [records]);

  // ==========================================
  // SIMULATED COMPLIANCE INJECTION
  // ==========================================

  // ==========================================
  // DISPATCH REPORT AS PDF
  // ==========================================
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    setActionSuccessMessage(null);

    const img = new Image();
    img.src = aspLogo;

    const generatePdf = () => {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Add Logo if loaded
        if (img.complete && img.naturalWidth !== 0) {
          doc.addImage(img, "JPEG", 14, 10, 15, 15);

          // Title Header (adjusted x coordinate to 32 to leave space for logo)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text("MONTHLY FINANCIAL & COMPLIANCE SUMMARY", 32, 16);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text("MONTHLY AUDIT RISK & REVENUE METRICS", 32, 21);
        } else {
          // Fallback title header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text("MONTHLY FINANCIAL & COMPLIANCE SUMMARY", 14, 20);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text("MONTHLY AUDIT RISK & REVENUE METRICS", 14, 25);
        }

        // Line Divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 28, 196, 28);

        // Parameters
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("Selected Filters", 14, 35);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Service Advisor Filter: ${selectedAdvisor}`, 14, 40);
        doc.text(`Technician Filter: ${selectedTechnician}`, 14, 45);
        doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 110, 40);
        doc.text(`Incidents Matching Query: ${filteredRecords.length}`, 110, 45);

        // Table 1: Core Segments Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Three-Segment Compliance Summary", 14, 55);

        autoTable(doc, {
          startY: 59,
          head: [["Core Report Segment", "Primary Metric Focus", "Calculated Performance Value"]],
          body: [
            ["🔴 TOTAL RISK SEGMENT", "Technician & Advisor Incidents", `${riskMetrics.totalRiskCount} Incidents Logged (${riskMetrics.criticalRedCount} Critical Red)`],
            ["🟠 FINANCIAL IMPACT SEGMENT", "Financial Exposure & Recoveries", `Total Exposure: $${financialMetrics.totalExposure.toLocaleString()} | Recovered: $${financialMetrics.capitalRecovered.toLocaleString()}`],
            ["🟢 RECOVERY & TRAINING SEGMENT", "Advisor Coachability Index", `Index: ${recoveryTrainingMetrics.coachabilityIndex}% | Training Alloc: $${recoveryTrainingMetrics.trainingAllocation.toLocaleString()}`]
          ],
          styles: { font: "helvetica", fontSize: 8.5 },
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
        });

        // Table 2: Detailed Findings
        const nextY = (doc as any).lastAutoTable?.finalY || 100;
        doc.setFont("helvetica", "bold");
        doc.text("Detailed Audit Log", 14, nextY + 10);

        autoTable(doc, {
          startY: nextY + 14,
          head: [["Date", "RO Number", "VIN", "Staff Member", "Error Description", "Type", "Financial Loss"]],
          body: filteredRecords.map(r => [
            r.date,
            r.roNumber,
            r.vin,
            r.employeeName,
            r.errorDescription,
            r.category,
            r.chargebackAmount ? `$${r.chargebackAmount}` : "$0"
          ]),
          styles: { font: "helvetica", fontSize: 7.5 },
          headStyles: { fillColor: [71, 85, 105] }
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
          doc.text("CONFIDENTIAL - ASP COMPLIANCE MANAGEMENT CORE", 14, 287);
        }

        const filename = `Sleek_Compliance_Report_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
        setIsExportingPDF(false);
        setActionSuccessMessage(`PDF successfully exported as "${filename}"!`);
      } catch (err: any) {
        console.error(err);
        setIsExportingPDF(false);
        setActionSuccessMessage(`Export failed: ${err.message}`);
      }
    };

    let generated = false;
    const triggerGenerate = () => {
      if (generated) return;
      generated = true;
      generatePdf();
    };

    img.onload = triggerGenerate;
    img.onerror = triggerGenerate;

    // Fallback if image fails to trigger or loads too slowly
    setTimeout(triggerGenerate, 1000);
  };

  // ==========================================
  // DISPATCH REPORT VIA EMAIL (RESEND API PROXIED)
  // ==========================================
  return (
    <div 
      className="rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative" 
      id="asp-reporting-workspace" 
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
    >
      {/* Dark Ambient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950 pointer-events-none"></div>

      {/* Header Bar */}
      <div className="relative p-8 bg-[#0a0b0e] border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between items-start gap-4 z-10 shadow-2xl">
        <div className="flex items-center gap-4 group select-none">
          <div className="relative">
            <img src={aspLogo} alt="ASP Logo" className="relative w-14 h-14 rounded-full border border-white/20 object-cover shadow-xl group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div>
            <p className="font-space-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
              ASP Command System // Executive Intelligence & Reporting
            </p>
            <h1 className="font-cormorant text-4xl md:text-5xl font-normal tracking-tight text-white flex items-center gap-3">
              Reporting Center
              <span className="text-[10px] font-space-mono font-bold text-slate-300 bg-[#cbd5e1]/10 px-2.5 py-1 rounded border border-white/20 uppercase tracking-widest">
                v2.5 ACTIVE
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigateToTab?.("database")}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400 text-white font-mono text-xs font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
            title="Open Master Warranty Schedule & Remittance Engine"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200" />
            MASTER WARRANTY SCHEDULE
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-200 text-slate-950 font-mono text-xs font-bold rounded-xl transition-all duration-300 disabled:opacity-50"
          >
            {isExportingPDF ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                EXPORT MONTHLY REPORT
              </>
            )}
          </button>

          <button
            onClick={async () => {
              try {
                setActionSuccessMessage("Generating Application Usage PDF...");
                const data = await generateAppUsagePDF();
                const link = document.createElement("a");
                link.href = data.blobUrl;
                link.download = data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setActionSuccessMessage(`Application Usage PDF downloaded as "${data.filename}"!`);
              } catch (err) {
                setActionSuccessMessage("Failed to generate Application Usage PDF.");
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-900 to-red-950 hover:from-rose-800 hover:to-red-900 border border-rose-500/40 text-rose-300 hover:text-white font-mono text-xs font-bold rounded-xl transition-all duration-300 shadow-md cursor-pointer"
            title="Download Official ASP Application Usage & SOP Guide PDF"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            USAGE MANUAL PDF
          </button>
        </div>
      </div>

      {/* Filter Status Toast / Google Workspace Link Toast */}
      {actionSuccessMessage && (
        <div className="mx-6 mt-6 relative bg-slate-950/90 border border-cyan-500/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-cyan-300 z-10 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>{actionSuccessMessage}</span>
          </div>

          <div className="flex items-center gap-3">
            {createdWorkspaceUrl && (
              <a
                href={createdWorkspaceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold rounded-lg hover:bg-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              >
                OPEN GOOGLE WORKSPACE FILE
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button 
              onClick={() => {
                setActionSuccessMessage(null);
                setCreatedWorkspaceUrl(null);
              }} 
              className="text-slate-500 hover:text-white font-bold"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      <div className="relative p-6 space-y-6 z-10">
        
        {/* ======================================================= */}
        {/* EXECUTIVE REAL-TIME COMPLIANCE ROLL-UP HUD */}
        {/* ======================================================= */}
        <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-500 via-emerald-500 to-cyan-500"></div>
          
          {/* Header section with title and button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-slate-800/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                <span className="text-[10px] font-mono font-black text-rose-400 tracking-widest uppercase">EXECUTIVE COMPLIANCE BRIEFING</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white uppercase font-sans mt-0.5">
                Real-Time Executive Audit Summary Matrix
              </h1>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Synthesized across all 6 live compliance tables and telemetry arrays
              </p>
            </div>
            
            <button
              onClick={() => setShowPresentationModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black font-mono tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_40px_rgba(34,211,238,0.45)] active:scale-[0.98] uppercase flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-950 stroke-[3]" />
              Export Executive Summary
            </button>
          </div>

          {/* Glowing Glassmorphic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 🔴 Card 1: TOTAL LIABILITY AT RISK */}
            <div className="relative bg-slate-950/40 backdrop-blur-md border border-rose-500/20 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-rose-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-rose-500 to-transparent"></div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-black text-rose-400 tracking-wider uppercase">
                  TOTAL LIABILITY AT RISK
                </span>
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                  <Flame className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              
              <div className="text-2xl font-black text-rose-500 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                ${executiveMetrics.totalLiabilityAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <p className="text-[10px] text-slate-400 font-mono mt-3 leading-snug">
                Summed active exposure in Tech Audit Risk Ledger & WSG Review Board.
              </p>
              
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-mono text-slate-500 border-t border-slate-800/50 pt-2.5">
                <span>Active Claims:</span>
                <span className="font-bold text-rose-400">{executiveMetrics.techAuditRiskLedgerCount + executiveMetrics.wsgReviewBoardCount}</span>
              </div>
            </div>

            {/* 🟢 Card 2: ASP TOTAL RECOVERY ('Total Rescued Capital') */}
            <div className="relative bg-slate-950/40 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-emerald-500 to-transparent"></div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-black text-emerald-400 tracking-wider uppercase">
                  Total Rescued Capital
                </span>
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                ${executiveMetrics.aspTotalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <p className="text-[10px] text-slate-400 font-mono mt-3 leading-snug">
                PPM/RAPS Recovered cash combined with successful WSG Claim Recoveries.
              </p>
              
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-mono text-slate-500 border-t border-slate-800/50 pt-2.5">
                <span>Rescued Logs:</span>
                <span className="font-bold text-emerald-400">{executiveMetrics.ppmRapsLedgerCount + executiveMetrics.wsgClaimRecoveryLedgerCount}</span>
              </div>
            </div>

            {/* 🛡️ Card 3: AUDIT PENALTY AVOIDED */}
            <div className="relative bg-slate-950/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-cyan-500 to-transparent"></div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-black text-cyan-400 tracking-wider uppercase">
                  AUDIT PENALTY AVOIDED
                </span>
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              
              <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                ${executiveMetrics.auditPenaltyAvoided.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <p className="text-[10px] text-slate-400 font-mono mt-3 leading-snug">
                Self-Debit Risk Saved summed with preventative Admin Spot-Check clearances.
              </p>
              
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-mono text-slate-500 border-t border-slate-800/50 pt-2.5">
                <span>Avoided Hits:</span>
                <span className="font-bold text-cyan-400">{executiveMetrics.dealerSelfDebitReworkLedgerCount + executiveMetrics.adminSpotChecksLedgerCount}</span>
              </div>
            </div>

            {/* 📉 Card 4: UNRECOVERABLE LEAKAGE */}
            <div className="relative bg-slate-950/40 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-amber-500 to-transparent"></div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-black text-amber-400 tracking-wider uppercase">
                  UNRECOVERABLE LEAKAGE
                </span>
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                ${executiveMetrics.unrecoverableLeakage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <p className="text-[10px] text-slate-400 font-mono mt-3 leading-snug">
                Summed Appeal Failed chargebacks and internal non-OEM swap rework costs.
              </p>
              
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-mono text-slate-500 border-t border-slate-800/50 pt-2.5">
                <span>Lost Entries:</span>
                <span className="font-bold text-amber-400">
                  {records.filter(r => r.category === ErrorCategory.DENIAL && !r.appealEligible).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* ======================================================= */}
        {/* CLOSED RECORDS FINANCIAL OUTCOMES PIE CHART DISTRIBUTION */}
        {/* ======================================================= */}
        <div className="bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase">CLOSED CLAIMS DISTRIBUTION</span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight font-sans">
                  Closed Records Financial Outcomes Distribution
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Breakdown of Paid in Full, Partial, and Full Loss resolutions for closed claim files ({closedFinancialOutcomes.totalClosedCount} Total Records)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                {closedFinancialOutcomes.totalClosedCount} Closed Records Analyzed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Pie Chart Container */}
            <div className="lg:col-span-5 h-64 w-full relative flex items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800/50 p-4">
              {closedFinancialOutcomes.totalClosedCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={closedFinancialOutcomes.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                    >
                      {closedFinancialOutcomes.chartData.map((entry, index) => (
                        <Cell key={`closed-cell-${index}-${entry.name}`} fill={entry.color} stroke="#020617" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} Records (${closedFinancialOutcomes.chartData.find(d => d.name === name)?.percentage}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc", fontFamily: "monospace" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs font-mono text-slate-300 font-bold">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-500 font-mono italic">No closed claim records available for analysis.</div>
              )}
              
              {/* Center Donut Hole Content */}
              {closedFinancialOutcomes.totalClosedCount > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-2xl font-black font-mono text-white tracking-tight">
                    {closedFinancialOutcomes.totalClosedCount}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    CLOSED
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown Cards & Detailed Metrics */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Paid in Full */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">PAID IN FULL</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      {closedFinancialOutcomes.chartData[0].percentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {closedFinancialOutcomes.paidInFullCount} <span className="text-xs text-slate-400 font-normal">claims</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-900/40 text-[10px] font-mono text-slate-300 flex justify-between items-center">
                  <span className="text-slate-400">Value:</span>
                  <span className="font-bold text-emerald-400">${closedFinancialOutcomes.paidInFullValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Partial */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">PARTIAL RECOVERY</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      {closedFinancialOutcomes.chartData[1].percentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    {closedFinancialOutcomes.partialCount} <span className="text-xs text-slate-400 font-normal">claims</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-300 flex justify-between items-center">
                  <span className="text-slate-400">Value:</span>
                  <span className="font-bold text-amber-400">${closedFinancialOutcomes.partialValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Full Loss */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-wider">FULL LOSS</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                      {closedFinancialOutcomes.chartData[2].percentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                    {closedFinancialOutcomes.fullLossCount} <span className="text-xs text-slate-400 font-normal">claims</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-900/40 text-[10px] font-mono text-slate-300 flex justify-between items-center">
                  <span className="text-slate-400">Value:</span>
                  <span className="font-bold text-rose-400">${closedFinancialOutcomes.fullLossValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* STAFF DEEP-DIVE FILTERS BAR (NEON GLOW) */}
        {/* ======================================================= */}
        <div className="p-5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-[0_0_25px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 font-mono uppercase tracking-wider">Staff Deep-Dive Filters</h3>
              <p className="text-[10px] text-slate-500 font-mono">Calibrate reporting scope dynamically</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* Filter by Service Advisor */}
            <div className="relative">
              <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Service Advisor</label>
              <div className="relative">
                <select
                  value={selectedAdvisor}
                  onChange={(e) => {
                    setSelectedAdvisor(e.target.value);
                    setActionSuccessMessage(`Filtered view to Service Advisor: ${e.target.value}`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                  <option value="ALL">[ Filter by Service Advisor: ALL ]</option>
                  {serviceAdvisorsList.map((name, idx) => (
                    <option key={`adv-report-${name}-${idx}`} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Filter by Technician */}
            <div className="relative">
              <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Technician</label>
              <div className="relative">
                <select
                  value={selectedTechnician}
                  onChange={(e) => {
                    setSelectedTechnician(e.target.value);
                    setActionSuccessMessage(`Filtered view to Technician: ${e.target.value}`);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                  <option value="ALL">[ Filter by Technician: ALL ]</option>
                  {techniciansList.map((name, idx) => (
                    <option key={`tech-report-${name}-${idx}`} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Filter by Date Range */}
            <div className="relative">
              <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Date Range Window</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 rounded-xl px-2.5 py-2 focus:border-cyan-500/50 outline-none w-full"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 rounded-xl px-2.5 py-2 focus:border-cyan-500/50 outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>


        {/* ======================================================= */}
        {/* THREE-SEGMENT CORE REPORTS GRID */}
        {/* ======================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 🔴 SEGMENT 1: TOTAL RISK REPORTS */}
          <div className="p-6 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.03)] hover:border-rose-500/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-500/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500 border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">Risk Analytics</h2>
                    <h1 className="text-sm font-black text-slate-100 uppercase tracking-tight">🔴 TOTAL RISK REPORT</h1>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-400">RISK CORE</span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono mb-4 leading-relaxed">
                TechnicianWIS, diagnostic logging & Advisor VMI/guest signature performance tracking.
              </p>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-bold">Risk Cases</span>
                  <div className="text-lg font-black text-slate-100 font-mono mt-1">{riskMetrics.totalRiskCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-rose-500/10 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-rose-400 font-mono uppercase tracking-widest font-bold">Crit. Red</span>
                  <div className="text-lg font-black text-rose-500 font-mono mt-1">{riskMetrics.criticalRedCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-bold">Failure %</span>
                  <div className="text-lg font-black text-yellow-500 font-mono mt-1">{riskMetrics.systemicFailureRatio}%</div>
                </div>
              </div>

              {/* Chart: Simple distribution */}
              <div className="h-32 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Low", count: riskMetrics.lowGreenCount, fill: "#10b981" },
                    { name: "Med", count: riskMetrics.warningYellowCount, fill: "#f59e0b" },
                    { name: "High", count: riskMetrics.criticalRedCount, fill: "#ef4444" }
                  ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8.5} />
                    <YAxis stroke="#64748b" fontSize={8.5} />
                    <Tooltip cursor={{ fill: "rgba(244,63,94,0.03)" }} contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={24}>
                      {[
                        { name: "Low", count: riskMetrics.lowGreenCount, fill: "#10b981" },
                        { name: "Med", count: riskMetrics.warningYellowCount, fill: "#f59e0b" },
                        { name: "High", count: riskMetrics.criticalRedCount, fill: "#ef4444" }
                      ].map((entry, index) => (
                        <Cell key={`threat-bar-cell-${index}-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Systemic Issues List */}
              <div>
                <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2.5">TOP SYSTEMIC THREATS</h4>
                <div className="space-y-2">
                  {riskMetrics.topIssues.map((issue, idx) => (
                    <div key={`top-threat-${idx}-${issue.name}`} className="flex justify-between items-center bg-slate-900/30 border border-slate-800/50 p-2 rounded-lg text-[10px] font-mono">
                      <span className="text-slate-300 truncate w-3/4" title={issue.name}>{issue.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/30 text-rose-400 border border-rose-900/30 font-bold">x{issue.count}</span>
                    </div>
                  ))}
                  {riskMetrics.topIssues.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-xs italic">No active risk profiles mapped.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900">
              <span className="text-[9px] font-mono text-rose-500/60 uppercase block text-center">COMPLIANCE RISK INDEX LIVE TELEMETRY</span>
            </div>
          </div>

          {/* 🟠 SEGMENT 2: FINANCIAL IMPACT REPORTS */}
          <div className="p-6 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.03)] hover:border-amber-500/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                    <DollarSign className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">Capital Stream</h2>
                    <h1 className="text-sm font-black text-slate-100 uppercase tracking-tight">🟠 FINANCIAL IMPACT REPORT</h1>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-400">FINANCIAL CORE</span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono mb-4 leading-relaxed">
                Administrative declines (appealable gaps) vs. factory warranty rejections.
              </p>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-bold">Total Exposure</span>
                  <div className="text-xs font-black text-slate-100 font-mono mt-1 truncate">${financialMetrics.totalExposure.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-amber-400 font-mono uppercase tracking-widest font-bold">Admin Decl.</span>
                  <div className="text-xs font-black text-amber-500 font-mono mt-1 truncate">${financialMetrics.adminDeclines.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/40 border border-emerald-500/10 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Recovered</span>
                  <div className="text-xs font-black text-emerald-400 font-mono mt-1 truncate">${financialMetrics.capitalRecovered.toLocaleString()}</div>
                </div>
              </div>

              {/* Chart: Pie/Donut of distribution */}
              <div className="h-32 w-full mb-4 flex items-center justify-center">
                {financialMetrics.denialBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialMetrics.denialBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {financialMetrics.denialBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}-${entry.name || 'entry'}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No financial incidents found.</div>
                )}
              </div>

              {/* Saved vs Lost List */}
              <div>
                <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2.5">CAPITAL RECONCILIATION</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/50 p-2.5 rounded-lg text-[10px] font-mono">
                    <span className="text-slate-400">Total Factory Denials (Lost)</span>
                    <span className="text-rose-500 font-bold">${financialMetrics.factoryDenials.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/50 p-2.5 rounded-lg text-[10px] font-mono">
                    <span className="text-slate-400">Appealable Admin Exposure (Saved Opportunity)</span>
                    <span className="text-amber-500 font-bold">${financialMetrics.adminDeclines.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800/50 p-2.5 rounded-lg text-[10px] font-mono">
                    <span className="text-slate-400">Actual Revenue Rescued</span>
                    <span className="text-emerald-400 font-bold">${financialMetrics.capitalRecovered.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900">
              <span className="text-[9px] font-mono text-amber-500/60 uppercase block text-center">FACTORY REJECTION CHARGEBACK STREAM</span>
            </div>
          </div>

          {/* 🟢 SEGMENT 3: RECOVERY & TRAINING REPORTS */}
          <div className="p-6 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.03)] hover:border-emerald-500/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                    <GraduationCap className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-mono font-bold tracking-widest text-emerald-500 uppercase">Growth & Coaching</h2>
                    <h1 className="text-sm font-black text-slate-100 uppercase tracking-tight">🟢 RECOVERY & TRAINING REPORT</h1>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400">TRAINING CORE</span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono mb-4 leading-relaxed">
                Direct flow of recovered warranty dollars into continuing education and advisor coachability indexes.
              </p>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-bold">Rescued Cash</span>
                  <div className="text-xs font-black text-slate-100 font-mono mt-1 truncate">${recoveryTrainingMetrics.totalRecovered.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/40 border border-emerald-500/10 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Coach. Index</span>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-1">{recoveryTrainingMetrics.coachabilityIndex}%</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-bold">Train. Alloc.</span>
                  <div className="text-xs font-black text-cyan-400 font-mono mt-1 truncate">${recoveryTrainingMetrics.trainingAllocation.toLocaleString()}</div>
                </div>
              </div>

              {/* Radial Coachability Meter */}
              <div className="h-32 w-full mb-4 flex items-center justify-center relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow"></div>
                  <span className="text-xl font-black text-emerald-400 font-mono">{recoveryTrainingMetrics.coachabilityIndex}%</span>
                  <span className="text-[7px] text-slate-500 font-mono font-bold uppercase tracking-wider">COACH SCORE</span>
                </div>
              </div>

              {/* Recommended Training Priorities */}
              <div>
                <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2.5">COACHING TARGET PRIORITIES</h4>
                <div className="space-y-2">
                  {recoveryTrainingMetrics.trainingPriorities.map((item, idx) => (
                    <div key={`coaching-priority-${idx}-${item.name}`} className="flex justify-between items-center bg-slate-900/30 border border-slate-800/50 p-2 rounded-lg text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        <span className="text-slate-300 truncate font-semibold">{item.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${item.red > 1 ? "bg-rose-950/40 text-rose-400 border border-rose-900/30" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>
                        {item.red > 1 ? "IMMEDIATE RE WIS" : "STANDARD REVIEW"}
                      </span>
                    </div>
                  ))}
                  {recoveryTrainingMetrics.trainingPriorities.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-xs italic">All advisors & technicians fully compliant.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900">
              <span className="text-[9px] font-mono text-emerald-500/60 uppercase block text-center">CONTINUOUS SKILL DEVELOPMENT FLOW</span>
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================= */}
      {/* EXECUTIVE PRESENTATION DECK MODAL (GOLDEN & COBALT) */}
      {/* ======================================================= */}
      {showPresentationModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-8 relative shadow-[0_0_80px_rgba(34,211,238,0.2)] animate-fade-in my-8">
            {/* Corner Decorative Elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
            
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-all font-mono text-[10px] uppercase font-bold flex items-center gap-1.5"
                title="Print Presentation"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT BRIEFING</span>
              </button>
              <button 
                onClick={() => setShowPresentationModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Header */}
            <div className="border-b border-slate-800/80 pb-6 mb-8">
              <div className="flex items-center gap-2 mb-1.5">
                <img src={aspLogo} alt="Logo" className="w-8 h-8 rounded-full ring-1 ring-cyan-500/40" />
                <span className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">
                  MONTHLY AUDIT RISK & REVENUE METRICS • EXECUTIVE BRIEFING
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight font-sans">
                ASP WARRANTY AUDIT BRIEFING SUMMARY
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Data Compiled: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Dynamic Metric Quadrants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Quadrant 1 */}
              <div className="bg-slate-950/60 border border-rose-500/20 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                <div className="text-[10px] font-mono font-bold text-rose-400 tracking-wider uppercase mb-1">
                  🔴 ACTIVE RISK LIABILITY
                </div>
                <div className="text-3xl font-black text-rose-500 font-mono tracking-tight">
                  ${executiveMetrics.totalLiabilityAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Tech Audit Risk Ledger ({executiveMetrics.techAuditRiskLedgerCount} cases):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.techExposure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WSG Review Board ({executiveMetrics.wsgReviewBoardCount} claims):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.wsgExposure.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quadrant 2 */}
              <div className="bg-slate-950/60 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase mb-1">
                  🟢 TOTAL RESCUED CAPITAL (TOTAL RECOVERY)
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  ${executiveMetrics.aspTotalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>PPM & RAPS Ledger ({executiveMetrics.ppmRapsLedgerCount} cases):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.ppmRapsRecovered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WSG Claim Recovery Ledger ({executiveMetrics.wsgClaimRecoveryLedgerCount} approvals):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.wsgClaimRecovery.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quadrant 3 */}
              <div className="bg-slate-950/60 border border-cyan-500/20 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>
                <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase mb-1">
                  🛡️ AUDIT PENALTY AVOIDED
                </div>
                <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
                  ${executiveMetrics.auditPenaltyAvoided.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Self-Debit Saved ({executiveMetrics.dealerSelfDebitReworkLedgerCount} self-debits):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.auditRiskSavedFromSelfDebit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Spot-Checks Cleared ({executiveMetrics.adminSpotChecksLedgerCount} queries):</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.auditRiskClearedFromAdminSpotChecks.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quadrant 4 */}
              <div className="bg-slate-950/60 border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <div className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase mb-1">
                  📉 UNRECOVERABLE LEAKAGE
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                  ${executiveMetrics.unrecoverableLeakage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Appeal Failed Losses:</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.appealFailedLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rework Cost Leakage:</span>
                    <span className="text-slate-200 font-semibold">${executiveMetrics.reworkCosts.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Analysis & Recovery Ratio */}
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl mb-8">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest mb-3">
                FINANCIAL HEALTH & AUDIT SHIELD RATIO
              </h3>
              
              {(() => {
                const totalReconciled = executiveMetrics.aspTotalRecovery + executiveMetrics.totalLiabilityAtRisk;
                const recoveryRatio = totalReconciled > 0 
                  ? Math.round((executiveMetrics.aspTotalRecovery / totalReconciled) * 100) 
                  : 0;
                
                return (
                  <div>
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
                      <span>Rescued Capital Ratio (Audit Shield efficiency)</span>
                      <span className="text-emerald-400 font-bold">{recoveryRatio}% Rescued</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 flex">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${recoveryRatio}%` }}></div>
                      <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${100 - recoveryRatio}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Rescued Capital ({recoveryRatio}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Liability At Risk ({100 - recoveryRatio}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Executive Summary Narrative */}
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between gap-6">
              <div className="max-w-md">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  AUDITOR NARRATIVE DISCLOSURE
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  The dealership’s dynamic audit shield score remains in excellent standing. Real-time logging through the Audit Data Ingress Panel demonstrates that proactive administrative spot-checking and fast, authoritatively handled self-debit procedures continue to minimize direct factory clawbacks. Ensure technicians maintain 100% compliance on high-frequency WIS checks to prevent high RED risk.
                </p>
              </div>
              <div className="text-right flex flex-col justify-end">
                <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                  ASP DECISION CORE v2.5
                </div>
                <div className="text-xs font-sans text-slate-300 font-medium mt-0.5">
                  General Manager Briefing Ready
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  Confidential • General Distribution Only
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

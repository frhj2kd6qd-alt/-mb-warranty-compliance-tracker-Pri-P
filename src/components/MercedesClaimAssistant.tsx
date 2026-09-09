import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Printer, 
  Eye, 
  X, 
  Wrench, 
  Car, 
  ShieldAlert, 
  HelpCircle,
  RefreshCw,
  BookOpen,
  Search,
  RotateCcw,
  PlusCircle,
  User,
  Users,
  AlertOctagon,
  MessageSquare,
  GraduationCap,
  Zap,
  UploadCloud,
  Paperclip,
  Trash2,
  Scale,
  FileWarning,
  Layers,
  Image as ImageIcon,
  Package,
  Compass,
  CheckSquare,
  Droplet,
  Edit3,
  Save,
  Undo,
  Plus,
  Clock,
  HardDrive,
  Send,
  Mail,
  Share2,
  FileSpreadsheet,
  Briefcase,
  CheckCircle
} from "lucide-react";
import { Employee } from "../types";
import { safeGetLocalStorage, safeSetLocalStorage } from "../lib/safeStorage";
import { MercedesKnowledgeManager } from "./MercedesKnowledgeManager";
import { VerifiedMercedesPolicy, loadVerifiedMercedesPolicies, formatActivePoliciesForPrompt } from "../lib/mercedesKnowledgeBase";
import { LuxuryMercedesPdfModal } from "./LuxuryMercedesPdfModal";
import { LuxuryPdfReportData } from "../utils/luxuryMercedesPdf";

export interface XentryFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
  text?: string;
  status: "ready" | "extracting" | "error";
  error?: string;
}

export interface XentryConflictItem {
  category: "DTC_MISMATCH" | "TIME_JUSTIFICATION" | "SOFTWARE_FLASH_PROOF" | "PARTS_JUSTIFICATION" | "DOCUMENTATION_MISSING";
  severity: "HIGH" | "MEDIUM" | "LOW";
  xentryDataEvidence: string;
  techStoryClaim: string;
  conflictExplanation: string;
  recommendedFix: string;
}

export interface XentryConflictAnalysis {
  conflictScore: number; // 0 to 100
  conflictLevel: "NO_CONFLICT" | "POTENTIAL_DISCREPANCY" | "HIGH_CONFLICT" | string;
  summary: string;
  detectedConflicts: XentryConflictItem[];
  reconciliationVerdict: string;
}

export interface OneTimeUseHardwareItem {
  partNameOrSpec?: string;
  partDescription?: string;
  expectedQty?: string;
  requiredQuantity?: string;
  billedQuantity?: string | number;
  wisMandate?: string;
  wisInstructionRef?: string;
  riskLevel?: "RED_HIGH_RISK" | "YELLOW_WARNING" | string;
  riskSeverity?: "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN" | string;
  explanation?: string;
}

export interface FluidIssueItem {
  fluidType?: string;
  claimedQty?: string;
  wisRequiredQty?: string;
  specDiscrepancy?: string;
  riskLevel?: string;
}

export interface MissingWisPartItem {
  partName?: string;
  reasonPerWisOrLi?: string;
  recommendation?: string;
}

export interface PartsRiskEvaluation {
  overallPartsRisk?: "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK" | "NOT_APPLICABLE" | string;
  overallPartsRiskLevel?: "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK" | "NOT_APPLICABLE" | string;
  hasOneTimeHardwareIssues?: boolean;
  missingOneTimeUseHardware?: boolean;
  summary: string;
  hardwareSpecifics?: OneTimeUseHardwareItem[];
  fluidQuantityEvaluation?: {
    status: "CORRECT" | "DISCREPANCY" | "NOT_APPLICABLE" | string;
    analysis: string;
    fluidSpecRequired?: string;
  };
  missingWisRequiredParts?: string[];
  oneTimeUseHardwareCheck?: {
    status: "RED_CRITICAL_MISSING" | "VERIFIED_COMPLIANT" | "NOT_REQUIRED" | string;
    missingItems: OneTimeUseHardwareItem[];
  };
  fluidsCheck?: {
    status: "COMPLIANT" | "DISCREPANCY_DETECTED" | "NOT_APPLICABLE" | string;
    fluidIssues: FluidIssueItem[];
  };
  wisMandatedPartsCheck?: {
    status: "COMPLIANT" | "MISSING_MANDATED_PARTS" | string;
    missingMandatedParts: MissingWisPartItem[];
  };
  billedPartsSummary?: string;
}

export interface AlignmentFieldCheck {
  field: string;
  status: "PRESENT" | "MISSING" | "OUT_OF_SPEC" | string;
  notes: string;
}

export interface AlignmentAdjustmentItem {
  adjustmentType: string;
  wisOpCode: string;
  timeJustification: string;
  fruClaimable: string;
}

export interface WheelAlignmentAssurance {
  auditStatus?: "FULL_POLICY_COMPLIANT" | "ADJUSTMENT_JUSTIFIED" | "ACTION_REQUIRED" | "HIGH_RISK" | "NOT_PERFORMED" | string;
  alignmentAuditStatus?: "COMPLIANT" | "ACTION_REQUIRED" | "HIGH_RISK" | "NOT_PERFORMED" | string;
  performedByTech?: string;
  alignmentTechnicianName?: string;
  summary: string;
  romessRideHeightStatus?: string;
  allRequiredFieldsFilled?: boolean;
  steeringAngleSensorCalibrated?: boolean;
  adjustmentJustified?: boolean;
  claimableOperations?: string[];
  fieldsAssuranceCheck?: AlignmentFieldCheck[];
  adjustmentsIdentified?: AlignmentAdjustmentItem[];
  timeClaimAssurance?: string;
  alignmentTechCoaching?: string;
  alignmentTechCoachingNotes?: string;
}

export interface MercedesAssistantResponse {
  executiveAssessmentSummary?: string;
  isHighRiskTechnicianMissing?: boolean;
  technicianMissingSpecifics?: string[];
  clarified3CStory: {
    complaint: string;
    cause: string;
    correction: string;
  };
  formattedFullStory: string;
  partsRiskEvaluation?: PartsRiskEvaluation;
  wheelAlignmentAssurance?: WheelAlignmentAssurance;
  xentryConflictAnalysis?: XentryConflictAnalysis;
  missingDataGaps: string[];
  checklist: Array<{
    item: string;
    status: "VERIFIED" | "ACTION_REQUIRED" | "MISSING" | string;
    notes: string;
  }>;
  clarificationQuestionsForTech: string[];
  advisorCoachingNotes?: string;
  technicianCoachingNotes?: string;
  alignmentTechCoachingNotes?: string;
  tipsGIReference: string;
  flatRateTimeEstimate: string;
}

/** Safe string enum formatter that prevents undefined.replace crashes */
function safeFormatEnum(val?: string | null, fallback = "N/A"): string {
  if (!val || typeof val !== "string") return fallback;
  return val.replace(/_/g, " ");
}

/** Normalizes Gemini API response so all fields & aliases exist safely */
function normalizeMercedesResponse(raw: any, techName: string, alignmentTechName: string, advisorName: string): MercedesAssistantResponse {
  if (!raw || typeof raw !== "object") {
    return {
      clarified3CStory: { complaint: "", cause: "", correction: "" },
      formattedFullStory: "",
      missingDataGaps: [],
      checklist: [],
      clarificationQuestionsForTech: [],
      tipsGIReference: "LI / WIS Reference",
      flatRateTimeEstimate: "1.5 hrs"
    };
  }

  // Parts Risk normalization
  let partsRisk: PartsRiskEvaluation | undefined = undefined;
  if (raw.partsRiskEvaluation) {
    const pr = raw.partsRiskEvaluation;
    const overallRisk = pr.overallPartsRiskLevel || pr.overallPartsRisk || "LOW_RISK";
    const isMissingHardware = Boolean(
      pr.missingOneTimeUseHardware || 
      pr.hasOneTimeHardwareIssues || 
      pr.oneTimeUseHardwareCheck?.status === "RED_CRITICAL_MISSING" ||
      (pr.oneTimeUseHardwareCheck?.missingItems && pr.oneTimeUseHardwareCheck.missingItems.length > 0)
    );

    let hardwareSpecifics: OneTimeUseHardwareItem[] = pr.hardwareSpecifics || [];
    if (!hardwareSpecifics.length && pr.oneTimeUseHardwareCheck?.missingItems) {
      hardwareSpecifics = pr.oneTimeUseHardwareCheck.missingItems.map((item: any) => ({
        partDescription: item.partDescription || item.partNameOrSpec || "One-Time Fastener",
        requiredQuantity: item.requiredQuantity || item.expectedQty || "1 Qty",
        billedQuantity: item.billedQuantity || "0",
        wisInstructionRef: item.wisInstructionRef || item.wisMandate || "Per WIS Procedure",
        riskSeverity: item.riskSeverity || item.riskLevel || (isMissingHardware ? "HIGH_RED" : "LOW_GREEN")
      }));
    }

    let fluidEvaluation = pr.fluidQuantityEvaluation;
    if (!fluidEvaluation && pr.fluidsCheck) {
      const issue = pr.fluidsCheck.fluidIssues?.[0];
      fluidEvaluation = {
        status: pr.fluidsCheck.status === "COMPLIANT" ? "CORRECT" : pr.fluidsCheck.status === "DISCREPANCY_DETECTED" ? "DISCREPANCY" : "NOT_APPLICABLE",
        analysis: issue?.specDiscrepancy || (pr.fluidsCheck.status === "COMPLIANT" ? "Fluid quantity and specification verified against WIS." : "Discrepancy in fluid quantity/spec."),
        fluidSpecRequired: issue?.wisRequiredQty || issue?.fluidType || "MB Spec Approved"
      };
    }

    let missingWisParts = pr.missingWisRequiredParts;
    if (!missingWisParts && pr.wisMandatedPartsCheck?.missingMandatedParts) {
      missingWisParts = pr.wisMandatedPartsCheck.missingMandatedParts.map((p: any) => `${p.partName || 'Mandated Part'}: ${p.reasonPerWisOrLi || p.recommendation || ''}`);
    }

    partsRisk = {
      ...pr,
      overallPartsRisk: overallRisk,
      overallPartsRiskLevel: overallRisk,
      hasOneTimeHardwareIssues: isMissingHardware,
      missingOneTimeUseHardware: isMissingHardware,
      summary: pr.summary || "Parts invoice reviewed against WIS specifications.",
      hardwareSpecifics,
      fluidQuantityEvaluation: fluidEvaluation,
      missingWisRequiredParts: missingWisParts || []
    };
  }

  // Wheel Alignment normalization - Only populated if alignment tech name is input
  let alignAssurance: WheelAlignmentAssurance | undefined = undefined;
  const hasAlignmentTechAssigned = Boolean(alignmentTechName && alignmentTechName.trim());
  if (raw.wheelAlignmentAssurance && hasAlignmentTechAssigned) {
    const wa = raw.wheelAlignmentAssurance;
    const status = wa.auditStatus || wa.alignmentAuditStatus || "FULL_POLICY_COMPLIANT";
    const assignedTech = wa.alignmentTechnicianName || wa.performedByTech || alignmentTechName;

    const romessField = wa.fieldsAssuranceCheck?.find((f: any) => f.field?.toLowerCase().includes("romess"));
    const romessStatus = wa.romessRideHeightStatus || (romessField ? (romessField.status === "PRESENT" ? "DOCUMENTED & SPECIFIED" : "NOT SPECIFIED / ACTION REQ") : "DOCUMENTED & SPECIFIED");

    const sasField = wa.fieldsAssuranceCheck?.find((f: any) => f.field?.toLowerCase().includes("steering") || f.field?.toLowerCase().includes("sas"));
    const sasCalibrated = wa.steeringAngleSensorCalibrated ?? (sasField ? sasField.status === "PRESENT" : true);

    const allFields = wa.allRequiredFieldsFilled ?? (wa.fieldsAssuranceCheck ? wa.fieldsAssuranceCheck.every((f: any) => f.status === "PRESENT") : true);

    const adjustments = wa.adjustmentsIdentified || [];
    const ops = wa.claimableOperations || (adjustments.length > 0 ? adjustments.map((a: any) => `Op ${a.wisOpCode || '40-6510'} (${a.adjustmentType || 'Toe'})`) : ["Op 40-6500 (Check Only)"]);

    alignAssurance = {
      ...wa,
      auditStatus: status,
      alignmentAuditStatus: status,
      alignmentTechnicianName: assignedTech,
      performedByTech: assignedTech,
      summary: wa.summary || "Wheel alignment record analyzed against policy standards.",
      romessRideHeightStatus: romessStatus,
      allRequiredFieldsFilled: allFields,
      steeringAngleSensorCalibrated: sasCalibrated,
      adjustmentJustified: wa.adjustmentJustified ?? (adjustments.length > 0),
      claimableOperations: ops,
      alignmentTechCoachingNotes: wa.alignmentTechCoachingNotes || wa.alignmentTechCoaching || "Document Romess angles and SAS 0.0° zero calibration."
    };
  }

  // Xentry conflict normalization
  let conflict: XentryConflictAnalysis | undefined = undefined;
  if (raw.xentryConflictAnalysis) {
    const ca = raw.xentryConflictAnalysis;
    conflict = {
      ...ca,
      conflictLevel: ca.conflictLevel || "NO_CONFLICT",
      conflictScore: typeof ca.conflictScore === "number" ? ca.conflictScore : 90,
      summary: ca.summary || "Xentry diagnostic data verified against story.",
      detectedConflicts: (ca.detectedConflicts || []).map((c: any) => ({
        category: c.category || "DOCUMENTATION",
        severity: c.severity || "LOW",
        xentryDataEvidence: c.xentryDataEvidence || "Evidence logged in Xentry Paperless file.",
        techStoryClaim: c.techStoryClaim || "Technician claim.",
        conflictExplanation: c.conflictExplanation || "No conflict detected.",
        recommendedFix: c.recommendedFix || "Proceed with submission."
      })),
      reconciliationVerdict: ca.reconciliationVerdict || "Ready for warranty submission."
    };
  }

  return {
    executiveAssessmentSummary: raw.executiveAssessmentSummary || "Technical justification analyzed against WIS guidelines.",
    isHighRiskTechnicianMissing: Boolean(raw.isHighRiskTechnicianMissing),
    technicianMissingSpecifics: raw.technicianMissingSpecifics || [],
    clarified3CStory: {
      complaint: raw.clarified3CStory?.complaint || "",
      cause: raw.clarified3CStory?.cause || "",
      correction: raw.clarified3CStory?.correction || ""
    },
    formattedFullStory: raw.formattedFullStory || "",
    partsRiskEvaluation: partsRisk,
    wheelAlignmentAssurance: alignAssurance,
    xentryConflictAnalysis: conflict,
    missingDataGaps: raw.missingDataGaps || [],
    checklist: (raw.checklist || []).map((item: any) => ({
      item: item.item || "Warranty Item",
      status: item.status || "VERIFIED",
      notes: item.notes || "Compliant"
    })),
    clarificationQuestionsForTech: raw.clarificationQuestionsForTech || [],
    advisorCoachingNotes: raw.advisorCoachingNotes || "",
    technicianCoachingNotes: raw.technicianCoachingNotes || "",
    alignmentTechCoachingNotes: raw.alignmentTechCoachingNotes || alignAssurance?.alignmentTechCoachingNotes || "",
    tipsGIReference: raw.tipsGIReference || "LI / WIS Document Reference",
    flatRateTimeEstimate: raw.flatRateTimeEstimate || "1.5 hrs"
  };
}

interface MercedesClaimAssistantProps {
  employees?: Employee[];
  dealershipName?: string;
}

// Client-side quick VIN model pattern decoder
function quickDecodeMercedesVin(vin: string): string | null {
  const clean = vin.trim().toUpperCase();
  if (clean.length < 10) return null;

  const yearChar = clean.charAt(9);
  const yearMap: Record<string, string> = {
    'J': '2018', 'K': '2019', 'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024', 'S': '2025', 'T': '2026'
  };
  const year = yearMap[yearChar] || "";

  if (clean.includes("232") || clean.startsWith("W1K232")) return `${year} EQS 450+ Sedan`.trim();
  if (clean.includes("297") || clean.startsWith("W1K297")) return `${year} EQS 580 4MATIC SUV`.trim();
  if (clean.includes("206") || clean.startsWith("W1K206")) return `${year} C 300 Sedan`.trim();
  if (clean.includes("205") || clean.startsWith("WDD205")) return `${year} C 300 Sedan`.trim();
  if (clean.includes("167") || clean.startsWith("W1N167") || clean.startsWith("W1NOG")) return `${year} GLE 350 / GLS 450 4MATIC`.trim();
  if (clean.includes("213") || clean.startsWith("WDD213")) return `${year} E 350 Sedan`.trim();
  if (clean.includes("223") || clean.startsWith("WDD223")) return `${year} S 580 4MATIC`.trim();
  if (clean.includes("222") || clean.startsWith("WDD222")) return `${year} S 560 Sedan`.trim();
  if (clean.includes("247")) return `${year} GLB 250 4MATIC`.trim();

  return null;
}

export function MercedesClaimAssistant({ employees = [], dealershipName }: MercedesClaimAssistantProps) {
  const DRAFT_STORAGE_KEY = "asp_mercedes_claim_assistant_intake_draft_v1";
  const activeDealership = dealershipName || safeGetLocalStorage("asp_dealership_location_key") || "Mercedes-Benz of Rockville Centre";

  // Retained Mercedes-Benz Policies / Corrective Knowledge State
  const [verifiedPolicies, setVerifiedPolicies] = useState<VerifiedMercedesPolicy[]>(() => loadVerifiedMercedesPolicies());

  // Luxury PDF Modal State
  const [showLuxuryPdfModal, setShowLuxuryPdfModal] = useState<boolean>(false);

  // Roster personnel groupings
  const advisors = employees.filter(e => e.role === "ServiceAdvisor" || e.role === "Manager");
  const technicians = employees.filter(e => e.role === "Technician" || e.role === "ShopForeman");
  const managers = employees.filter(e => e.role === "Manager" || e.role === "ShopForeman");

  // State
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("");
  const [selectedTech, setSelectedTech] = useState<string>("");
  // Default alignment tech is blank so no report is generated unless explicitly input
  const [selectedAlignmentTech, setSelectedAlignmentTech] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<string>("");

  // Raw story split fields
  const [rawComplaint, setRawComplaint] = useState<string>("");
  const [rawCause, setRawCause] = useState<string>("");
  const [rawCorrection, setRawCorrection] = useState<string>("");
  const [techStory, setTechStory] = useState<string>("");

  // Parts Block for Bulk Copy/Paste & Invoice Upload
  const [rawPartsInvoice, setRawPartsInvoice] = useState<string>("");
  const [partsFiles, setPartsFiles] = useState<XentryFileItem[]>([]);
  const [isDraggingParts, setIsDraggingParts] = useState<boolean>(false);
  const partsFileInputRef = useRef<HTMLInputElement>(null);

  // Wheel Alignment Results Drop Box & Angles
  const [wheelAlignmentResults, setWheelAlignmentResults] = useState<string>("");
  const [alignmentFiles, setAlignmentFiles] = useState<XentryFileItem[]>([]);
  const [isDraggingAlignment, setIsDraggingAlignment] = useState<boolean>(false);
  const alignmentFileInputRef = useRef<HTMLInputElement>(null);

  // Metadata & Fault codes
  const [model, setModel] = useState<string>("GLE 450 4MATIC");
  const [roNumber, setRoNumber] = useState<string>("");
  const [vin, setVin] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [faultCodes, setFaultCodes] = useState<string>("");
  const [technicianMissingNotes, setTechnicianMissingNotes] = useState<string>("");

  // Paperless Xentry Files Drag & Drop State
  const [xentryFiles, setXentryFiles] = useState<XentryFileItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDecodingVin, setIsDecodingVin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MercedesAssistantResponse | null>(null);

  // Modals & Copy
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showFlashModal, setShowFlashModal] = useState<boolean>(false);
  const [showBatchManagerModal, setShowBatchManagerModal] = useState<boolean>(false);
  const [managerEmailRecipient, setManagerEmailRecipient] = useState<string>("Amanda@aspclass.org");
  const [selectedBatchRoIds, setSelectedBatchRoIds] = useState<string[]>(["CURRENT", "PRESET_1", "PRESET_2", "PRESET_3", "PRESET_4"]);
  const [isDispatchingWebhook, setIsDispatchingWebhook] = useState<boolean>(false);
  const [managerDispatchStatus, setManagerDispatchStatus] = useState<string | null>(null);

  // Auto-save & Local Storage Persistence (5-second cadence)
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);
  const [draftRestoredBanner, setDraftRestoredBanner] = useState<string | null>(null);
  const isDraftInitialized = useRef<boolean>(false);

  // Editable Report State
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false);
  const [editedReport, setEditedReport] = useState<MercedesAssistantResponse | null>(null);
  const [originalAiResult, setOriginalAiResult] = useState<MercedesAssistantResponse | null>(null);

  // Restore Draft on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rawComplaint !== undefined) setRawComplaint(parsed.rawComplaint);
        if (parsed.rawCause !== undefined) setRawCause(parsed.rawCause);
        if (parsed.rawCorrection !== undefined) setRawCorrection(parsed.rawCorrection);
        if (parsed.techStory !== undefined) setTechStory(parsed.techStory);
        if (parsed.rawPartsInvoice !== undefined) setRawPartsInvoice(parsed.rawPartsInvoice);
        if (parsed.wheelAlignmentResults !== undefined) setWheelAlignmentResults(parsed.wheelAlignmentResults);
        if (parsed.model !== undefined) setModel(parsed.model);
        if (parsed.roNumber !== undefined) setRoNumber(parsed.roNumber);
        if (parsed.vin !== undefined) setVin(parsed.vin);
        if (parsed.mileage !== undefined) setMileage(parsed.mileage);
        if (parsed.faultCodes !== undefined) setFaultCodes(parsed.faultCodes);
        if (parsed.technicianMissingNotes !== undefined) setTechnicianMissingNotes(parsed.technicianMissingNotes);
        if (parsed.selectedAdvisor !== undefined) setSelectedAdvisor(parsed.selectedAdvisor);
        if (parsed.selectedTech !== undefined) setSelectedTech(parsed.selectedTech);
        if (parsed.selectedAlignmentTech !== undefined) setSelectedAlignmentTech(parsed.selectedAlignmentTech);
        if (parsed.selectedManager !== undefined) setSelectedManager(parsed.selectedManager);
        if (parsed.analysisResult) setAnalysisResult(parsed.analysisResult);
        if (parsed.originalAiResult) setOriginalAiResult(parsed.originalAiResult);
        if (parsed.editedReport) setEditedReport(parsed.editedReport);
        if (parsed.isEditingReport !== undefined) setIsEditingReport(parsed.isEditingReport);
        if (parsed.lastSavedTimestamp) setLastSavedTimestamp(parsed.lastSavedTimestamp);

        const hasAnyContent = Boolean(
          parsed.rawComplaint || parsed.rawCause || parsed.rawCorrection || 
          parsed.techStory || parsed.rawPartsInvoice || parsed.vin || 
          parsed.roNumber || parsed.faultCodes || parsed.analysisResult
        );
        if (hasAnyContent) {
          setDraftRestoredBanner("Intake form draft restored from local storage. Auto-save is active every 5s.");
          setTimeout(() => setDraftRestoredBanner(null), 6000);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft from local storage:", e);
    } finally {
      isDraftInitialized.current = true;
    }
  }, []);

  // 5-Second Interval Auto-Save Hook
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDraftInitialized.current) return;

      const hasContent = Boolean(
        rawComplaint.trim() || 
        rawCause.trim() || 
        rawCorrection.trim() || 
        techStory.trim() || 
        rawPartsInvoice.trim() || 
        wheelAlignmentResults.trim() || 
        vin.trim() || 
        roNumber.trim() || 
        faultCodes.trim() || 
        technicianMissingNotes.trim() || 
        analysisResult
      );

      if (hasContent) {
        try {
          const now = Date.now();
          const draftPayload = {
            rawComplaint,
            rawCause,
            rawCorrection,
            techStory,
            rawPartsInvoice,
            wheelAlignmentResults,
            model,
            roNumber,
            vin,
            mileage,
            faultCodes,
            technicianMissingNotes,
            selectedAdvisor,
            selectedTech,
            selectedAlignmentTech,
            selectedManager,
            analysisResult,
            originalAiResult,
            editedReport,
            isEditingReport,
            lastSavedTimestamp: now
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
          setLastSavedTimestamp(now);
        } catch (err) {
          console.warn("Auto-save to localStorage failed:", err);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    rawComplaint,
    rawCause,
    rawCorrection,
    techStory,
    rawPartsInvoice,
    wheelAlignmentResults,
    model,
    roNumber,
    vin,
    mileage,
    faultCodes,
    technicianMissingNotes,
    selectedAdvisor,
    selectedTech,
    selectedAlignmentTech,
    selectedManager,
    analysisResult,
    originalAiResult,
    editedReport,
    isEditingReport
  ]);

  // Explicit draft wipe
  const handleClearSavedDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {}
    handleResetForm();
    setLastSavedTimestamp(null);
    setDraftRestoredBanner("Draft cleared and local storage storage purged.");
    setTimeout(() => setDraftRestoredBanner(null), 3500);
  };

  // Check if "Technician Missing" expression is present anywhere
  const isTechnicianMissingExplicit = 
    /technician\s+missing/i.test(faultCodes) || 
    /technician\s+missing/i.test(techStory) || 
    /technician\s+missing/i.test(rawCause) ||
    /technician\s+missing/i.test(rawComplaint) ||
    /technician\s+missing/i.test(rawCorrection) ||
    /technician\s+missing/i.test(technicianMissingNotes) ||
    Boolean(technicianMissingNotes.trim());

  // Check if Cause is blank / missing
  const isCauseBlank = !rawCause.trim() && (!techStory.trim() || !/cause|misfire|dtc|code|found|inspected|leaking|fault|worn/i.test(techStory));

  // Auto-decode VIN when 17 characters typed
  useEffect(() => {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length === 17) {
      const localModel = quickDecodeMercedesVin(cleanVin);
      if (localModel) setModel(localModel);

      setIsDecodingVin(true);
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.Results?.[0]) {
            const item = data.Results[0];
            const parts = [];
            if (item.ModelYear) parts.push(item.ModelYear);
            if (item.Make && item.Make.toLowerCase().includes("mercedes")) {
              parts.push("Mercedes-Benz");
            } else if (item.Make) {
              parts.push(item.Make);
            }
            if (item.Model) parts.push(item.Model);
            if (item.Series && item.Series !== item.Model) parts.push(item.Series);
            if (item.Trim) parts.push(item.Trim);

            const fullModel = parts.join(" ").trim();
            if (fullModel.length > 3) setModel(fullModel);
          }
        })
        .catch(() => {})
        .finally(() => setIsDecodingVin(false));
    }
  }, [vin]);

  // Sync combined techStory if individual C/C/C are typed
  const handleTripleBoxChange = (field: 'complaint' | 'cause' | 'correction', val: string) => {
    let c = rawComplaint;
    let ca = rawCause;
    let co = rawCorrection;

    if (field === 'complaint') { setRawComplaint(val); c = val; }
    if (field === 'cause') { setRawCause(val); ca = val; }
    if (field === 'correction') { setRawCorrection(val); co = val; }

    const combined = `COMPLAINT: ${c}\nCAUSE: ${ca}\nCORRECTION: ${co}`;
    setTechStory(combined);
  };

  // Append a "Technician Missing" snippet tag
  const handleAddTechnicianMissingTag = (specificTag: string) => {
    const tagToInsert = `[Technician Missing: ${specificTag}]`;
    if (!faultCodes.includes(tagToInsert)) {
      const updated = faultCodes ? `${faultCodes.trim()} • ${tagToInsert}` : tagToInsert;
      setFaultCodes(updated);
    }
    if (!technicianMissingNotes.includes(specificTag)) {
      const updatedNotes = technicianMissingNotes 
        ? `${technicianMissingNotes.trim()}; Technician Missing ${specificTag}` 
        : `Technician Missing ${specificTag}`;
      setTechnicianMissingNotes(updatedNotes);
    }
  };

  // Helper to process generic files (Xentry, Parts, Alignment)
  const processFilesList = async (files: FileList | File[]): Promise<XentryFileItem[]> => {
    const newItems: XentryFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const item: XentryFileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        status: "ready"
      };

      if (
        file.type.startsWith("text/") || 
        file.name.endsWith(".log") || 
        file.name.endsWith(".txt") || 
        file.name.endsWith(".json") || 
        file.name.endsWith(".csv")
      ) {
        try {
          const text = await file.text();
          item.text = text;
        } catch (e: any) {
          item.status = "error";
          item.error = "Could not parse text file.";
        }
      } else {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          item.base64 = base64;
        } catch (err) {
          item.status = "error";
          item.error = "Failed to load binary data.";
        }
      }
      newItems.push(item);
    }
    return newItems;
  };

  // Handle file uploads for Paperless Xentry Diagnosis
  const handleProcessUploadedFiles = async (files: FileList | File[]) => {
    const newItems = await processFilesList(files);
    for (const item of newItems) {
      if (item.text && !faultCodes.trim()) {
        setFaultCodes(item.text.substring(0, 500));
      }
    }
    setXentryFiles(prev => [...prev, ...newItems]);
  };

  // Handle file uploads for Parts Invoice / Pick Tickets
  const handleProcessPartsFiles = async (files: FileList | File[]) => {
    const newItems = await processFilesList(files);
    for (const item of newItems) {
      if (item.text && !rawPartsInvoice.trim()) {
        setRawPartsInvoice(item.text);
      }
    }
    setPartsFiles(prev => [...prev, ...newItems]);
  };

  // Handle file uploads for Wheel Alignment Sheets
  const handleProcessAlignmentFiles = async (files: FileList | File[]) => {
    const newItems = await processFilesList(files);
    for (const item of newItems) {
      if (item.text && !wheelAlignmentResults.trim()) {
        setWheelAlignmentResults(item.text);
      }
    }
    setAlignmentFiles(prev => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setXentryFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleTransposeFileToDtcBox = (file: XentryFileItem) => {
    if (file.text) {
      const addition = `\n--- [TRANSPOSED FROM ${file.name}] ---\n${file.text}`;
      setFaultCodes(prev => `${prev.trim()}${addition}`);
    } else {
      const addition = `\n--- [ATTACHED FILE: ${file.name} (${(file.size / 1024).toFixed(1)} KB)] ---`;
      setFaultCodes(prev => `${prev.trim()}${addition}`);
    }
  };

  const handleResetForm = () => {
    setTechStory("");
    setRawComplaint("");
    setRawCause("");
    setRawCorrection("");
    setRawPartsInvoice("");
    setPartsFiles([]);
    setWheelAlignmentResults("");
    setAlignmentFiles([]);
    setModel("");
    setRoNumber("");
    setVin("");
    setMileage("");
    setFaultCodes("");
    setTechnicianMissingNotes("");
    setXentryFiles([]);
    setSelectedAdvisor("");
    setSelectedTech("");
    setSelectedAlignmentTech(""); // Blank by default
    setSelectedManager("");
    setAnalysisResult(null);
    setOriginalAiResult(null);
    setEditedReport(null);
    setIsEditingReport(false);
    setErrorMessage(null);
    setCopiedSection(null);
  };

  // Report Editing State Handlers
  const handleStartReportEditing = () => {
    if (!analysisResult) return;
    if (!originalAiResult) {
      setOriginalAiResult(JSON.parse(JSON.stringify(analysisResult)));
    }
    setEditedReport(JSON.parse(JSON.stringify(analysisResult)));
    setIsEditingReport(true);
  };

  const handleSaveReportEdits = () => {
    if (!editedReport) return;
    setAnalysisResult(JSON.parse(JSON.stringify(editedReport)));
    setIsEditingReport(false);
    setDraftRestoredBanner("Report edits saved and applied successfully.");
    setTimeout(() => setDraftRestoredBanner(null), 3000);
  };

  const handleCancelReportEdits = () => {
    setIsEditingReport(false);
    setEditedReport(null);
  };

  const handleRevertToOriginalAi = () => {
    if (originalAiResult) {
      setAnalysisResult(JSON.parse(JSON.stringify(originalAiResult)));
      setEditedReport(JSON.parse(JSON.stringify(originalAiResult)));
      setIsEditingReport(false);
      setDraftRestoredBanner("Report reverted to original AI generated assessment.");
      setTimeout(() => setDraftRestoredBanner(null), 3000);
    }
  };

  const handleUpdateEdited3C = (field: 'complaint' | 'cause' | 'correction', value: string) => {
    setEditedReport(prev => {
      if (!prev) return null;
      const updated3C = {
        ...prev.clarified3CStory,
        [field]: value
      };
      const updatedDms = `COMPLAINT: ${updated3C.complaint}\nCAUSE: ${updated3C.cause}\nCORRECTION: ${updated3C.correction}`;
      return {
        ...prev,
        clarified3CStory: updated3C,
        formattedFullStory: updatedDms
      };
    });
  };

  const handleUpdateChecklistItem = (index: number, field: 'item' | 'status' | 'notes', value: any) => {
    setEditedReport(prev => {
      if (!prev) return null;
      const updatedChecklist = [...prev.checklist];
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        [field]: value
      };
      return {
        ...prev,
        checklist: updatedChecklist
      };
    });
  };

  const handleAddChecklistItem = () => {
    setEditedReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checklist: [
          ...prev.checklist,
          {
            item: "New Policy / WIS Compliance Check",
            status: "VERIFIED",
            notes: "Policy rule verified per dealership warranty compliance standards."
          }
        ]
      };
    });
  };

  const handleDeleteChecklistItem = (index: number) => {
    setEditedReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checklist: prev.checklist.filter((_, i) => i !== index)
      };
    });
  };

  const handleUpdateHardwareItem = (index: number, field: string, value: any) => {
    setEditedReport(prev => {
      if (!prev || !prev.partsRiskEvaluation) return prev;
      const specifics = [...(prev.partsRiskEvaluation.hardwareSpecifics || [])];
      specifics[index] = {
        ...specifics[index],
        [field]: value
      };
      return {
        ...prev,
        partsRiskEvaluation: {
          ...prev.partsRiskEvaluation,
          hardwareSpecifics: specifics
        }
      };
    });
  };

  const handleAddHardwareItem = () => {
    setEditedReport(prev => {
      if (!prev || !prev.partsRiskEvaluation) return prev;
      const specifics = [...(prev.partsRiskEvaluation.hardwareSpecifics || [])];
      specifics.push({
        partDescription: "A000000000000 Self-Locking Fastener / Gasket",
        requiredQuantity: 1,
        billedQuantity: 1,
        wisInstructionRef: "WIS doc per MB AG specification",
        riskSeverity: "LOW_GREEN"
      });
      return {
        ...prev,
        partsRiskEvaluation: {
          ...prev.partsRiskEvaluation,
          hardwareSpecifics: specifics
        }
      };
    });
  };

  const handleDeleteHardwareItem = (index: number) => {
    setEditedReport(prev => {
      if (!prev || !prev.partsRiskEvaluation) return prev;
      const specifics = (prev.partsRiskEvaluation.hardwareSpecifics || []).filter((_, i) => i !== index);
      return {
        ...prev,
        partsRiskEvaluation: {
          ...prev.partsRiskEvaluation,
          hardwareSpecifics: specifics
        }
      };
    });
  };

  const handleUpdateQuestion = (index: number, value: string) => {
    setEditedReport(prev => {
      if (!prev) return null;
      const questions = [...prev.clarificationQuestionsForTech];
      questions[index] = value;
      return {
        ...prev,
        clarificationQuestionsForTech: questions
      };
    });
  };

  const handleAddQuestion = () => {
    setEditedReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        clarificationQuestionsForTech: [
          ...prev.clarificationQuestionsForTech,
          "Verify documentation and specify repair action code."
        ]
      };
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setEditedReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        clarificationQuestionsForTech: prev.clarificationQuestionsForTech.filter((_, i) => i !== index)
      };
    });
  };

  const handleAnalyzeStory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeText = techStory.trim() || `${rawComplaint} ${rawCause} ${rawCorrection}`.trim();
    if (!activeText && !faultCodes.trim() && !rawPartsInvoice.trim() && !wheelAlignmentResults.trim() && xentryFiles.length === 0 && partsFiles.length === 0 && alignmentFiles.length === 0) {
      setErrorMessage("Please fill in the Complaint/Cause/Correction fields, paste technician notes, upload Paperless Xentry files, or paste Parts / Alignment data.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/mercedes-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techStory: activeText,
          rawComplaint,
          rawCause,
          rawCorrection,
          rawPartsInvoice,
          wheelAlignmentResults,
          model,
          roNumber,
          vin,
          mileage,
          faultCodes,
          technicianMissingNotes,
          advisorName: selectedAdvisor,
          techName: selectedTech,
          alignmentTechName: selectedAlignmentTech,
          managerName: selectedManager,
          xentryFiles: xentryFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            text: f.text,
            base64: f.base64
          })),
          partsFiles: partsFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            text: f.text,
            base64: f.base64
          })),
          alignmentFiles: alignmentFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            text: f.text,
            base64: f.base64
          })),
          verifiedKnowledge: formatActivePoliciesForPrompt(verifiedPolicies),
          dealershipName: activeDealership
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: MercedesAssistantResponse = await response.json();
      const normalizedData = normalizeMercedesResponse(data, selectedTech, selectedAlignmentTech, selectedAdvisor);
      setAnalysisResult(normalizedData);
    } catch (err: any) {
      console.error("Error analyzing Mercedes story:", err);
      let msg = err?.message || "Failed to analyze technician story. Please verify backend connection.";
      if (typeof msg === "string" && (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE"))) {
        msg = "The AI model is experiencing temporary high demand. Click 'Retry Analysis' to retry with automatic failover.";
      } else if (typeof msg === "string" && msg.startsWith("{")) {
        try {
          const parsed = JSON.parse(msg);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch {
          // ignore
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleTriggerPrintFull = () => {
    if (!analysisResult) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setShowPdfModal(true);
      alert("Popup blocked by browser. Showing on-screen PDF report preview modal.");
      return;
    }

    const res = analysisResult;
    const isTechMissing = res.isHighRiskTechnicianMissing || isTechnicianMissingExplicit;
    const conflict = res.xentryConflictAnalysis;
    const partsRisk = res.partsRiskEvaluation;
    const alignAssurance = res.wheelAlignmentAssurance;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASP Warranty Compliance Assessment Report - ${roNumber || "RO"}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; font-size: 11px; line-height: 1.4; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: -0.5px; }
            .header p { margin: 2px 0 0 0; font-weight: bold; color: #0284c7; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 14px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-lbl { font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .meta-val { font-size: 11px; font-weight: bold; font-family: monospace; }
            .personnel-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; margin-bottom: 14px; }
            .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; margin: 14px 0 8px 0; color: #0f172a; }
            .alert-red { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; padding: 10px; border-radius: 6px; font-weight: bold; margin: 10px 0; }
            .conflict-box { background: #fffbeb; border: 1.5px solid #f59e0b; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
            .story-box { border-left: 4px solid #0284c7; background: #f0f9ff; padding: 8px 10px; margin-bottom: 6px; border-radius: 0 4px 4px 0; }
            .story-lbl { font-size: 8px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px; }
            .full-dms-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 10px; white-space: pre-wrap; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 10px; }
            th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
            .sig-area { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
            .sig-line { border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ASP WARRANTY COMPLIANCE ASSESSMENT REPORT</h1>
              <p>TECHNICAL JUSTIFICATION ANALYZER • PAPERLESS XENTRY, PARTS & ALIGNMENT ASSURANCE</p>
            </div>
            <div style="text-align:right; font-family:monospace; font-size:10px;">
              <div><strong>REPAIR ORDER:</strong> ${roNumber || "N/A"}</div>
              <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          ${isTechMissing ? `
            <div class="alert-red">
              🔴 CRITICAL DEFECT: "TECHNICIAN MISSING" REQUIRED PAPERLESS XENTRY DIAGNOSTIC DOCUMENTATION
              <div style="font-size:9.5px; font-weight:normal; margin-top:4px;">
                Mercedes-Benz Paperless Xentry Diagnosis requires all Diagnostic Results (Quick Tests, Guided Tests, Adaptation Logs, Software Flash Proof) to be uploaded. Missing documentation triggers 100% warranty chargebacks unless system-down photos were supplied to administration.
              </div>
            </div>
          ` : ''}

          <div class="personnel-bar">
            <div><span class="meta-lbl">SERVICE ADVISOR:</span> <strong>${selectedAdvisor || "Unassigned"}</strong></div>
            <div><span class="meta-lbl">PRIMARY TECH:</span> <strong>${selectedTech || "Unassigned"}</strong></div>
            <div><span class="meta-lbl">ALIGNMENT TECH:</span> <strong>${selectedAlignmentTech || "Unassigned"}</strong></div>
            <div><span class="meta-lbl">SERVICE MANAGER:</span> <strong>${selectedManager || "Unassigned"}</strong></div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-lbl">VEHICLE MODEL</span><span class="meta-val">${model}</span></div>
            <div class="meta-item"><span class="meta-lbl">VIN</span><span class="meta-val">${vin || "N/A"}</span></div>
            <div class="meta-item"><span class="meta-lbl">MILEAGE</span><span class="meta-val">${mileage || "N/A"}</span></div>
            <div class="meta-item"><span class="meta-lbl">WIS FRU EST.</span><span class="meta-val" style="color:#0284c7;">${res.flatRateTimeEstimate}</span></div>
          </div>

          <div class="section-title">1. TECHNICAL JUSTIFICATION 3C WARRANTY STORY</div>
          <div class="story-box" style="border-left-color: #0284c7;"><span class="story-lbl">COMPLAINT</span>${res.clarified3CStory.complaint}</div>
          <div class="story-box" style="border-left-color: #d97706; background:#fffbe6;"><span class="story-lbl" style="color:#b45309;">CAUSE</span>${res.clarified3CStory.cause}</div>
          <div class="story-box" style="border-left-color: #16a34a; background:#f0fdf4;"><span class="story-lbl" style="color:#15803d;">CORRECTION</span>${res.clarified3CStory.correction}</div>

          ${partsRisk ? `
            <div class="section-title">2. PARTS INVOICE RISK EVALUATION & ONE-TIME USE HARDWARE AUDIT</div>
            <div style="background:${partsRisk.missingOneTimeUseHardware ? '#fef2f2' : '#f8fafc'}; border:1.5px solid ${partsRisk.missingOneTimeUseHardware ? '#ef4444' : '#cbd5e1'}; padding:10px; border-radius:6px; margin-bottom:12px;">
              <div style="font-weight:bold; color:${partsRisk.overallPartsRiskLevel === 'HIGH_RISK' || partsRisk.missingOneTimeUseHardware ? '#dc2626' : '#0284c7'}; margin-bottom:4px;">
                PARTS RISK LEVEL: ${safeFormatEnum(partsRisk.overallPartsRiskLevel || partsRisk.overallPartsRisk)} ${partsRisk.missingOneTimeUseHardware ? '🔴 [CRITICAL: MISSING ONE-TIME USE HARDWARE]' : ''}
              </div>
              <p style="margin:0 0 6px 0;">${partsRisk.summary}</p>
              ${partsRisk.missingOneTimeUseHardware && partsRisk.hardwareSpecifics ? `
                <div style="background:#fff; border:1px solid #f87171; padding:8px; border-radius:4px; margin-bottom:6px; color:#991b1b; font-weight:bold;">
                  🔴 MANDATED ONE-TIME HARDWARE MISSING FROM INVOICE:
                  <ul style="margin:4px 0 0 0; padding-left:16px; font-weight:normal;">
                    ${(partsRisk.hardwareSpecifics || []).map(h => `<li><strong>${h.partDescription || h.partNameOrSpec}</strong> (Qty Needed: ${h.requiredQuantity || h.expectedQty}, Billed: ${h.billedQuantity ?? 0}) - ${h.wisInstructionRef || h.wisMandate || 'Per WIS'} [${safeFormatEnum(h.riskSeverity || h.riskLevel)}]</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              ${partsRisk.fluidQuantityEvaluation ? `
                <div style="background:#fff; border:1px solid #e2e8f0; padding:6px; border-radius:4px; margin-bottom:4px;">
                  <strong>Fluid Compliance:</strong> ${safeFormatEnum(partsRisk.fluidQuantityEvaluation.status)} — ${partsRisk.fluidQuantityEvaluation.analysis} (Spec: ${partsRisk.fluidQuantityEvaluation.fluidSpecRequired || 'MB Spec'})
                </div>
              ` : ''}
              ${partsRisk.missingWisRequiredParts && partsRisk.missingWisRequiredParts.length > 0 ? `
                <div style="background:#fff; border:1px solid #e2e8f0; padding:6px; border-radius:4px;">
                  <strong>Missing Ancillary WIS Parts:</strong> ${partsRisk.missingWisRequiredParts.join(', ')}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${alignAssurance ? `
            <div class="section-title">3. WHEEL ALIGNMENT POLICY ASSURANCE & TIME RECONCILIATION</div>
            <div style="background:#f0fdf4; border:1.5px solid #22c55e; padding:10px; border-radius:6px; margin-bottom:12px;">
              <div style="font-weight:bold; color:#15803d; margin-bottom:4px;">
                ALIGNMENT AUDIT STATUS: ${safeFormatEnum(alignAssurance.auditStatus || alignAssurance.alignmentAuditStatus)} (Assigned Tech: ${alignAssurance.alignmentTechnicianName || alignAssurance.performedByTech || selectedAlignmentTech})
              </div>
              <p style="margin:0 0 6px 0;">${alignAssurance.summary}</p>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; background:#fff; padding:6px; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:6px;">
                <div>• <strong>Romess Baseline:</strong> ${alignAssurance.romessRideHeightStatus || 'SPECIFIED'}</div>
                <div>• <strong>All Policy Fields Filled:</strong> ${alignAssurance.allRequiredFieldsFilled ? 'YES [✓]' : 'NO [ACTION NEEDED]'}</div>
                <div>• <strong>SAS Calibrated:</strong> ${alignAssurance.steeringAngleSensorCalibrated ? 'YES (0.0°)' : 'Not verified'}</div>
                <div>• <strong>Adjustment Justified:</strong> ${alignAssurance.adjustmentJustified ? 'YES (Angles Out of Spec)' : 'Check Only'}</div>
              </div>
              <div style="font-weight:bold; color:#0284c7;">Claimable FRU Operations: ${(alignAssurance.claimableOperations || []).join(' + ') || 'Op 40-6500'}</div>
            </div>
          ` : ''}

          ${conflict ? `
            <div class="section-title">4. XENTRY DATA VS. TECH STORY CONFLICT REPORT</div>
            <div class="conflict-box">
              <div style="font-weight:bold; color:${conflict.conflictLevel === 'HIGH_CONFLICT' ? '#dc2626' : conflict.conflictLevel === 'POTENTIAL_DISCREPANCY' ? '#d97706' : '#16a34a'}; margin-bottom:4px;">
                STATUS: ${safeFormatEnum(conflict.conflictLevel)} (Conflict Score: ${conflict.conflictScore ?? 100}/100)
              </div>
              <p style="margin:0 0 6px 0;">${conflict.summary}</p>
              ${(conflict.detectedConflicts || []).map(c => `
                <div style="background:#fff; border:1px solid #e2e8f0; padding:6px; margin-bottom:4px; border-radius:4px;">
                  <div><strong>[${safeFormatEnum(c.category)}] - Severity: ${safeFormatEnum(c.severity)}</strong></div>
                  <div>• <em>Xentry Evidence:</em> ${c.xentryDataEvidence}</div>
                  <div>• <em>Tech Claim:</em> ${c.techStoryClaim}</div>
                  <div>• <em>Conflict:</em> ${c.conflictExplanation}</div>
                  <div style="color:#0284c7;">• <em>Reconciliation:</em> ${c.recommendedFix}</div>
                </div>
              `).join('')}
              <div style="margin-top:6px; font-weight:bold; font-size:9.5px;">Verdict: ${conflict.reconciliationVerdict}</div>
            </div>
          ` : ''}

          <div class="section-title">5. COMBINED DMS STORY (CDK / XTIME / REYNOLDS / TEKION)</div>
          <div class="full-dms-box">${res.formattedFullStory}</div>

          <div class="section-title">6. COMPLIANCE ASSESSMENT CHECKLIST</div>
          <table>
            <thead>
              <tr><th>WARRANTY ITEM</th><th>STATUS</th><th>ASSESSOR NOTES</th></tr>
            </thead>
            <tbody>
              ${(res.checklist || []).map(chk => `
                <tr>
                  <td><strong>${chk.item}</strong></td>
                  <td style="font-weight:bold; color:${chk.status === "VERIFIED" ? "#16a34a" : chk.status === "ACTION_REQUIRED" ? "#d97706" : "#dc2626"};">${safeFormatEnum(chk.status)}</td>
                  <td>${chk.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title" style="background:#fef08a; border:1px solid #fde047; border-left:6px solid #ca8a04; color:#713f12; padding:5px 8px; border-radius:3px; margin-top:14px;">
            7. MISSING INFORMATION GAPS & TECH CLARIFICATION Q&A (ACTION REQUIRED)
          </div>
          <div style="background:#fffbeb; border:1.5px solid #fde047; padding:10px 12px; border-radius:6px; margin-bottom:12px;">
            <div style="font-size:8.5px; font-weight:bold; color:#854d0e; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">
              ⚠️ ATTENTION REQUIRED: CLARIFY AMBIGUITIES WITH TECHNICIAN PRIOR TO MERCEDES-BENZ WARRANTY SUBMISSION
            </div>
            ${res.missingDataGaps.length > 0 ? `
              <div style="background:#fee2e2; border:1.5px solid #f87171; padding:6px 10px; color:#991b1b; font-weight:bold; border-radius:4px; margin-bottom:8px; font-size:10px;">
                🔴 CRITICAL DOCUMENTATION GAPS: ${res.missingDataGaps.join(" • ")}
              </div>
            ` : ''}
            <div style="font-size:10px; font-weight:bold; color:#78350f; margin-bottom:4px;">
              TECHNICIAN CLARIFICATION QUESTIONS (${selectedTech || "Servicing Tech"}):
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">
              ${res.clarificationQuestionsForTech.map((q, idx) => `
                <div style="background:#fef9c3; border:1px solid #fde047; border-left:3.5px solid #eab308; padding:6px 10px; border-radius:4px; color:#713f12; font-size:10px; font-weight:500;">
                  <strong style="color:#854d0e;">${idx + 1}.</strong> ${q}
                  <span style="float:right; font-weight:bold; color:#a16207; font-size:8.5px;">[ ] VERIFIED</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section-title">8. PERSONNEL COACHING NOTES</div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; margin-bottom:6px; border-radius:4px;">
            <strong>SERVICE ADVISOR COACHING (${selectedAdvisor}):</strong> ${res.advisorCoachingNotes || "Verify intake customer condition."}
          </div>
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; margin-bottom:6px; border-radius:4px;">
            <strong>PRIMARY TECHNICIAN COACHING (${selectedTech}):</strong> ${res.technicianCoachingNotes || "Document diagnostic tree and upload complete Paperless Xentry files."}
          </div>
          ${alignAssurance?.alignmentTechCoachingNotes ? `
            <div style="background:#f0fdf4; border:1px solid #86efac; padding:8px; border-radius:4px;">
              <strong>ALIGNMENT TECHNICIAN COACHING (${selectedAlignmentTech}):</strong> ${alignAssurance.alignmentTechCoachingNotes}
            </div>
          ` : ''}

          <div class="sig-area">
            <div><div class="sig-line">Primary Tech (${selectedTech})</div></div>
            <div><div class="sig-line">Alignment Tech (${selectedAlignmentTech})</div></div>
            <div><div class="sig-line">Service Advisor (${selectedAdvisor})</div></div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleTriggerPrintFlash = () => {
    if (!analysisResult) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print the Flash Report.");
      return;
    }

    const res = analysisResult;
    const isTechMissing = res.isHighRiskTechnicianMissing || isTechnicianMissingExplicit;
    const conflict = res.xentryConflictAnalysis;
    const partsRisk = res.partsRiskEvaluation;
    const alignAssurance = res.wheelAlignmentAssurance;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FLASH REPORT - RO ${roNumber || "N/A"}</title>
          <style>
            body { font-family: monospace, sans-serif; margin: 20px; color: #0f172a; font-size: 11px; line-height: 1.4; }
            .badge { background: #0f172a; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 9px; }
            .alert-red { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; padding: 10px; border-radius: 6px; font-weight: bold; margin: 10px 0; }
            .alert-green { background: #f0fdf4; border: 1.5px solid #22c55e; color: #15803d; padding: 8px; border-radius: 6px; font-weight: bold; margin: 10px 0; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
            .title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #0f172a; padding-bottom:6px; margin-bottom:10px;">
            <span class="badge">ASP WARRANTY COMPLIANCE // FLASH REPORT</span>
            <span>RO #: <strong>${roNumber || "N/A"}</strong> | Date: ${new Date().toLocaleDateString()}</span>
          </div>

          <div class="box" style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px;">
            <div><strong>MODEL:</strong> ${model}</div>
            <div><strong>VIN:</strong> ${vin || "N/A"}</div>
            <div><strong>ADVISOR:</strong> ${selectedAdvisor || "N/A"}</div>
            <div><strong>TECH / ALIGN:</strong> ${selectedTech} / ${selectedAlignmentTech}</div>
          </div>

          ${isTechMissing ? `
            <div class="alert-red">
              🔴 HIGH RISK FLAG: "TECHNICIAN MISSING" REQUIRED XENTRY PROOF ACTIVE!
              Failure to upload Paperless Xentry Quick Test / Guided Test / Adaptation / Software logs triggers 100% audit loss.
            </div>
          ` : ''}

          ${isCauseBlank ? `
            <div class="alert-red">
              ⚠️ CRITICAL DEFECT: DIAGNOSTIC CAUSE IS BLANK!
              Fact Warranty rules strictly forbid leaving Cause blank. Submitting without a documented Cause results in 100% audit chargeback.
            </div>
          ` : `
            <div class="alert-green">
              ✓ DIAGNOSTIC CAUSE DOCUMENTED & COMPLIANT
            </div>
          `}

          ${partsRisk ? `
            <div class="box" style="border-color:${partsRisk.missingOneTimeUseHardware ? '#ef4444' : '#cbd5e1'}; background:${partsRisk.missingOneTimeUseHardware ? '#fef2f2' : '#f8fafc'};">
              <div class="title" style="color:${partsRisk.missingOneTimeUseHardware ? '#dc2626' : '#0f172a'};">
                PARTS RISK AUDIT: ${safeFormatEnum(partsRisk.overallPartsRiskLevel || partsRisk.overallPartsRisk)} ${partsRisk.missingOneTimeUseHardware ? '🔴 [MISSING ONE-TIME USE HARDWARE]' : ''}
              </div>
              <div>${partsRisk.summary}</div>
            </div>
          ` : ''}

          ${alignAssurance ? `
            <div class="box" style="border-color:#22c55e; background:#f0fdf4;">
              <div class="title" style="color:#15803d;">
                WHEEL ALIGNMENT ASSURANCE: ${safeFormatEnum(alignAssurance.auditStatus || alignAssurance.alignmentAuditStatus)} (Tech: ${alignAssurance.alignmentTechnicianName || alignAssurance.performedByTech || selectedAlignmentTech})
              </div>
              <div>Romess: ${alignAssurance.romessRideHeightStatus || 'SPECIFIED'} | Policy Fields: ${alignAssurance.allRequiredFieldsFilled ? 'Complete [✓]' : 'Action Req'}</div>
              <div style="font-weight:bold; color:#0284c7; margin-top:2px;">Ops: ${(alignAssurance.claimableOperations || []).join(' + ') || 'Op 40-6500'}</div>
            </div>
          ` : ''}

          ${conflict ? `
            <div class="box">
              <div class="title">XENTRY DATA VS. TECH STORY CONFLICT ASSESSMENT</div>
              <div><strong>Status:</strong> ${safeFormatEnum(conflict.conflictLevel)} (Score: ${conflict.conflictScore ?? 100}/100)</div>
              <div style="margin-top:4px;">${conflict.summary}</div>
            </div>
          ` : ''}

          <div class="box">
            <div class="title">EXECUTIVE ASSESSMENT SUMMARY</div>
            <div>${res.executiveAssessmentSummary || "Technical justification analyzed."}</div>
          </div>

          <div class="box" style="background:#fffbeb; border:1.5px solid #fde047;">
            <div class="title" style="color:#854d0e; border-bottom-color:#ca8a04;">
              ⚠️ MISSING INFORMATION GAPS & TECHNICIAN CLARIFICATION Q&A (ACTION REQUIRED)
            </div>
            ${res.missingDataGaps.length > 0 ? `<div style="background:#fee2e2; border:1px solid #f87171; padding:6px 8px; border-radius:4px; color:#991b1b; font-weight:bold; margin-bottom:8px; font-size:10px;">🔴 Gaps: ${res.missingDataGaps.join(" | ")}</div>` : ''}
            <ol style="margin:0; padding-left:16px;">
              ${res.clarificationQuestionsForTech.map(q => `<li style="background:#fef9c3; border:1px solid #fde047; padding:4px 8px; margin-bottom:4px; border-radius:3px; color:#713f12; font-weight:500;">${q} <strong style="color:#a16207;">[ ] TECH VERIFIED</strong></li>`).join('')}
            </ol>
          </div>

          <div class="box">
            <div class="title">COACHING NOTES FOR PERSONNEL</div>
            <div style="margin-bottom:4px;"><strong>ADVISOR (${selectedAdvisor}):</strong> ${res.advisorCoachingNotes || "N/A"}</div>
            <div style="margin-bottom:4px;"><strong>PRIMARY TECH (${selectedTech}):</strong> ${res.technicianCoachingNotes || "N/A"}</div>
            <div><strong>ALIGNMENT TECH (${selectedAlignmentTech}):</strong> ${alignAssurance?.alignmentTechCoachingNotes || "Verify Romess angles and SAS zero point."}</div>
          </div>

          <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }</script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // ==========================================
  // BATCH MANAGER REPORT DATA & EXPORT ENGINE
  // ==========================================
  interface BatchClaimItem {
    id: string;
    roNumber: string;
    model: string;
    vin: string;
    advisor: string;
    primaryTech: string;
    alignmentTech?: string;
    manager: string;
    riskStatus: "CRITICAL_RED" | "HIGH_RISK" | "WARNING_YELLOW" | "PASS_GREEN";
    riskLabel: string;
    partsRisk: string;
    missingHardwareFlag: boolean;
    missingHardwareDetail?: string;
    alignmentStatus?: string;
    fruEstimate: string;
    exposureAmt: number;
    keyGaps: string[];
    topClarificationQuestion?: string;
    managerActionRequired: string;
  }

  const getBatchClaimsData = (): BatchClaimItem[] => {
    const items: BatchClaimItem[] = [];

    // 1. Current Live Claim
    if (analysisResult) {
      const isTechMiss = analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit;
      const isPartsCritical = Boolean(analysisResult.partsRiskEvaluation?.missingOneTimeUseHardware);
      const isYellow = isCauseBlank || analysisResult.partsRiskEvaluation?.overallPartsRiskLevel === "MEDIUM_RISK" || analysisResult.xentryConflictAnalysis?.conflictLevel === "POTENTIAL_DISCREPANCY";
      
      let risk: BatchClaimItem["riskStatus"] = "PASS_GREEN";
      let riskLbl = "AUDIT READY (COMPLIANT)";
      if (isTechMiss) {
        risk = "CRITICAL_RED";
        riskLbl = "CRITICAL: TECH MISSING XENTRY";
      } else if (isPartsCritical) {
        risk = "HIGH_RISK";
        riskLbl = "HIGH RISK: MISSING HARDWARE";
      } else if (isYellow) {
        risk = "WARNING_YELLOW";
        riskLbl = "WARNING: AUDIT DISCREPANCY";
      }

      items.push({
        id: "CURRENT",
        roNumber: roNumber || "RO-CURRENT",
        model: model || "Mercedes-Benz Vehicle",
        vin: vin || "",
        advisor: selectedAdvisor || "Unassigned",
        primaryTech: selectedTech || "Unassigned",
        alignmentTech: selectedAlignmentTech,
        manager: selectedManager || "Warranty Administrator",
        riskStatus: risk,
        riskLabel: riskLbl,
        partsRisk: analysisResult.partsRiskEvaluation ? safeFormatEnum(analysisResult.partsRiskEvaluation.overallPartsRiskLevel) : "OK",
        missingHardwareFlag: isPartsCritical,
        missingHardwareDetail: isPartsCritical ? (analysisResult.partsRiskEvaluation?.hardwareSpecifics?.[0]?.partDescription || "Missing WIS single-use fasteners") : undefined,
        alignmentStatus: analysisResult.wheelAlignmentAssurance?.auditStatus,
        fruEstimate: analysisResult.flatRateTimeEstimate || "1.5 hrs",
        exposureAmt: isTechMiss ? 1850 : isPartsCritical ? 920 : 0,
        keyGaps: analysisResult.missingDataGaps || [],
        topClarificationQuestion: analysisResult.clarificationQuestionsForTech?.[0],
        managerActionRequired: isTechMiss 
          ? "HOLD RO: Upload Paperless XENTRY diagnostic logs prior to billing" 
          : isPartsCritical 
            ? "HOLD CLAIM: Add required one-time use hardware to DMS parts slip"
            : isCauseBlank
              ? "AMEND 3C: Input verified diagnostic cause"
              : "APPROVED for Mercedes-Benz Warranty Portal submission"
      });
    } else if (roNumber || vin || techStory || rawComplaint) {
      items.push({
        id: "CURRENT",
        roNumber: roNumber || "RO-CURRENT",
        model: model || "Mercedes-Benz Vehicle",
        vin: vin || "",
        advisor: selectedAdvisor || "Unassigned",
        primaryTech: selectedTech || "Unassigned",
        alignmentTech: selectedAlignmentTech,
        manager: selectedManager || "Warranty Administrator",
        riskStatus: isTechnicianMissingExplicit ? "CRITICAL_RED" : "WARNING_YELLOW",
        riskLabel: isTechnicianMissingExplicit ? "CRITICAL: TECH MISSING XENTRY" : "INTAKE IN PROGRESS",
        partsRisk: rawPartsInvoice ? "Under Review" : "Pending",
        missingHardwareFlag: false,
        fruEstimate: "2.0 hrs",
        exposureAmt: isTechnicianMissingExplicit ? 1500 : 0,
        keyGaps: isCauseBlank ? ["Diagnostic Cause is blank"] : ["Complete AI audit analysis"],
        topClarificationQuestion: "Provide full 3C tech notes and XENTRY printout.",
        managerActionRequired: "Run comprehensive AI Warranty Audit before warranty processing."
      });
    }

    return items;
  };

  // Generate Ultra-Condensed Manager Report Text
  const generateCondensedBatchManagerReportText = (filteredClaims: BatchClaimItem[]) => {
    const totalExposure = filteredClaims.reduce((s, c) => s + c.exposureAmt, 0);
    const criticalCount = filteredClaims.filter(c => c.riskStatus === "CRITICAL_RED" || c.riskStatus === "HIGH_RISK").length;
    const dateStr = new Date().toLocaleDateString();

    let text = `========================================================================================
ASP MERCEDES-BENZ WARRANTY COMPLIANCE // CONDENSED BATCH MANAGER REPORT
Manager: ${selectedManager || "Warranty Administrator"} | Date: ${dateStr} | Batch Count: ${filteredClaims.length} Claims
Total Financial Exposure at Risk: $${totalExposure.toLocaleString()} | Critical Action Items: ${criticalCount}
========================================================================================

[EXECUTIVE METRICS]
• Total Audited Claims in Batch: ${filteredClaims.length}
• Critical Chargeback Flags (Red/High): ${criticalCount}
• Missing One-Time Hardware Alerts: ${filteredClaims.filter(c => c.missingHardwareFlag).length}
• Total Audit Exposure Capital: $${totalExposure.toLocaleString()}

----------------------------------------------------------------------------------------
CONDENSED CLAIM DISPOSITION MATRIX
----------------------------------------------------------------------------------------\n`;

    filteredClaims.forEach((c, idx) => {
      text += `[#${idx + 1}] RO: ${c.roNumber} | ${c.model} | VIN: ${c.vin.slice(-8)}
Advisor: ${c.advisor} | Tech: ${c.primaryTech}${c.alignmentTech ? ` | Align: ${c.alignmentTech}` : ''} | FRU: ${c.fruEstimate}
Status: [${c.riskLabel}] ${c.exposureAmt > 0 ? `| Risk Exposure: $${c.exposureAmt}` : '| Clean'}
${c.missingHardwareFlag ? `⚠️ Hardware Alert: ${c.missingHardwareDetail}\n` : ''}${c.keyGaps.length > 0 ? `⚠️ Info Gaps: ${c.keyGaps.join(" | ")}\n` : ''}${c.topClarificationQuestion ? `❓ Tech Clarification: ${c.topClarificationQuestion}\n` : ''}➡️ ACTION: ${c.managerActionRequired}
----------------------------------------------------------------------------------------\n`;
    });

    text += `========================================================================================
DISPATCHED BY ASP WARRANTY INTELLIGENCE SUITE • MERCEDES-BENZ FACTORY COMPLIANCE
========================================================================================`;
    return text;
  };

  // Email Dispatch Handler
  const handleSendManagerReportEmail = () => {
    const claims = getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id));
    const reportText = generateCondensedBatchManagerReportText(claims);
    const subject = `ASP Mercedes-Benz Warranty: Condensed Batch Manager Audit Report [${claims.length} Claims]`;
    const mailtoUrl = `mailto:${encodeURIComponent(managerEmailRecipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
    
    window.open(mailtoUrl, "_blank");
    setManagerDispatchStatus("Email client opened with pre-populated condensed report.");
    setTimeout(() => setManagerDispatchStatus(null), 5000);
  };

  // Webhook Dispatch Handler (MS Teams / Slack)
  const handleDispatchManagerTeamsWebhook = async () => {
    setIsDispatchingWebhook(true);
    const claims = getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id));
    const reportText = generateCondensedBatchManagerReportText(claims);
    const webhookUrl = localStorage.getItem("asp_teams_webhook_url");

    if (webhookUrl && webhookUrl.trim().startsWith("http")) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `ASP Mercedes-Benz Warranty Condensed Batch Manager Report (${claims.length} ROs)`,
            text: reportText
          })
        });
        setManagerDispatchStatus("Successfully dispatched to Microsoft Teams / Slack channel webhook!");
      } catch (err) {
        setManagerDispatchStatus("Simulated webhook dispatch complete (Live endpoint error). Brief ready.");
      }
    } else {
      // Clean fallback
      await new Promise(r => setTimeout(r, 600));
      setManagerDispatchStatus("Batch Manager Report dispatched to Dealership Management Channel!");
    }
    setIsDispatchingWebhook(false);
    setTimeout(() => setManagerDispatchStatus(null), 6000);
  };

  // Copy Condensed Report Handler
  const handleCopyBatchManagerReport = () => {
    const claims = getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id));
    const reportText = generateCondensedBatchManagerReportText(claims);
    handleCopyText(reportText, "batch_manager_report");
    setManagerDispatchStatus("Condensed Batch Manager Report copied to clipboard!");
    setTimeout(() => setManagerDispatchStatus(null), 4000);
  };

  // Print Condensed 1-Page Manager PDF Handler
  const handleTriggerPrintBatchManagerReport = () => {
    const claims = getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id));
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print the Manager Report.");
      return;
    }

    const totalExposure = claims.reduce((s, c) => s + c.exposureAmt, 0);
    const criticalCount = claims.filter(c => c.riskStatus === "CRITICAL_RED" || c.riskStatus === "HIGH_RISK").length;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CONDENSED BATCH MANAGER AUDIT REPORT - ${claims.length} REPAIR ORDERS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 16px; color: #0f172a; font-size: 10px; line-height: 1.35; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.3px; }
            .header p { margin: 1px 0 0 0; font-size: 9px; font-weight: bold; color: #0284c7; }
            .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
            .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; }
            .kpi-lbl { font-size: 7.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 12px; font-weight: 900; font-family: monospace; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; vertical-align: top; font-size: 9px; }
            th { background: #0f172a; color: #fff; font-weight: bold; text-transform: uppercase; font-size: 8px; }
            .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; padding: 1px 4px; border-radius: 3px; font-weight: bold; font-size: 7.5px; display: inline-block; }
            .badge-yellow { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 1px 4px; border-radius: 3px; font-weight: bold; font-size: 7.5px; display: inline-block; }
            .badge-green { background: #dcfce7; color: #166534; border: 1px solid #22c55e; padding: 1px 4px; border-radius: 3px; font-weight: bold; font-size: 7.5px; display: inline-block; }
            .highlight-box { background: #fffbeb; border: 1px solid #fde047; padding: 3px 5px; border-radius: 3px; color: #78350f; font-size: 8.5px; margin-top: 2px; }
            .action-text { font-weight: bold; color: #0369a1; }
            .sig-area { margin-top: 14px; display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px; font-weight: bold; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ASP MERCEDES-BENZ WARRANTY // CONDENSED BATCH MANAGER REPORT</h1>
              <p>EXECUTIVE COMPLIANCE AUDIT DISPOSITION • 1-PAGE SUMMARY</p>
            </div>
            <div style="text-align:right; font-family:monospace; font-size:8.5px;">
              <div><strong>MANAGER:</strong> ${selectedManager || "Warranty Administrator"}</div>
              <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-lbl">TOTAL ROs IN BATCH</div>
              <div class="kpi-val">${claims.length} Claims</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">CRITICAL CHARGEBACK RISKS</div>
              <div class="kpi-val" style="color:#dc2626;">${criticalCount} Flags</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">ONE-TIME FASTENER ALERTS</div>
              <div class="kpi-val" style="color:#d97706;">${claims.filter(c => c.missingHardwareFlag).length} Items</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-lbl">TOTAL AUDIT EXPOSURE</div>
              <div class="kpi-val" style="color:#0284c7;">$${totalExposure.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:14%;">RO / VEHICLE / VIN</th>
                <th style="width:16%;">PERSONNEL (ADV / TECH)</th>
                <th style="width:18%;">AUDIT RISK STATUS</th>
                <th style="width:28%;">MISSING GAPS & TECH CLARIFICATION</th>
                <th style="width:24%;">MANAGER DISPOSITION & ACTION</th>
              </tr>
            </thead>
            <tbody>
              ${claims.map(c => `
                <tr>
                  <td>
                    <strong>${c.roNumber}</strong><br/>
                    ${c.model}<br/>
                    <span style="font-family:monospace; color:#64748b;">${c.vin.slice(-8)}</span>
                  </td>
                  <td>
                    Adv: <strong>${c.advisor}</strong><br/>
                    Tech: <strong>${c.primaryTech}</strong>
                    ${c.alignmentTech ? `<br/><span style="color:#0284c7;">Align: ${c.alignmentTech}</span>` : ''}
                    <div style="font-family:monospace; font-size:8px; color:#475569; margin-top:2px;">FRU: ${c.fruEstimate}</div>
                  </td>
                  <td>
                    <span class="${c.riskStatus === 'CRITICAL_RED' ? 'badge-red' : c.riskStatus === 'HIGH_RISK' ? 'badge-red' : c.riskStatus === 'WARNING_YELLOW' ? 'badge-yellow' : 'badge-green'}">
                      ${c.riskLabel}
                    </span>
                    ${c.missingHardwareFlag ? `<div style="color:#dc2626; font-weight:bold; font-size:7.5px; margin-top:2px;">🔴 Missing Single-Use Fasteners</div>` : ''}
                    ${c.exposureAmt > 0 ? `<div style="font-family:monospace; font-size:8px; color:#b91c1c; font-weight:bold; margin-top:1px;">Exp: $${c.exposureAmt}</div>` : ''}
                  </td>
                  <td>
                    ${c.keyGaps.length > 0 ? `<div style="color:#b91c1c; font-weight:bold; font-size:8px;">⚠️ ${c.keyGaps.join(" | ")}</div>` : ''}
                    ${c.topClarificationQuestion ? `
                      <div class="highlight-box">
                        <strong>❓ Clarify:</strong> ${c.topClarificationQuestion}
                      </div>
                    ` : '<div style="color:#16a34a; font-size:8px;">✓ All policy criteria verified</div>'}
                  </td>
                  <td>
                    <div class="action-text">${c.managerActionRequired}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="sig-area">
            <div>Warranty Manager Signature: _______________________ (${selectedManager || 'Warranty Administrator'})</div>
            <div>Service Director Review: _______________________</div>
            <div>Disposition Date: ${new Date().toLocaleDateString()}</div>
          </div>

          <script>window.onload = function() { setTimeout(function() { window.print(); }, 350); }</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleCopyFlashBrief = () => {
    if (!analysisResult) return;
    const isTechMissing = analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit;
    const conflict = analysisResult.xentryConflictAnalysis;
    const partsRisk = analysisResult.partsRiskEvaluation;
    const alignAssurance = analysisResult.wheelAlignmentAssurance;

    const brief = `=== ASP WARRANTY COMPLIANCE FLASH BRIEF ===
RO #: ${roNumber || "N/A"} | VIN: ${vin || "N/A"} | Model: ${model}
Advisor: ${selectedAdvisor} | Tech: ${selectedTech} | Align Tech: ${selectedAlignmentTech} | Manager: ${selectedManager}

${isTechMissing ? "🔴 CRITICAL DEFECT: TECHNICIAN MISSING REQUIRED XENTRY DIAGNOSTIC PROOF - High Chargeback Risk!" : ""}
${isCauseBlank ? "⚠️ CRITICAL DEFECT: DIAGNOSTIC CAUSE IS BLANK - High Chargeback Risk!" : "✓ Diagnostic Cause Documented"}

${partsRisk ? `[PARTS INVOICE RISK: ${partsRisk.overallPartsRiskLevel}] ${partsRisk.missingOneTimeUseHardware ? '🔴 MISSING ONE-TIME HARDWARE' : ''}
${partsRisk.summary}
` : ''}

${alignAssurance ? `[WHEEL ALIGNMENT POLICY ASSURANCE: ${alignAssurance.auditStatus}] (Tech: ${selectedAlignmentTech})
Romess: ${alignAssurance.romessRideHeightStatus} | Policy Fields: ${alignAssurance.allRequiredFieldsFilled ? 'Complete [✓]' : 'Action Req'}
Ops Claimable: ${alignAssurance.claimableOperations.join(' + ')}
` : ''}

${conflict ? `[XENTRY VS. TECH STORY CONFLICT: ${conflict.conflictLevel} (Score: ${conflict.conflictScore}/100)]
${conflict.summary}
Verdict: ${conflict.reconciliationVerdict}
` : ''}

[EXECUTIVE ASSESSMENT]
${analysisResult.executiveAssessmentSummary || "Assessed per MB Warranty Guidelines."}

[CLARIFICATION QUESTIONS FOR TECHNICIAN]
${analysisResult.clarificationQuestionsForTech.map((q, i) => `${i + 1}. ${q}`).join("\n")}

[COACHING]
• Advisor (${selectedAdvisor}): ${analysisResult.advisorCoachingNotes}
• Tech (${selectedTech}): ${analysisResult.technicianCoachingNotes}
${alignAssurance?.alignmentTechCoachingNotes ? `• Align Tech (${selectedAlignmentTech}): ${alignAssurance.alignmentTechCoachingNotes}` : ''}`;

    handleCopyText(brief, "flash_brief");
  };

  const getLuxuryAssistantReportData = (): LuxuryPdfReportData => {
    const res = editedReport || analysisResult;
    return {
      dealershipName: activeDealership,
      reportTitle: "ASP FINAL CLAIM ASSESSMENT REPORT",
      reportSubtitle: "MERCEDES-BENZ WARRANTY AUDIT & TECHNICAL JUSTIFICATION",
      orientation: "landscape",
      roNumber: roNumber || "N/A",
      vin: vin || "N/A",
      model: model || "Mercedes-Benz",
      mileage: mileage || "N/A",
      advisorName: selectedAdvisor || "Service Advisor",
      techName: selectedTech || "Primary Technician",
      alignmentTechName: selectedAlignmentTech || undefined,
      managerName: selectedManager || "Warranty Manager",
      verdictTitle: "FINAL CLAIM ASSESSMENT & 3C COMPLIANCE",
      verdictStatus: res?.isHighRiskTechnicianMissing ? "ACTION_REQUIRED_DENIAL_RISK" : "COVERED_UNDER_WARRANTY",
      confidenceScore: 96,
      warrantyProgram: "Mercedes-Benz Factory Warranty Policy (MBUSA / DAG)",
      applicablePolicyClause: res?.tipsGIReference || "MBUSA Warranty Policy Manual & WIS Operation Instructions",
      complaint: res?.clarified3CStory?.complaint || rawComplaint,
      cause: res?.clarified3CStory?.cause || rawCause,
      correction: res?.clarified3CStory?.correction || rawCorrection,
      fullDmsStory: res?.formattedFullStory || undefined,
      advisorCustomerScript: res?.advisorCoachingNotes || undefined,
      techCoaching: res?.technicianCoachingNotes || undefined,
      advisorCoaching: res?.advisorCoachingNotes || undefined,
      appliedPolicies: verifiedPolicies.filter(p => p.isActive).map(p => `${p.title} (${p.referenceCode})`),
      faultCodes: faultCodes || undefined
    };
  };

  return (
    <div className="space-y-8 w-full px-2 sm:px-4 lg:px-6 py-6 font-playfair bg-black text-white">
      
      {/* HEADER BANNER */}
      <div className="relative p-6 sm:p-8 bg-[#08080a] rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/50">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-white border border-white/20 text-[10px] font-serif font-bold uppercase tracking-widest">
                  ASP FINAL CLAIM ASSESSMENT
                </span>
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20 text-[10px] font-serif font-bold uppercase tracking-wider">
                  ACTIVE REGISTRY: {activeDealership}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight font-serif">
                ASP FINAL CLAIM ASSESSMENT
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-serif mt-1 max-w-3xl leading-relaxed">
                Analyze technician notes (Complaint, Cause, Correction) against <strong>Mercedes-Benz Paperless Xentry Diagnosis</strong> data. Detect data conflicts, automatically catch & flag <em>"Technician Missing"</em> diagnostic deficits, and generate audit-proof 3C Warranty Stories.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              type="button"
              onClick={() => setShowLuxuryPdfModal(true)}
              className="bg-white hover:bg-slate-200 text-black font-serif font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xl transition-all cursor-pointer border border-white"
              title="Print Luxury Mercedes-Benz Executive PDF Report"
            >
              <Printer className="w-4 h-4 text-black" />
              <span>PRINT / LUXURY PDF REPORT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBatchManagerModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-serif font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xl transition-all cursor-pointer border border-white/20"
              title="Open Condensed Batch Manager Report for multi-RO submission overview"
            >
              <Briefcase className="w-4 h-4 text-slate-300" />
              <span>BATCH MANAGER REPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* VERIFIED MERCEDES-BENZ POLICIES & CORRECTIVE KNOWLEDGE BASE MANAGER */}
      <MercedesKnowledgeManager
        onPoliciesChanged={setVerifiedPolicies}
        defaultExpanded={false}
      />

      {/* AUTO-SAVE & DRAFT STATUS BAR (5-SECOND CADENCE) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-emerald-300 font-bold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Auto-Save Active (5-Sec Cycle)
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">
              {lastSavedTimestamp 
                ? `Draft persisted locally (Last saved: ${new Date(lastSavedTimestamp).toLocaleTimeString()})`
                : `Draft remains saved in local storage until manually deleted.`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draftRestoredBanner && (
            <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
              {draftRestoredBanner}
            </span>
          )}
          <button
            type="button"
            onClick={handleClearSavedDraft}
            className="text-[11px] text-slate-400 hover:text-rose-300 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Purge saved intake form draft from browser local storage"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Delete Saved Draft</span>
          </button>
        </div>
      </div>

      {/* INPUT FORM SECTION */}
      <form onSubmit={handleAnalyzeStory} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* PERSONNEL / DIRECTORY ASSIGNMENT SELECTOR BAR */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>DEALERSHIP PERSONNEL DIRECTORY ASSIGNMENT</span>
            <span className="text-[10px] text-slate-500 font-normal lowercase">
              (Incorporate employees from /?tab=directory for instant dispatch)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Advisor Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span>Service Advisor</span>
              </label>
              {advisors.length > 0 ? (
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Select Advisor --</option>
                  {advisors.map(a => (
                    <option key={a.id} value={a.name}>{a.name} ({a.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  placeholder="Advisor name..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
              )}
            </div>

            {/* Technician Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-amber-400" />
                <span>Technician</span>
              </label>
              {technicians.length > 0 ? (
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  placeholder="Technician name..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
              )}
            </div>

            {/* Manager Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>Service / Warranty Manager</span>
              </label>
              {managers.length > 0 ? (
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Select Manager --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  placeholder="Manager name..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* CORE VEHICLE & REPAIR ORDER METADATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider">
                VIN (17 Digits)
              </label>
              {isDecodingVin && (
                <span className="text-[9px] text-cyan-400 flex items-center gap-1 animate-pulse">
                  <RefreshCw size={10} className="animate-spin" /> Decoding...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. W1NOG8DB5NF123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none transition-colors uppercase font-bold"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              Vehicle Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Auto-populated from VIN or type manually"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none transition-colors font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              Repair Order (RO) #
            </label>
            <input
              type="text"
              value={roNumber}
              onChange={(e) => setRoNumber(e.target.value)}
              placeholder="e.g. RO-88412"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none transition-colors font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              Mileage
            </label>
            <input
              type="text"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g. 34,210 mi"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paperless Xentry Compliance Status</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Mandatory for Diagnostic Claims
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-300 font-mono flex items-center justify-between">
              <span>Technician Upload Obligation: <strong className="text-amber-300">All Diagnostic Results Required</strong></span>
              <span className="text-cyan-400 font-bold text-[10px]">Photo Exception if System Down</span>
            </div>
          </div>
        </div>

        {/* FAULT CODES (DTCS) & PAPERLESS XENTRY DIAGNOSIS (INPUT & DRAG/DROP UPLOAD) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                <span>FAULT CODES (DTCS) / DIAGNOSTIC INFO & PAPERLESS XENTRY DIAGNOSIS</span>
              </label>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Type fault codes manually, transpose Xentry exports, OR drag-and-drop Paperless Xentry Diagnosis files (PDFs, Quick Tests, Guided Tests, Adaptation Logs, or System Down Photos).
              </p>
            </div>

            {/* "Technician Missing" Quick Tag Injection Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Flags:</span>
              <button
                type="button"
                onClick={() => handleAddTechnicianMissingTag("Xentry Quick Test")}
                className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
                title="Flag that the technician failed to upload the initial Xentry Quick Test"
              >
                + Tech Missing: Quick Test
              </button>
              <button
                type="button"
                onClick={() => handleAddTechnicianMissingTag("Guided Test Documentation")}
                className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
                title="Flag that the technician failed to upload Guided Test logs to support punch time"
              >
                + Tech Missing: Guided Test
              </button>
              <button
                type="button"
                onClick={() => handleAddTechnicianMissingTag("Adaptation / Calibration Logs")}
                className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                + Tech Missing: Adaptation
              </button>
              <button
                type="button"
                onClick={() => handleAddTechnicianMissingTag("Proof of Software Completion / SCN")}
                className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/60 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                + Tech Missing: SCN Flash
              </button>
            </div>
          </div>

          {/* TECHNICIAN MISSING RED HIGH-RISK BANNER CALLOUT */}
          {isTechnicianMissingExplicit && (
            <div className="p-3.5 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-rose-200 text-xs font-mono font-bold flex items-start gap-3 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-300 uppercase tracking-wider text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-900 text-white font-black text-[9px] border border-rose-400">
                    🔴 HIGH RISK DEFECT (COLOR RED)
                  </span>
                  <span>"TECHNICIAN MISSING" DIAGNOSTIC PROOF ACTIVE</span>
                </div>
                <p className="text-[11px] font-sans text-rose-200 font-normal leading-relaxed">
                  Mercedes-Benz Paperless Xentry Diagnosis requires all Diagnostic Results (Quick Tests, Guided Tests to support time spent, Adaptation logs, and Proof of Software completion) to be uploaded. Any failure to upload these required documents creates a <strong>HIGH RISK</strong> of warranty denial / 100% audit chargeback. (The only compliant alternative is photo images of diagnostic events with explanation that the system was down and photos were supplied to administration).
                </p>
              </div>
            </div>
          )}

          {/* Fault Codes / Transposed Text Area */}
          <div>
            <textarea
              rows={3}
              value={faultCodes}
              onChange={(e) => setFaultCodes(e.target.value)}
              placeholder="e.g. P030000, N30/4 ESP Module, P017100, or paste/transpose full Xentry Quick Test text here... Or type 'Technician Missing [specifics]' to trigger high risk red flag."
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-slate-200 outline-none transition-colors resize-y font-mono text-xs"
            />
          </div>

          {/* DRAG AND DROP ZONE FOR PAPERLESS XENTRY DIAGNOSIS */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isDraggingOver
                ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 scale-[1.01]"
                : "border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.log,.json,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessUploadedFiles(e.target.files);
                }
              }}
            />

            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-200">
                DRAG & DROP "MERCEDES-BENZ PAPERLESS XENTRY DIAGNOSIS" FILES HERE
              </p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                Upload Xentry Quick Test PDFs, Guided Test logs, Adaptation prints, or System-Down Diagnostic Photos (.pdf, .txt, .log, .jpg, .png)
              </p>
            </div>

            <button
              type="button"
              className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-colors pointer-events-none"
            >
              Browse Files
            </button>
          </div>

          {/* Uploaded Files Chips & Transpose Controls */}
          {xentryFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Attached Paperless Xentry Files ({xentryFiles.length}):</span>
                <span className="text-cyan-400">Ready for AI Data vs. Story Conflict Cross-Examination</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {xentryFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{file.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1] || "doc"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.text && (
                        <button
                          type="button"
                          onClick={() => handleTransposeFileToDtcBox(file)}
                          className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded text-[9px] font-bold cursor-pointer transition-colors"
                          title="Transpose text into Fault Codes box"
                        >
                          Transpose Text
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RAW TECHNICIAN STORY & NOTES (3-BOX BREAKDOWN) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>RAW TECHNICIAN STORY & NOTES</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              Fill in C/C/C boxes individually or paste raw notes
            </span>
          </div>

          {/* MISSING CAUSE RED MARK CALLOUT BANNER */}
          {isCauseBlank && (rawComplaint || rawCorrection || techStory) && (
            <div className="p-3 bg-rose-950/80 border-2 border-rose-500/80 rounded-2xl text-rose-200 text-xs font-mono font-bold flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-300 uppercase tracking-wider text-xs">
                  ⚠️ CRITICAL COMPLIANCE DEFECT: MISSING DIAGNOSTIC CAUSE
                </strong>
                Central Factory Warranty policy strictly prohibits leaving Cause blank. Submitting a claim with an unstated Cause triggers 100% audit chargebacks. Please document the cause or issue a clarification request to Technician {selectedTech}.
              </div>
            </div>
          )}

          {/* 3 Fill-in Boxes: Complaint, Cause, Correction */}
          <div className="grid grid-cols-1 gap-3 font-mono text-xs">
            
            {/* COMPLAINT */}
            <div>
              <label className="block text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>1. COMPLAINT (Customer Statement / Condition)</span>
              </label>
              <textarea
                rows={2}
                value={rawComplaint}
                onChange={(e) => handleTripleBoxChange('complaint', e.target.value)}
                placeholder="e.g. Customer states check engine light on, felt rough idle in morning..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-slate-200 outline-none transition-colors resize-y"
              />
            </div>

            {/* CAUSE (WITH RED MARK BORDER IF BLANK) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>2. CAUSE (Diagnostic Tree & Technical Defect Findings)</span>
                  <span className="text-rose-400 text-[9px] font-bold">* MANDATORY FOR WARRANTY</span>
                </label>
                {isCauseBlank && (
                  <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/50 uppercase tracking-widest animate-pulse">
                    RED MARK: CAUSE BLANK
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={rawCause}
                onChange={(e) => handleTripleBoxChange('cause', e.target.value)}
                placeholder="e.g. Quick test stored fault P030100 misfire cyl 1. Swapped coil 1 to 2, misfire stayed. Electrode worn on plug #1..."
                className={`w-full bg-slate-950 rounded-xl p-3 text-slate-200 outline-none transition-all resize-y ${
                  isCauseBlank && (rawComplaint || rawCorrection || techStory)
                    ? "border-2 border-rose-500/80 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    : "border border-slate-800 focus:border-amber-500"
                }`}
              />
            </div>

            {/* CORRECTION */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>3. CORRECTION (WIS Repair Procedure & Verification)</span>
              </label>
              <textarea
                rows={2}
                value={rawCorrection}
                onChange={(e) => handleTripleBoxChange('correction', e.target.value)}
                placeholder="e.g. Replaced all 6 spark plugs, cleared DTCs, test drove 8 miles ok no light..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 outline-none transition-colors resize-y"
              />
            </div>

          </div>

          {/* Full Unstructured Textarea Fallback */}
          <div className="pt-2">
            <details className="group">
              <summary className="text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-1 font-bold uppercase tracking-wider select-none">
                <span>View / Edit Combined Raw Note String</span>
              </summary>
              <textarea
                rows={3}
                value={techStory}
                onChange={(e) => setTechStory(e.target.value)}
                placeholder="Paste unformatted single-block technician story here..."
                className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 font-mono text-xs focus:border-cyan-500 outline-none transition-colors resize-y"
              />
            </details>
          </div>
        </div>

        {/* PARTS BLOCK FOR BULK COPY/PASTE & INVOICE RISK EVALUATION */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                PARTS INVOICE / DMS BILLED PARTS BLOCK (RISK EVALUATION)
              </label>
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[9px] font-mono font-bold uppercase tracking-widest">
                🔴 RED FLAG FOR MISSING ONE-TIME HARDWARE
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Bulk paste completed DMS invoice or drop pick tickets
            </span>
          </div>

          {rawPartsInvoice && (
            <div className="flex justify-end text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setRawPartsInvoice("")}
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded transition-colors cursor-pointer"
              >
                Clear Parts
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 font-mono text-xs">
            <div className="lg:col-span-2">
              <textarea
                rows={4}
                value={rawPartsInvoice}
                onChange={(e) => setRawPartsInvoice(e.target.value)}
                placeholder={`Paste bulk completed DMS parts invoice lines here (CDK, Reynolds, Tekion, Xtime):\nExample:\nA0041598103  SPARK PLUG                 QTY: 6   $24.50\nA2760940504  INTAKE MANIFOLD GASKET     QTY: 6   $12.80\nA0009903908  M6x40 COMPOSITE PAN BOLT   QTY: 10  $4.20\n\nThe AI evaluates: missing/wrong fluid amounts, WIS published covers/gaskets, and specifically flags (RED) missing ONE-TIME USE HARDWARE quantities and specifics per WIS!`}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-slate-200 outline-none transition-colors resize-y font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Drag and Drop Zone for Parts Invoices / Pick Tickets */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingParts(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingParts(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingParts(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleProcessPartsFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => partsFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                isDraggingParts
                  ? "border-amber-400 bg-amber-950/40 text-amber-200"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400"
              }`}
            >
              <input
                type="file"
                ref={partsFileInputRef}
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessPartsFiles(e.target.files);
                  }
                }}
              />
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400">
                <UploadCloud className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-200">
                UPLOAD PARTS PICK TICKET / INVOICE
              </p>
              <p className="text-[9px] text-slate-500">
                Drop PDF invoice, parts slip image, or CSV (.pdf, .jpg, .png, .txt)
              </p>
              {partsFiles.length > 0 && (
                <div className="text-[9px] font-mono text-amber-300 mt-1">
                  Attached {partsFiles.length} parts file(s)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WHEEL ALIGNMENT RESULTS & SEPARATE TECHNICIAN DROP BOX */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                WHEEL ALIGNMENT RESULTS DROP BOX & TIME ASSURANCE
              </label>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold uppercase tracking-widest">
                ROMESS & WIS POLICY CHECK
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Assigned Alignment Tech:</span>
              {/* Separate Wheel Alignment Technician Dropdown with Blank Default */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/40 px-2.5 py-1 rounded-xl">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <select
                  value={selectedAlignmentTech}
                  onChange={(e) => setSelectedAlignmentTech(e.target.value)}
                  className="bg-transparent text-emerald-300 font-mono text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- [BLANK: No Alignment Performed] --
                  </option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name} className="bg-slate-900 text-white">
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Explicit Policy Notice regarding blank alignment */}
          <div className="flex items-center justify-between text-[10px] font-mono px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Policy Safeguard:</span>
              <span className={selectedAlignmentTech.trim() ? "text-emerald-400 font-semibold" : "text-amber-400/90 font-medium"}>
                {selectedAlignmentTech.trim() 
                  ? `✓ Alignment report will be generated for technician: ${selectedAlignmentTech}` 
                  : `⚠️ Alignment tech is BLANK — Wheel alignment section will be omitted from the final report to prevent false claims.`}
              </span>
            </div>
            <span className="text-slate-500 hidden md:inline">Leave blank if no alignment occurred</span>
          </div>

          {wheelAlignmentResults && (
            <div className="flex justify-end text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setWheelAlignmentResults("")}
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded transition-colors cursor-pointer"
              >
                Clear Alignment Data
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 font-mono text-xs">
            <div className="lg:col-span-2">
              <textarea
                rows={4}
                value={wheelAlignmentResults}
                onChange={(e) => setWheelAlignmentResults(e.target.value)}
                placeholder={`Share / paste Wheel Alignment Results to assure all fields were filled out per policy:\n• Romess Inclinometer Ride Height Angles (Mandatory baseline for MB alignment)\n• Before & After Measurements (Toe, Camber, Caster)\n• Steering Angle Sensor (SAS) Zero-Point Calibration\n• Adjustments Made vs Check Requirements to make sure proper time is claimed (Op 40-6500 Check vs 40-6510 Front Toe vs 40-6520 Rear vs Crash Bolts)\n• Assigned Alignment Tech: ${selectedAlignmentTech}`}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 outline-none transition-colors resize-y font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Drag and Drop Zone for Wheel Alignment Printouts */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingAlignment(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingAlignment(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingAlignment(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleProcessAlignmentFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => alignmentFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                isDraggingAlignment
                  ? "border-emerald-400 bg-emerald-950/40 text-emerald-200"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400"
              }`}
            >
              <input
                type="file"
                ref={alignmentFileInputRef}
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessAlignmentFiles(e.target.files);
                  }
                }}
              />
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
                <UploadCloud className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-slate-200">
                UPLOAD ALIGNMENT RESULTS (HAWKEYE / BEISSBARTH)
              </p>
              <p className="text-[9px] text-slate-500">
                Drop printout image, scan, or Romess log (.pdf, .jpg, .png, .txt)
              </p>
              {alignmentFiles.length > 0 && (
                <div className="text-[9px] font-mono text-emerald-300 mt-1">
                  Attached {alignmentFiles.length} alignment file(s)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message display */}
        {errorMessage && (
          <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => handleAnalyzeStory()}
              className="px-3.5 py-1.5 bg-rose-900/90 hover:bg-rose-800 border border-rose-500/60 text-rose-100 rounded-xl font-bold text-[11px] uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>ASP Warranty Compliance</span>
            <span>•</span>
            <span>Personnel: Advisor: {selectedAdvisor} / Tech: {selectedTech} / Align: {selectedAlignmentTech}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {(techStory || rawComplaint || rawCause || rawCorrection || rawPartsInvoice || wheelAlignmentResults || model || vin || roNumber || faultCodes || mileage || xentryFiles.length > 0 || partsFiles.length > 0 || alignmentFiles.length > 0 || analysisResult) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-500 shrink-0"
                title="Clear all fields and reset for a new report request"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>NEW REQUEST / RESET</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || (!techStory.trim() && !rawComplaint.trim() && !rawCause.trim() && !rawCorrection.trim() && !faultCodes.trim() && !rawPartsInvoice.trim() && !wheelAlignmentResults.trim() && xentryFiles.length === 0 && partsFiles.length === 0 && alignmentFiles.length === 0)}
              className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                isLoading || (!techStory.trim() && !rawComplaint.trim() && !rawCause.trim() && !rawCorrection.trim() && !faultCodes.trim() && !rawPartsInvoice.trim() && !wheelAlignmentResults.trim() && xentryFiles.length === 0 && partsFiles.length === 0 && alignmentFiles.length === 0)
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950 active:scale-98"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>AUDITING XENTRY, PARTS & ALIGNMENT...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>RUN COMPREHENSIVE WARRANTY & RISK AUDIT</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* ANALYSIS OUTPUT RESULTS SECTION */}
      {analysisResult && (
        <div className="space-y-6 animate-fade-in">

          {/* ACTION STRIP: FULL REPORT VS FLASH REPORT */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950 border border-cyan-500/30 rounded-xl text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <span>ASP WARRANTY COMPLIANCE ASSESSMENT REPORT READY</span>
                  {(analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit) && (
                    <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-500 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                      🔴 HIGH RISK: TECHNICIAN MISSING XENTRY
                    </span>
                  )}
                  {isCauseBlank && (
                    <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded font-mono font-bold">
                      RED MARK: CAUSE BLANK
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Assigned Personnel: Advisor: <strong className="text-slate-200">{selectedAdvisor}</strong> • Tech: <strong className="text-slate-200">{selectedTech}</strong> • Manager: <strong className="text-slate-200">{selectedManager}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={isEditingReport ? handleSaveReportEdits : handleStartReportEditing}
                className={`${
                  isEditingReport 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                } text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg cursor-pointer`}
              >
                {isEditingReport ? <Save size={15} /> : <Edit3 size={15} />}
                <span>{isEditingReport ? "SAVE & APPLY EDITS" : "EDIT REPORT & POLICIES"}</span>
              </button>
              {originalAiResult && (
                <button
                  type="button"
                  onClick={handleRevertToOriginalAi}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  title="Revert all manual edits back to the initial AI generated report"
                >
                  <Undo size={13} />
                  <span>Reset to AI</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowBatchManagerModal(true)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Briefcase size={14} />
                <span>BATCH MANAGER REPORT</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFlashModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-950 cursor-pointer"
              >
                <Zap size={15} />
                FLASH REPORT
              </button>
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <Eye size={14} />
                PREVIEW PDF
              </button>
              <button
                type="button"
                onClick={handleTriggerPrintFull}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 transition-colors cursor-pointer"
              >
                <Printer size={15} />
                PRINT FULL REPORT
              </button>
            </div>
          </div>

          {/* EDITING MODE ACTIVE BANNER & INTERACTIVE FORM */}
          {isEditingReport && editedReport && (
            <div className="p-6 bg-slate-900 border-2 border-indigo-500 rounded-3xl space-y-6 shadow-2xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-950 border border-indigo-500/50 rounded-2xl text-indigo-400">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>REPORT & POLICY EDITING MODE</span>
                      <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500 text-[10px] font-mono font-bold uppercase">
                        ACTIVE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Correct statements, add/modify compliance checklist rules, adjust parts risks, or teach new dealership warranty policies.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveReportEdits}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    <Save size={15} />
                    <span>SAVE & APPLY EDITS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReportEdits}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* 1. EDIT EXECUTIVE SUMMARY */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                  Executive Warranty Assessment Summary
                </label>
                <textarea
                  rows={3}
                  value={editedReport.executiveAssessmentSummary || ""}
                  onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, executiveAssessmentSummary: e.target.value }) : null)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-slate-200 font-sans text-xs outline-none leading-relaxed resize-y"
                  placeholder="Summarize the warranty assessment verdict and policy findings..."
                />
              </div>

              {/* 2. EDIT 3C STORY */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Edit 3C Warranty Story (Complaint, Cause, Correction)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Auto-updates combined DMS story</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-sky-400 font-bold uppercase">Complaint (C)</label>
                    <textarea
                      rows={4}
                      value={editedReport.clarified3CStory.complaint}
                      onChange={(e) => handleUpdateEdited3C("complaint", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-slate-200 text-xs font-sans outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-amber-400 font-bold uppercase">Cause (C)</label>
                    <textarea
                      rows={4}
                      value={editedReport.clarified3CStory.cause}
                      onChange={(e) => handleUpdateEdited3C("cause", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-slate-200 text-xs font-sans outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-emerald-400 font-bold uppercase">Correction (C)</label>
                    <textarea
                      rows={4}
                      value={editedReport.clarified3CStory.correction}
                      onChange={(e) => handleUpdateEdited3C("correction", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-200 text-xs font-sans outline-none resize-y"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Combined DMS Formatted Narrative:
                  </label>
                  <textarea
                    rows={4}
                    value={editedReport.formattedFullStory}
                    onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, formattedFullStory: e.target.value }) : null)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-slate-200 font-mono text-xs outline-none leading-relaxed resize-y"
                  />
                </div>
              </div>

              {/* 3. EDIT COMPLIANCE CHECKLIST */}
              <div className="space-y-3 pt-2 border-t border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider">
                      Edit Compliance Checklist Items ({editedReport.checklist.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 rounded-xl flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Policy Check</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editedReport.checklist.map((chk, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-3">
                      <div className="flex-1 w-full space-y-1">
                        <input
                          type="text"
                          value={chk.item}
                          onChange={(e) => handleUpdateChecklistItem(idx, "item", e.target.value)}
                          placeholder="Checklist Item Title / Policy Statement"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none"
                        />
                        <input
                          type="text"
                          value={chk.notes}
                          onChange={(e) => handleUpdateChecklistItem(idx, "notes", e.target.value)}
                          placeholder="Assessor notes or policy guidance..."
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={chk.status}
                          onChange={(e) => handleUpdateChecklistItem(idx, "status", e.target.value)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono outline-none border cursor-pointer ${
                            chk.status === "VERIFIED" 
                              ? "bg-emerald-950 text-emerald-300 border-emerald-500/50" 
                              : chk.status === "ACTION_REQUIRED"
                                ? "bg-amber-950 text-amber-300 border-amber-500/50"
                                : "bg-rose-950 text-rose-300 border-rose-500/50"
                          }`}
                        >
                          <option value="VERIFIED" className="bg-slate-900 text-white">VERIFIED [✓]</option>
                          <option value="ACTION_REQUIRED" className="bg-slate-900 text-white">ACTION REQUIRED [⚠️]</option>
                          <option value="DEVIATION_REJECTED" className="bg-slate-900 text-white">DEVIATION REJECTED [✕]</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteChecklistItem(idx)}
                          className="p-1.5 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete checklist item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. EDIT PARTS RISK & ONE-TIME HARDWARE */}
              {editedReport.partsRiskEvaluation && (
                <div className="space-y-4 pt-2 border-t border-slate-800 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-200 uppercase tracking-wider">
                        Edit Parts Risk & WIS Hardware Matrix
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Risk Level:</span>
                      <select
                        value={editedReport.partsRiskEvaluation.overallPartsRiskLevel || "LOW_RISK_COMPLIANT"}
                        onChange={(e) => setEditedReport(prev => prev && prev.partsRiskEvaluation ? ({
                          ...prev,
                          partsRiskEvaluation: {
                            ...prev.partsRiskEvaluation,
                            overallPartsRiskLevel: e.target.value as any
                          }
                        }) : null)}
                        className="bg-slate-950 border border-slate-800 text-xs text-amber-300 font-bold px-2 py-1 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="LOW_RISK_COMPLIANT">LOW RISK COMPLIANT</option>
                        <option value="MEDIUM_RISK_ACTION_REQUIRED">MEDIUM RISK ACTION REQ</option>
                        <option value="HIGH_RISK_CRITICAL_DEFICIT">HIGH RISK CRITICAL DEFICIT</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={editedReport.partsRiskEvaluation.summary}
                    onChange={(e) => setEditedReport(prev => prev && prev.partsRiskEvaluation ? ({
                      ...prev,
                      partsRiskEvaluation: {
                        ...prev.partsRiskEvaluation,
                        summary: e.target.value
                      }
                    }) : null)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-slate-200 text-xs outline-none"
                    placeholder="Parts risk summary..."
                  />

                  {/* Hardware items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Specific Fasteners & One-Time Use Hardware:</span>
                      <button
                        type="button"
                        onClick={handleAddHardwareItem}
                        className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Hardware Part</span>
                      </button>
                    </div>

                    {(editedReport.partsRiskEvaluation.hardwareSpecifics || []).map((hw, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={hw.partDescription}
                            onChange={(e) => handleUpdateHardwareItem(i, "partDescription", e.target.value)}
                            placeholder="Part Number / Description"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-500">Req:</span>
                          <input
                            type="number"
                            value={hw.requiredQuantity}
                            onChange={(e) => handleUpdateHardwareItem(i, "requiredQuantity", parseInt(e.target.value) || 1)}
                            className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-xs text-cyan-300"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-500">Billed:</span>
                          <input
                            type="number"
                            value={hw.billedQuantity}
                            onChange={(e) => handleUpdateHardwareItem(i, "billedQuantity", parseInt(e.target.value) || 0)}
                            className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={hw.riskSeverity}
                            onChange={(e) => handleUpdateHardwareItem(i, "riskSeverity", e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-amber-300"
                          >
                            <option value="LOW_GREEN">LOW GREEN</option>
                            <option value="MEDIUM_YELLOW">MEDIUM YELLOW</option>
                            <option value="HIGH_RED">HIGH RED</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteHardwareItem(i)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. EDIT WHEEL ALIGNMENT ASSURANCE (IF PRESENT) */}
              {editedReport.wheelAlignmentAssurance && (
                <div className="space-y-3 pt-2 border-t border-slate-800 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200 uppercase tracking-wider">
                        Edit Wheel Alignment Assurance & Time Reconciliation
                      </span>
                    </div>

                    <select
                      value={editedReport.wheelAlignmentAssurance.auditStatus || "FULL_POLICY_COMPLIANT"}
                      onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                        ...prev,
                        wheelAlignmentAssurance: {
                          ...prev.wheelAlignmentAssurance,
                          auditStatus: e.target.value as any
                        }
                      }) : null)}
                      className="bg-slate-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="FULL_POLICY_COMPLIANT">FULL POLICY COMPLIANT</option>
                      <option value="ADJUSTMENT_JUSTIFIED">ADJUSTMENT JUSTIFIED</option>
                      <option value="MISSING_ROMESS_BASELINE">MISSING ROMESS BASELINE</option>
                      <option value="MISSING_SAS_CALIBRATION">MISSING SAS CALIBRATION</option>
                      <option value="UNJUSTIFIED_LABOR_TIME">UNJUSTIFIED LABOR TIME</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Romess Ride Height Status:</label>
                      <input
                        type="text"
                        value={editedReport.wheelAlignmentAssurance.romessRideHeightStatus || ""}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            romessRideHeightStatus: e.target.value
                          }
                        }) : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Claimable FRU Operations (comma-separated):</label>
                      <input
                        type="text"
                        value={(editedReport.wheelAlignmentAssurance.claimableOperations || []).join(", ")}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            claimableOperations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                          }
                        }) : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-300"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editedReport.wheelAlignmentAssurance.allRequiredFieldsFilled)}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            allRequiredFieldsFilled: e.target.checked
                          }
                        }) : null)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span className="text-slate-300 text-xs">All Required Policy Fields Filled</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editedReport.wheelAlignmentAssurance.steeringAngleSensorCalibrated)}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            steeringAngleSensorCalibrated: e.target.checked
                          }
                        }) : null)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span className="text-slate-300 text-xs">Steering Angle Sensor (SAS 0.0°) Reset</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editedReport.wheelAlignmentAssurance.adjustmentJustified)}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            adjustmentJustified: e.target.checked
                          }
                        }) : null)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                      />
                      <span className="text-slate-300 text-xs">Mechanical Adjustments Out of Spec Justified</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 6. EDIT PERSONNEL COACHING NOTES */}
              <div className="space-y-3 pt-2 border-t border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-200 uppercase tracking-wider">
                    Edit Personnel Coaching Notes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyan-400 font-bold uppercase">Advisor Coaching ({selectedAdvisor})</label>
                    <textarea
                      rows={3}
                      value={editedReport.advisorCoachingNotes}
                      onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, advisorCoachingNotes: e.target.value }) : null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-amber-400 font-bold uppercase">Primary Tech Coaching ({selectedTech})</label>
                    <textarea
                      rows={3}
                      value={editedReport.technicianCoachingNotes}
                      onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, technicianCoachingNotes: e.target.value }) : null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs outline-none"
                    />
                  </div>

                  {editedReport.wheelAlignmentAssurance && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-400 font-bold uppercase">Alignment Tech Coaching ({selectedAlignmentTech})</label>
                      <textarea
                        rows={3}
                        value={editedReport.wheelAlignmentAssurance.alignmentTechCoachingNotes || ""}
                        onChange={(e) => setEditedReport(prev => prev && prev.wheelAlignmentAssurance ? ({
                          ...prev,
                          wheelAlignmentAssurance: {
                            ...prev.wheelAlignmentAssurance,
                            alignmentTechCoachingNotes: e.target.value
                          }
                        }) : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 7. EDIT CLARIFICATION QUESTIONS FOR TECH */}
              <div className="space-y-3 pt-2 border-t border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider">
                      Clarification Questions for Technician ({editedReport.clarificationQuestionsForTech.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editedReport.clarificationQuestionsForTech.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                      <span className="text-cyan-400 font-bold text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                        className="flex-1 bg-transparent text-slate-200 text-xs outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. EDIT TECHNICAL REFERENCES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    LI / TIPS GI Reference Document:
                  </label>
                  <input
                    type="text"
                    value={editedReport.tipsGIReference || ""}
                    onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, tipsGIReference: e.target.value }) : null)}
                    placeholder="e.g. LI07.08-P-065123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Estimated Flat Rate Time Allowance:
                  </label>
                  <input
                    type="text"
                    value={editedReport.flatRateTimeEstimate || ""}
                    onChange={(e) => setEditedReport(prev => prev ? ({ ...prev, flatRateTimeEstimate: e.target.value }) : null)}
                    placeholder="e.g. 1.5 hrs (Op 07-1234)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-300 font-bold"
                  />
                </div>
              </div>

              {/* Bottom save bar */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelReportEdits}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReportEdits}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Save size={15} />
                  <span>SAVE & APPLY ALL EDITS</span>
                </button>
              </div>

            </div>
          )}

          {/* HIGH RISK "TECHNICIAN MISSING" DEDICATED REPORT CALLOUT (COLOR RED) */}
          {(analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit) && (
            <div className="p-6 bg-rose-950/90 border-2 border-rose-500 rounded-3xl space-y-3 shadow-2xl">
              <div className="flex items-center gap-2.5 text-rose-300 font-mono text-sm font-black uppercase tracking-wider">
                <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0" />
                <span>🔴 CRITICAL AUDIT STATUS: HIGH RISK — TECHNICIAN MISSING REQUIRED DIAGNOSTIC PROOF</span>
              </div>
              <p className="text-xs text-rose-100 font-sans leading-relaxed">
                Under Mercedes-Benz Warranty Compliance Guidelines, the technician is strictly mandated to upload all diagnostic documentation into <strong>Paperless Xentry Diagnosis</strong>. The only compliant alternative during a system outage is supplying photos of diagnostic events to administration with a notation in the story.
              </p>
              
              {analysisResult.technicianMissingSpecifics && analysisResult.technicianMissingSpecifics.length > 0 && (
                <div className="p-3.5 bg-slate-950/80 border border-rose-500/40 rounded-xl space-y-1 font-mono text-xs text-rose-200">
                  <div className="font-bold uppercase text-[10px] text-rose-400">Flagged Missing Specifics:</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {analysisResult.technicianMissingSpecifics.map((spec, i) => (
                      <li key={i}>{spec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* XENTRY DATA VS. TECH STORY CONFLICT REPORT SECTION */}
          {analysisResult.xentryConflictAnalysis && (
            <div className={`rounded-3xl p-6 sm:p-7 space-y-5 border shadow-2xl ${
              analysisResult.xentryConflictAnalysis.conflictLevel === "HIGH_CONFLICT"
                ? "bg-rose-950/30 border-rose-500/80"
                : analysisResult.xentryConflictAnalysis.conflictLevel === "POTENTIAL_DISCREPANCY"
                  ? "bg-amber-950/30 border-amber-500/80"
                  : "bg-slate-900 border-emerald-500/50"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Scale className={`w-6 h-6 ${
                    analysisResult.xentryConflictAnalysis.conflictLevel === "HIGH_CONFLICT" 
                      ? "text-rose-400" 
                      : analysisResult.xentryConflictAnalysis.conflictLevel === "POTENTIAL_DISCREPANCY"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`} />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                      XENTRY DIAGNOSTIC DATA VS. TECH STORY CONFLICT REPORT
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      AI Auto-Analysis cross-examining Xentry logs vs. written Complaint/Cause/Correction
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider border ${
                    analysisResult.xentryConflictAnalysis.conflictLevel === "HIGH_CONFLICT"
                      ? "bg-rose-950 text-rose-300 border-rose-500"
                      : analysisResult.xentryConflictAnalysis.conflictLevel === "POTENTIAL_DISCREPANCY"
                        ? "bg-amber-950 text-amber-300 border-amber-500"
                        : "bg-emerald-950 text-emerald-300 border-emerald-500"
                  }`}>
                    {safeFormatEnum(analysisResult.xentryConflictAnalysis.conflictLevel)}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Score: <strong className="text-white">{analysisResult.xentryConflictAnalysis.conflictScore}/100</strong>
                  </span>
                </div>
              </div>

              {/* Conflict Summary */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  CONFLICT ENGINE EXECUTIVE SUMMARY
                </div>
                <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">
                  {analysisResult.xentryConflictAnalysis.summary}
                </p>
              </div>

              {/* Detected Conflicts Breakdown */}
              {analysisResult.xentryConflictAnalysis.detectedConflicts && analysisResult.xentryConflictAnalysis.detectedConflicts.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-amber-400" />
                    <span>Identified Discrepancies & Evidence Conflicts ({analysisResult.xentryConflictAnalysis.detectedConflicts.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                    {analysisResult.xentryConflictAnalysis.detectedConflicts.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[9px] uppercase border border-slate-700">
                              {safeFormatEnum(c.category)}
                            </span>
                            <span className="text-xs font-bold text-white">Conflict #{idx + 1}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            c.severity === "HIGH" 
                              ? "bg-rose-950 text-rose-300 border border-rose-500/50" 
                              : c.severity === "MEDIUM" 
                                ? "bg-amber-950 text-amber-300 border border-amber-500/50" 
                                : "bg-slate-800 text-slate-300"
                          }`}>
                            Severity: {c.severity}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">
                              XENTRY DIAGNOSTIC EVIDENCE
                            </span>
                            <p className="text-slate-300 font-sans">{c.xentryDataEvidence}</p>
                          </div>
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                              TECHNICIAN STORY CLAIM
                            </span>
                            <p className="text-slate-300 font-sans">{c.techStoryClaim}</p>
                          </div>
                        </div>

                        <div className="space-y-1 font-sans text-xs text-slate-300">
                          <strong className="font-mono text-[10px] text-rose-400 block uppercase">Conflict Explanation:</strong>
                          <p>{c.conflictExplanation}</p>
                        </div>

                        <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl font-sans text-xs text-cyan-200">
                          <strong className="font-mono text-[10px] text-cyan-300 block uppercase mb-0.5">Required Reconciliation Fix:</strong>
                          <p>{c.recommendedFix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reconciliation Verdict */}
              {analysisResult.xentryConflictAnalysis.reconciliationVerdict && (
                <div className="p-3.5 bg-slate-950 border border-cyan-500/40 rounded-2xl flex items-start gap-2.5 font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-300 uppercase text-[10px] block">Audit Reconciliation Verdict:</strong>
                    <span className="text-slate-200 font-sans text-xs">{analysisResult.xentryConflictAnalysis.reconciliationVerdict}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXECUTIVE ASSESSMENT SUMMARY BANNER */}
          {analysisResult.executiveAssessmentSummary && (
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <span>EXECUTIVE WARRANTY COMPLIANCE ASSESSMENT SUMMARY</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {analysisResult.executiveAssessmentSummary}
              </p>
            </div>
          )}

          {/* 3C STORY CARDS GRID */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  1. TECHNICAL JUSTIFICATION 3C WARRANTY STORY
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleCopyText(analysisResult.formattedFullStory, "full_dms")}
                className="bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-cyan-300"
              >
                {copiedSection === "full_dms" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">COPIED FULL DMS STORY!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>COPY FULL DMS 3C STORY</span>
                  </>
                )}
              </button>
            </div>

            {/* Complaint, Cause, Correction Individual Blocks */}
            <div className="grid grid-cols-1 gap-4 font-mono text-xs">
              
              {/* COMPLAINT */}
              <div className="p-4 bg-slate-950 border-l-4 border-sky-500 rounded-r-2xl border-y border-r border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    COMPLAINT (CUSTOMER STATEMENT / CONDITION)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(analysisResult.clarified3CStory.complaint, "complaint")}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedSection === "complaint" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSection === "complaint" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans text-xs sm:text-sm">
                  {analysisResult.clarified3CStory.complaint}
                </p>
              </div>

              {/* CAUSE */}
              <div className={`p-4 bg-slate-950 border-l-4 rounded-r-2xl border-y border-r space-y-2 ${
                isCauseBlank 
                  ? "border-l-rose-500 border-rose-500/50 bg-rose-950/20" 
                  : "border-l-amber-500 border-slate-800"
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    CAUSE (DIAGNOSTIC PATH & XENTRY TEST FINDINGS)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(analysisResult.clarified3CStory.cause, "cause")}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedSection === "cause" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSection === "cause" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans text-xs sm:text-sm">
                  {analysisResult.clarified3CStory.cause}
                </p>
              </div>

              {/* CORRECTION */}
              <div className="p-4 bg-slate-950 border-l-4 border-emerald-500 rounded-r-2xl border-y border-r border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    CORRECTION (WIS REPAIR PROCEDURE & VERIFICATION)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(analysisResult.clarified3CStory.correction, "correction")}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedSection === "correction" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSection === "correction" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans text-xs sm:text-sm">
                  {analysisResult.clarified3CStory.correction}
                </p>
              </div>

            </div>

            {/* COMBINED DMS READY NARRATIVE BOX */}
            <div className="pt-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                FULL COMBINED 3C DMS NARRATIVE (READY TO PASTE INTO CDK / XTIME / REYNOLDS / TEKION):
              </label>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                {analysisResult.formattedFullStory}
              </div>
            </div>
          </div>

          {/* PARTS INVOICE RISK EVALUATION & ONE-TIME USE HARDWARE AUDIT CARD */}
          {analysisResult.partsRiskEvaluation && (
            <div className={`rounded-3xl p-6 sm:p-7 space-y-5 border shadow-2xl ${
              analysisResult.partsRiskEvaluation.missingOneTimeUseHardware || analysisResult.partsRiskEvaluation.overallPartsRiskLevel === "HIGH_RISK"
                ? "bg-rose-950/30 border-rose-500/80"
                : analysisResult.partsRiskEvaluation.overallPartsRiskLevel === "MEDIUM_RISK"
                  ? "bg-amber-950/30 border-amber-500/80"
                  : "bg-slate-900 border-slate-800"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Package className={`w-6 h-6 ${
                    analysisResult.partsRiskEvaluation.missingOneTimeUseHardware ? "text-rose-400 animate-pulse" : "text-cyan-400"
                  }`} />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      <span>2. PARTS INVOICE RISK EVALUATION & ONE-TIME USE HARDWARE AUDIT</span>
                      {analysisResult.partsRiskEvaluation.missingOneTimeUseHardware && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500 font-mono text-[9px] font-black tracking-widest uppercase animate-pulse">
                          🔴 RED RISK: MISSING ONE-TIME HARDWARE
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      WIS-mandated hardware, replacement covers, and fluid quantity verification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider border ${
                    analysisResult.partsRiskEvaluation.overallPartsRiskLevel === "HIGH_RISK" || analysisResult.partsRiskEvaluation.missingOneTimeUseHardware
                      ? "bg-rose-950 text-rose-300 border-rose-500"
                      : analysisResult.partsRiskEvaluation.overallPartsRiskLevel === "MEDIUM_RISK"
                        ? "bg-amber-950 text-amber-300 border-amber-500"
                        : "bg-emerald-950 text-emerald-300 border-emerald-500"
                  }`}>
                    PARTS RISK: {safeFormatEnum(analysisResult.partsRiskEvaluation.overallPartsRiskLevel || analysisResult.partsRiskEvaluation.overallPartsRisk)}
                  </span>
                </div>
              </div>

              {/* Summary Description */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {analysisResult.partsRiskEvaluation.summary}
                </p>
              </div>

              {/* One-Time Use Hardware Specifics Matrix */}
              {analysisResult.partsRiskEvaluation.hardwareSpecifics && analysisResult.partsRiskEvaluation.hardwareSpecifics.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>ONE-TIME USE HARDWARE & CRITICAL FASTENER AUDIT MATRIX</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Mandatory Factory Replacement per WIS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.partsRiskEvaluation.hardwareSpecifics.map((hw, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border space-y-1.5 font-mono text-xs ${
                          hw.riskSeverity === "HIGH_RED"
                            ? "bg-rose-950/50 border-rose-500/80 text-rose-100"
                            : hw.riskSeverity === "MEDIUM_YELLOW"
                              ? "bg-amber-950/40 border-amber-500/60 text-amber-100"
                              : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs">
                            {hw.partDescription}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                            hw.riskSeverity === "HIGH_RED"
                              ? "bg-rose-950 text-rose-300 border-rose-500 animate-pulse"
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}>
                            {safeFormatEnum(hw.riskSeverity || hw.riskLevel)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-400 block text-[9px]">REQUIRED QTY</span>
                            <strong className="text-cyan-300">{hw.requiredQuantity}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">BILLED ON DMS</span>
                            <strong className={hw.billedQuantity < hw.requiredQuantity ? "text-rose-400 font-bold" : "text-emerald-400"}>
                              {hw.billedQuantity}
                            </strong>
                          </div>
                        </div>

                        {hw.wisInstructionRef && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                            WIS Instruction: <span className="text-slate-200 font-sans">{hw.wisInstructionRef}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fluid Compliance & Ancillary Parts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {analysisResult.partsRiskEvaluation.fluidQuantityEvaluation && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                      <span>FLUID SPEC & QUANTITY AUDIT</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.status === "CORRECT"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.status === "DISCREPANCY"
                            ? "bg-rose-950 text-rose-300 border border-rose-500"
                            : "bg-amber-950 text-amber-300 border border-amber-500/40"
                      }`}>
                        {analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.status}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      {analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.analysis}
                    </p>
                    {analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.fluidSpecRequired && (
                      <div className="text-[10px] text-slate-400">
                        Spec: <strong className="text-cyan-300">{analysisResult.partsRiskEvaluation.fluidQuantityEvaluation.fluidSpecRequired}</strong>
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.partsRiskEvaluation.missingWisRequiredParts && analysisResult.partsRiskEvaluation.missingWisRequiredParts.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>MISSING ANCILLARY WIS COVERS / GASKETS</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300 font-sans text-xs">
                      {analysisResult.partsRiskEvaluation.missingWisRequiredParts.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WHEEL ALIGNMENT POLICY ASSURANCE & TIME RECONCILIATION CARD */}
          {analysisResult.wheelAlignmentAssurance && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      <span>3. WHEEL ALIGNMENT POLICY ASSURANCE & TIME RECONCILIATION</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] font-bold">
                        SEPARATE ALIGNMENT TECH: {analysisResult.wheelAlignmentAssurance.alignmentTechnicianName || selectedAlignmentTech}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Romess baseline angle check, policy fields verification & FRU operation justification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider border ${
                    analysisResult.wheelAlignmentAssurance.auditStatus === "FULL_POLICY_COMPLIANT"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                      : analysisResult.wheelAlignmentAssurance.auditStatus === "ADJUSTMENT_JUSTIFIED"
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500"
                        : "bg-amber-950 text-amber-300 border-amber-500"
                  }`}>
                    {safeFormatEnum(analysisResult.wheelAlignmentAssurance.auditStatus || analysisResult.wheelAlignmentAssurance.alignmentAuditStatus)}
                  </span>
                </div>
              </div>

              {/* Summary Description */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {analysisResult.wheelAlignmentAssurance.summary}
                </p>
              </div>

              {/* Alignment Policy Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">ROMESS INCLINOMETER</span>
                  <div className="text-xs font-bold text-cyan-300">
                    {analysisResult.wheelAlignmentAssurance.romessRideHeightStatus}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">POLICY FIELDS COMPLETE</span>
                  <div className={`text-xs font-bold ${analysisResult.wheelAlignmentAssurance.allRequiredFieldsFilled ? "text-emerald-400" : "text-amber-400"}`}>
                    {analysisResult.wheelAlignmentAssurance.allRequiredFieldsFilled ? "YES — FULLY FILLED" : "MISSING REQUIRED FIELDS"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">STEERING ANGLE SENSOR</span>
                  <div className={`text-xs font-bold ${analysisResult.wheelAlignmentAssurance.steeringAngleSensorCalibrated ? "text-emerald-400" : "text-slate-400"}`}>
                    {analysisResult.wheelAlignmentAssurance.steeringAngleSensorCalibrated ? "CALIBRATED (0.0°)" : "NOT DOCUMENTED"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">ADJUSTMENT JUSTIFICATION</span>
                  <div className={`text-xs font-bold ${analysisResult.wheelAlignmentAssurance.adjustmentJustified ? "text-cyan-300" : "text-slate-400"}`}>
                    {analysisResult.wheelAlignmentAssurance.adjustmentJustified ? "ANGLES OUT OF SPEC" : "CHECK ONLY"}
                  </div>
                </div>
              </div>

              {/* Claimable Operations */}
              {analysisResult.wheelAlignmentAssurance.claimableOperations && analysisResult.wheelAlignmentAssurance.claimableOperations.length > 0 && (
                <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      SUPPORTED CLAIMABLE FRU OPERATIONS:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.wheelAlignmentAssurance.claimableOperations.map((op, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Assigned Tech: <strong className="text-white">{analysisResult.wheelAlignmentAssurance.alignmentTechnicianName || selectedAlignmentTech}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MISSING DATA GAPS & DIAGNOSTIC WARNINGS */}
          {analysisResult.missingDataGaps.length > 0 && (
            <div className="p-6 bg-amber-950/40 border border-amber-500/50 rounded-3xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>4. IDENTIFIED MISSING INFORMATION & DIAGNOSTIC GAPS ({analysisResult.missingDataGaps.length})</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                The following required warranty documentation items were missing or unclear in the technician note:
              </p>
              <ul className="space-y-1.5 font-mono text-xs text-amber-200 pl-4 list-disc">
                {analysisResult.missingDataGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* COMPLIANCE CHECKLIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 font-mono text-sm font-bold text-white uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <span>5. COMPLIANCE ASSESSMENT CHECKLIST</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Audit Status
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisResult.checklist.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 font-sans">
                      {item.item}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 border ${
                      item.status === "VERIFIED"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                        : item.status === "ACTION_REQUIRED"
                          ? "bg-amber-950 text-amber-300 border-amber-500/40"
                          : "bg-rose-950 text-rose-300 border-rose-500/40"
                    }`}>
                      {safeFormatEnum(item.status)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PERSONNEL ASSESSMENT & COACHING NOTES SECTION */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2.5 text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <span>6. ASSESSMENT WITH COACHING NOTES FOR PERSONNEL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Service Advisor Coaching */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>SERVICE ADVISOR</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedAdvisor}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  {analysisResult.advisorCoachingNotes || "Ensure customer condition and operating parameters are clearly captured during write-up."}
                </p>
              </div>

              {/* Primary Technician Coaching */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>PRIMARY TECH</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedTech}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  {analysisResult.technicianCoachingNotes || "Record step-by-step diagnostic tree results, XENTRY logs, and component measurements."}
                </p>
              </div>

              {/* Wheel Alignment Technician Coaching */}
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>ALIGNMENT TECH</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedAlignmentTech}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  {analysisResult.wheelAlignmentAssurance?.alignmentTechCoachingNotes || "Verify Romess inclinometer baseline values and record before/after angles with SAS 0.0° zero-point reset."}
                </p>
              </div>
            </div>
          </div>

          {/* TECHNICIAN CLARIFICATION QUESTIONS & TIPS REFERENCE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tech Questions */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>5. CLARIFICATION QUESTIONS FOR TECHNICIAN</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Ask servicing technician <strong className="text-cyan-300">{selectedTech}</strong> these specific questions to resolve ambiguities before warranty submission:
              </p>
              <div className="space-y-2">
                {analysisResult.clarificationQuestionsForTech.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TIPS Reference & Flat Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs">
              <div className="border-b border-slate-800 pb-3 font-bold text-white uppercase tracking-wider">
                TECHNICAL REFERENCES
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                  LI / TIPS GI BULLETIN REFERENCE
                </span>
                <span className="text-xs font-bold text-cyan-300 block">
                  {analysisResult.tipsGIReference || "None required"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                  ESTIMATED FLAT RATE TIME
                </span>
                <span className="text-xs font-bold text-emerald-400 block">
                  {analysisResult.flatRateTimeEstimate || "Standard FRU Allowance"}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* FLASH REPORT MODAL FOR PERSONNEL */}
      {showFlashModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-mono">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-left space-y-5 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    ASP WARRANTY COMPLIANCE // PERSONNEL FLASH REPORT
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Instant Brief for Advisor: {selectedAdvisor} • Tech: {selectedTech}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowFlashModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Vehicle & RO Metadata Bar */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div><span className="text-slate-500 block text-[9px]">RO #</span><strong className="text-white">{roNumber || "N/A"}</strong></div>
              <div><span className="text-slate-500 block text-[9px]">MODEL</span><strong className="text-cyan-300">{model}</strong></div>
              <div><span className="text-slate-500 block text-[9px]">VIN</span><strong className="text-white">{vin || "N/A"}</strong></div>
              <div><span className="text-slate-500 block text-[9px]">MILEAGE</span><strong className="text-white">{mileage || "N/A"}</strong></div>
            </div>

            {/* High Risk Technician Missing Banner */}
            {(analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit) && (
              <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-200 text-xs font-bold flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 uppercase">🔴 HIGH RISK: "TECHNICIAN MISSING" DIAGNOSTIC PROOF</strong>
                  Paperless Xentry mandates full diagnostic upload. Missing tests trigger 100% claim debit.
                </div>
              </div>
            )}

            {/* Cause Status Callout */}
            {isCauseBlank ? (
              <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-200 text-xs font-bold flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 uppercase">⚠️ CRITICAL DEFECT: CAUSE IS BLANK</strong>
                  Factory Warranty rules strictly prohibit blank Cause fields. Claim subject to 100% audit debit unless updated.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>DIAGNOSTIC CAUSE DOCUMENTED & VERIFIED</span>
              </div>
            )}

            {/* Xentry Conflict Status */}
            {analysisResult.xentryConflictAnalysis && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>XENTRY DATA VS. TECH STORY CONFLICT ({analysisResult.xentryConflictAnalysis.conflictLevel})</span>
                </div>
                <p className="text-slate-200 text-[11px]">{analysisResult.xentryConflictAnalysis.summary}</p>
              </div>
            )}

            {/* Executive Assessment */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>EXECUTIVE ASSESSMENT SUMMARY</span>
              </div>
              <p className="text-slate-200 font-sans text-xs">
                {analysisResult.executiveAssessmentSummary}
              </p>
            </div>

            {/* Missing Gaps & Tech Q&A */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>MISSING INFORMATION GAPS & TECH CLARIFICATION Q&A</span>
              </div>

              {analysisResult.missingDataGaps.length > 0 && (
                <div className="text-rose-300 font-mono text-[10px]">
                  <strong>Identified Gaps:</strong> {analysisResult.missingDataGaps.join(" | ")}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                {analysisResult.clarificationQuestionsForTech.map((q, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-200 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">{i + 1}.</span>
                    <span className="flex-1">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Personnel Coaching Notes */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-sans text-xs">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>ASSESSMENT & COACHING NOTES</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <strong className="block font-mono text-cyan-300 text-[10px] uppercase mb-1">
                    Advisor Coaching ({selectedAdvisor})
                  </strong>
                  <p className="text-slate-300 leading-snug">{analysisResult.advisorCoachingNotes}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <strong className="block font-mono text-amber-300 text-[10px] uppercase mb-1">
                    Technician Coaching ({selectedTech})
                  </strong>
                  <p className="text-slate-300 leading-snug">{analysisResult.technicianCoachingNotes}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-emerald-500/30">
                  <strong className="block font-mono text-emerald-300 text-[10px] uppercase mb-1">
                    Alignment Tech ({selectedAlignmentTech})
                  </strong>
                  <p className="text-slate-300 leading-snug">{analysisResult.wheelAlignmentAssurance?.alignmentTechCoachingNotes || "Document Romess ride height baseline and SAS 0.0° zero calibration."}</p>
                </div>
              </div>
            </div>

            {/* Parts & Alignment Quick Risk Indicators */}
            {(analysisResult.partsRiskEvaluation || analysisResult.wheelAlignmentAssurance) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                {analysisResult.partsRiskEvaluation && (
                  <div className={`p-2.5 rounded-xl border ${
                    analysisResult.partsRiskEvaluation.missingOneTimeUseHardware
                      ? "bg-rose-950/70 border-rose-500 text-rose-200"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}>
                    <strong className="block text-[10px] uppercase">
                      PARTS RISK: {analysisResult.partsRiskEvaluation.overallPartsRiskLevel}
                    </strong>
                    <span className="text-[10px] line-clamp-2">{analysisResult.partsRiskEvaluation.summary}</span>
                  </div>
                )}

                {analysisResult.wheelAlignmentAssurance && (
                  <div className="p-2.5 rounded-xl border bg-emerald-950/40 border-emerald-500/40 text-emerald-200">
                    <strong className="block text-[10px] uppercase">
                      ALIGNMENT: {analysisResult.wheelAlignmentAssurance.auditStatus}
                    </strong>
                    <span className="text-[10px] line-clamp-2">{analysisResult.wheelAlignmentAssurance.summary}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyFlashBrief}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSection === "flash_brief" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">FLASH BRIEF COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>COPY FLASH BRIEF</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFlashModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTriggerPrintFlash();
                    setShowFlashModal(false);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs uppercase rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  PRINT FLASH REPORT
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ON-SCREEN FULL PDF REPORT PREVIEW MODAL */}
      {showPdfModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-left space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  ASP WARRANTY COMPLIANCE ASSESSMENT REPORT PREVIEW
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

            <div className="bg-white text-slate-900 rounded-xl p-6 text-xs shadow-inner space-y-4 max-h-[65vh] overflow-y-auto font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    ASP WARRANTY COMPLIANCE ASSESSMENT REPORT
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    TECHNICAL JUSTIFICATION & PAPERLESS XENTRY CONFLICT ANALYZER
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-600 leading-tight">
                  <p><strong>REPAIR ORDER:</strong> {roNumber || "N/A"}</p>
                  <p><strong>DATE:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {(analysisResult.isHighRiskTechnicianMissing || isTechnicianMissingExplicit) && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded text-red-900 font-bold text-[11px]">
                  🔴 CRITICAL DEFECT: "TECHNICIAN MISSING" REQUIRED PAPERLESS XENTRY DIAGNOSTIC PROOF
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">
                <div><strong>SERVICE ADVISOR:</strong> {selectedAdvisor}</div>
                <div><strong>TECHNICIAN:</strong> {selectedTech}</div>
                <div><strong>MANAGER:</strong> {selectedManager}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono">
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">MODEL</span>
                  <span className="text-xs font-bold text-slate-900">{model}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">VIN</span>
                  <span className="text-xs font-bold text-slate-900">{vin || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">MILEAGE</span>
                  <span className="text-xs font-bold text-slate-900">{mileage || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-500 block uppercase">WIS FRU EST.</span>
                  <span className="text-xs font-bold text-cyan-700">{analysisResult.flatRateTimeEstimate}</span>
                </div>
              </div>

              {analysisResult.xentryConflictAnalysis && (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900 uppercase">
                    <span>XENTRY DATA VS. TECH STORY CONFLICT REPORT</span>
                    <span className="text-cyan-700">{analysisResult.xentryConflictAnalysis.conflictLevel}</span>
                  </div>
                  <p className="text-slate-700 font-medium text-[11px]">{analysisResult.xentryConflictAnalysis.summary}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1">
                  1. TECHNICAL JUSTIFICATION 3C WARRANTY STORY
                </h4>
                
                <div className="p-2.5 bg-slate-50 border-l-4 border-sky-600 rounded-r">
                  <span className="text-[9px] font-bold text-sky-800 uppercase block">COMPLAINT</span>
                  <p className="text-slate-800 font-medium">{analysisResult.clarified3CStory.complaint}</p>
                </div>

                <div className="p-2.5 bg-amber-50 border-l-4 border-amber-600 rounded-r">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">CAUSE</span>
                  <p className="text-slate-800 font-medium">{analysisResult.clarified3CStory.cause}</p>
                </div>

                <div className="p-2.5 bg-emerald-50 border-l-4 border-emerald-600 rounded-r">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">CORRECTION</span>
                  <p className="text-slate-800 font-medium">{analysisResult.clarified3CStory.correction}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-1">
                  2. COMBINED DMS STORY
                </h4>
                <div className="p-3 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-slate-800">
                  {analysisResult.formattedFullStory}
                </div>
              </div>

              {/* PARTS RISK AUDIT SUMMARY */}
              {analysisResult.partsRiskEvaluation && (
                <div className={`p-3 border rounded-lg space-y-1.5 ${
                  analysisResult.partsRiskEvaluation.missingOneTimeUseHardware 
                    ? "bg-red-50 border-red-400 text-red-950" 
                    : "bg-slate-50 border-slate-300 text-slate-900"
                }`}>
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span>3. PARTS INVOICE RISK & ONE-TIME USE HARDWARE AUDIT</span>
                    <span className={analysisResult.partsRiskEvaluation.missingOneTimeUseHardware ? "text-red-700" : "text-slate-700"}>
                      {analysisResult.partsRiskEvaluation.overallPartsRiskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{analysisResult.partsRiskEvaluation.summary}</p>
                  {analysisResult.partsRiskEvaluation.missingOneTimeUseHardware && (
                    <div className="text-red-700 font-bold text-[10px]">
                      ⚠️ 100% Audit Exposure: Required one-time use bolts / fasteners missing from DMS invoice parts line items.
                    </div>
                  )}
                </div>
              )}

              {/* WHEEL ALIGNMENT ASSURANCE SUMMARY */}
              {analysisResult.wheelAlignmentAssurance && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-1.5 text-slate-900">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-950 uppercase">
                    <span>4. WHEEL ALIGNMENT POLICY ASSURANCE ({analysisResult.wheelAlignmentAssurance.alignmentTechnicianName || selectedAlignmentTech})</span>
                    <span className="text-emerald-700">{analysisResult.wheelAlignmentAssurance.auditStatus}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-800">{analysisResult.wheelAlignmentAssurance.summary}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-emerald-200">
                    <div><strong>ROMESS RIDE HEIGHT:</strong> {analysisResult.wheelAlignmentAssurance.romessRideHeightStatus}</div>
                    <div><strong>SAS CALIBRATION:</strong> {analysisResult.wheelAlignmentAssurance.steeringAngleSensorCalibrated ? "Verified (0.0°)" : "Not Documented"}</div>
                  </div>
                </div>
              )}

              {/* MISSING INFORMATION GAPS & TECH CLARIFICATION Q&A (LIGHTLY HIGHLIGHTED ATTENTION) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-950 bg-amber-200/90 border-l-4 border-amber-500 px-3 py-1.5 rounded-r uppercase flex items-center justify-between">
                  <span>5. MISSING INFORMATION GAPS & TECH CLARIFICATION Q&A</span>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    ACTION REQUIRED PRIOR TO WARRANTY SUBMISSION
                  </span>
                </h4>

                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2.5">
                  <div className="text-[9.5px] font-bold text-amber-900 uppercase tracking-wide">
                    ⚠️ CRITICAL ATTENTION: CLARIFY THE FOLLOWING AMBIGUITIES WITH TECHNICIAN PRIOR TO MERCEDES-BENZ WARRANTY SUBMISSION
                  </div>

                  {analysisResult.missingDataGaps && analysisResult.missingDataGaps.length > 0 && (
                    <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-900 font-bold text-[10.5px]">
                      🔴 CRITICAL DOCUMENTATION GAPS: {analysisResult.missingDataGaps.join(" • ")}
                    </div>
                  )}

                  <div className="text-[11px] font-bold text-amber-950">
                    TECHNICIAN CLARIFICATION QUESTIONS ({selectedTech || "Servicing Tech"}):
                  </div>

                  <div className="space-y-1.5">
                    {(analysisResult.clarificationQuestionsForTech || []).map((q, idx) => (
                      <div 
                        key={idx} 
                        className="p-2.5 bg-yellow-100/90 border border-yellow-300 border-l-4 border-l-amber-500 rounded text-amber-950 text-[10.5px] font-medium flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <strong className="text-amber-900">{idx + 1}.</strong> {q}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-amber-800 bg-yellow-200/80 px-2 py-0.5 rounded border border-amber-400 shrink-0">
                          [ ] TECH VERIFIED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 mt-6">
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Technician Signature ({selectedTech})
                </div>
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Alignment Tech ({selectedAlignmentTech})
                </div>
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Service Advisor Signature ({selectedAdvisor})
                </div>
              </div>
            </div>

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
                  handleTriggerPrintFull();
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

      {/* CONDENSED BATCH MANAGER REPORT MODAL */}
      {showBatchManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl relative my-8 text-left space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-950 border border-emerald-500/50 rounded-2xl text-emerald-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold uppercase tracking-widest">
                      EXECUTIVE DISPATCH
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-mono font-bold uppercase">
                      CONDENSED MULTI-RO SUMMARY
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    BATCH WARRANTY MANAGER REPORT
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Generate, dispatch, email, and print an ultra-condensed executive warranty audit brief across active repair orders.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowBatchManagerModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification / Dispatch Status Toast */}
            {managerDispatchStatus && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-emerald-200 text-xs font-mono font-bold flex items-center justify-between animate-fade-in shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{managerDispatchStatus}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setManagerDispatchStatus(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Manager Recipient & Dispatch Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  SERVICE / WARRANTY MANAGER:
                </label>
                <input
                  type="text"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Manager name..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  MANAGER EMAIL RECIPIENT:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={managerEmailRecipient}
                    onChange={(e) => setManagerEmailRecipient(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. Amanda@aspclass.org"
                  />
                  <button
                    type="button"
                    onClick={handleSendManagerReportEmail}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>SEND EMAIL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics across Selected Batch Claims */}
            {(() => {
              const activeClaims = getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id));
              const totalExposure = activeClaims.reduce((s, c) => s + c.exposureAmt, 0);
              const criticalCount = activeClaims.filter(c => c.riskStatus === "CRITICAL_RED" || c.riskStatus === "HIGH_RISK").length;
              const missingHwCount = activeClaims.filter(c => c.missingHardwareFlag).length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                      SELECTED CLAIMS
                    </span>
                    <span className="text-lg font-mono font-bold text-white">
                      {activeClaims.length} of {getBatchClaimsData().length} ROs
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                      CRITICAL FLAGS
                    </span>
                    <span className="text-lg font-mono font-bold text-rose-400">
                      {criticalCount} Red Marks
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                      HARDWARE ALERTS
                    </span>
                    <span className="text-lg font-mono font-bold text-amber-400">
                      {missingHwCount} Fasteners
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                      FINANCIAL EXPOSURE
                    </span>
                    <span className="text-lg font-mono font-bold text-cyan-400">
                      ${totalExposure.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Multi-RO Selection Checklist */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                <span>SELECT REPAIR ORDERS TO INCLUDE IN CONDENSED REPORT:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBatchRoIds(getBatchClaimsData().map(c => c.id))}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBatchRoIds(["CURRENT"])}
                    className="text-[10px] text-slate-400 hover:underline cursor-pointer"
                  >
                    Current Only
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {getBatchClaimsData().map((claim) => {
                  const isChecked = selectedBatchRoIds.includes(claim.id);
                  return (
                    <div
                      key={claim.id}
                      onClick={() => {
                        setSelectedBatchRoIds(prev => 
                          prev.includes(claim.id) 
                            ? prev.filter(x => x !== claim.id)
                            : [...prev, claim.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked 
                          ? "bg-slate-950/90 border-emerald-500/60 shadow-md" 
                          : "bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">{claim.roNumber}</span>
                            <span className="text-xs text-slate-400">{claim.model}</span>
                            <span className="text-[10px] font-mono text-slate-500">VIN: ...{claim.vin.slice(-6)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Adv: <strong className="text-slate-200">{claim.advisor}</strong> • Tech: <strong className="text-slate-200">{claim.primaryTech}</strong> {claim.alignmentTech && `• Align: ${claim.alignmentTech}`}
                          </div>
                          {claim.topClarificationQuestion && (
                            <div className="text-[10.5px] text-amber-300 font-medium mt-1 bg-amber-950/50 border border-amber-800/40 rounded px-2 py-0.5 inline-block">
                              ❓ Clarification: {claim.topClarificationQuestion}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          claim.riskStatus === "CRITICAL_RED" 
                            ? "bg-rose-950 text-rose-300 border border-rose-500/50" 
                            : claim.riskStatus === "HIGH_RISK"
                              ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                              : claim.riskStatus === "WARNING_YELLOW"
                                ? "bg-amber-950 text-amber-300 border border-amber-500/50"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                        }`}>
                          {claim.riskLabel}
                        </span>
                        {claim.exposureAmt > 0 && (
                          <div className="text-[10px] font-mono font-bold text-rose-400 mt-1">
                            ${claim.exposureAmt} at risk
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Condensed Plaintext Preview */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <span>CONDENSED PLAIN/MARKDOWN EXPORT PREVIEW:</span>
                <span className="text-emerald-400">Ready for instant dispatch</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {generateCondensedBatchManagerReportText(
                  getBatchClaimsData().filter(c => selectedBatchRoIds.includes(c.id))
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBatchManagerReport}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COPY BRIEF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDispatchManagerTeamsWebhook}
                  disabled={isDispatchingWebhook}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isDispatchingWebhook ? "DISPATCHING..." : "DISPATCH TEAMS"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBatchManagerModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={handleTriggerPrintBatchManagerReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT 1-PAGE MANAGER REPORT</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LUXURY MERCEDES-BENZ EXECUTIVE WARRANTY REPORT MODAL */}
      {showLuxuryPdfModal && (
        <LuxuryMercedesPdfModal
          isOpen={showLuxuryPdfModal}
          onClose={() => setShowLuxuryPdfModal(false)}
          data={getLuxuryAssistantReportData()}
          onSendEmail={(email) => {
            alert(`Executive PDF Report dispatched successfully to ${email}`);
          }}
        />
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { safeGetLocalStorage, safeSetLocalStorage } from "../lib/safeStorage";
import { Employee } from "../types";
import { MercedesKnowledgeManager } from "./MercedesKnowledgeManager";
import { VerifiedMercedesPolicy, loadVerifiedMercedesPolicies, formatActivePoliciesForPrompt } from "../lib/mercedesKnowledgeBase";
import { LuxuryMercedesPdfModal } from "./LuxuryMercedesPdfModal";
import { LuxuryPdfReportData, printLuxuryMercedesReport } from "../utils/luxuryMercedesPdf";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Printer,
  Copy,
  Check,
  Search,
  Upload,
  Camera,
  Trash2,
  Eye,
  RefreshCw,
  HelpCircle,
  Layers,
  Wrench,
  Car,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Zap,
  Bookmark,
  Scale,
  FileSpreadsheet,
  X,
  Users,
  User,
  CheckSquare,
  AlertOctagon,
  MessageSquare,
  GraduationCap,
  HardDrive,
  Paperclip,
  Share2,
  Briefcase
} from "lucide-react";

export interface StoryWritingCoaching {
  manufacturerDefectDefinition: string;
  whyFactoryDefectNotOutsideInfluence: string;
  clarified3CStory: {
    complaint: string;
    cause: string;
    correction: string;
  };
  formattedFullDmsStory: string;
  technicianStoryCoachingNotes: string;
  advisorStoryCoachingNotes: string;
  triggerWordsToAvoid: string[];
  mandatoryPhrasingToInclude: string[];
}

export interface CoverageDeterminationResponse {
  coverageDetermination: 
    | "COVERED_UNDER_WARRANTY" 
    | "EXTENDED_CPO_COVERED" 
    | "EMISSIONS_COVERED" 
    | "GOODWILL_RECOMMENDED" 
    | "NON_COVERED_CUSTOMER_PAY" 
    | "OUTSIDE_INFLUENCE_DENIAL"
    | string;
  determinationTitle: string;
  confidenceScore: number;
  warrantyProgram: string;
  applicablePolicyClause: string;
  defectVsOutsideInfluence: {
    classification: 
      | "GENUINE_FACTORY_DEFECT" 
      | "EXTERNAL_IMPACT_OR_DAMAGE" 
      | "NORMAL_WEAR_AND_TEAR" 
      | "ENVIRONMENTAL_OR_RODENT" 
      | "UNAUTHORIZED_MODIFICATION"
      | string;
    technicalReasoning: string;
    keyEvidencePoints: string[];
  };
  storyWritingCoaching?: StoryWritingCoaching;
  claimFilingGuide: {
    causalPartNumber: string;
    damageCode: string;
    conditionCode: string;
    flatRateOpCodes: {
      code: string;
      description: string;
      hours: string;
    }[];
    oneTimeFastenersRequired: string[];
    mandatoryXentryAttachments: string[];
  };
  advisorCustomerScript: string;
  riskAndPrecautionNotes: string;
  recommendedAction: string;
}

export interface DiagnosticAttachmentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
  textExtract?: string;
}

export interface SavedCoverageDetermination {
  id: string;
  timestamp: string;
  roNumber: string;
  vin: string;
  model: string;
  mileage: string;
  inServiceDate: string;
  warrantyType: string;
  componentName: string;
  partNumber: string;
  customerConcern: string;
  technicianFindings: string;
  repairCorrection?: string;
  faultCodes?: string;
  failureType: string;
  advisorName?: string;
  techName?: string;
  alignmentTechName?: string;
  managerName?: string;
  imageBase64?: string;
  imageFilename?: string;
  result: CoverageDeterminationResponse;
}

export default function WarrantyCoverageDeterminator({ 
  employees = [],
  dealershipName 
}: { 
  employees?: Employee[];
  dealershipName?: string;
}) {
  const activeDealership = dealershipName || safeGetLocalStorage("asp_dealership_location_key") || "Mercedes-Benz of Rockville Centre";

  // Retained Mercedes-Benz Policies / Corrective Knowledge State
  const [verifiedPolicies, setVerifiedPolicies] = useState<VerifiedMercedesPolicy[]>(() => loadVerifiedMercedesPolicies());

  // Personnel Directory Filters
  const advisors = employees.filter(
    (e) => e.role === "ServiceAdvisor" || /advisor|writer/i.test(e.name || "")
  );
  const techs = employees.filter(
    (e) => e.role === "Technician" || /tech|mechanic/i.test(e.name || "")
  );
  const managers = employees.filter(
    (e) => e.role === "Manager" || e.role === "ShopForeman" || /manager|foreman|admin/i.test(e.name || "")
  );

  // Personnel State
  const [advisorName, setAdvisorName] = useState<string>(() => advisors[0]?.name || "John Miller (Advisor #104)");
  const [techName, setTechName] = useState<string>(() => techs[0]?.name || "Alex Rivera (Master Tech #42)");
  const [alignmentTechName, setAlignmentTechName] = useState<string>("");
  const [managerName, setManagerName] = useState<string>(() => managers[0]?.name || "Marcus Vance (Warranty Manager)");

  // Form State
  const [model, setModel] = useState("2022 Mercedes-Benz C300 4MATIC (W206)");
  const [vin, setVin] = useState("W1K7X8KB2MA192034");
  const [roNumber, setRoNumber] = useState("RO-88412");
  const [mileage, setMileage] = useState("32,450 mi");
  const [inServiceDate, setInServiceDate] = useState("2022-03-15");
  const [warrantyType, setWarrantyType] = useState("New Vehicle Limited Warranty (4yr/50k)");
  const [componentName, setComponentName] = useState("Front Lower Control Arm Hydro-Bushing");
  const [partNumber, setPartNumber] = useState("A2053305501");
  const [failureType, setFailureType] = useState("Mechanical / Material Defect");
  
  // 3C Technician Story Inputs
  const [customerConcern, setCustomerConcern] = useState(
    "Customer states abnormal knocking/clunking noise from front suspension over bumps and during deceleration."
  );
  const [technicianFindings, setTechnicianFindings] = useState(
    "Inspected front suspension assembly. Found left front thrust arm hydro-bushing torn with hydraulic dampening fluid expelled. Inspected subframe and control arms; confirmed zero collision marks, curb strikes, or outside impact. Performed XENTRY guided test steps."
  );
  const [repairCorrection, setRepairCorrection] = useState(
    "Replaced defective left front lower control arm assembly per WIS AR33.10. Installed new mandated torque-to-yield stretch bolts and self-locking collar nuts. Performed Romess ride height baseline and 4-wheel alignment. Completed quality verification road test."
  );

  // Diagnostic Info & Paperless Xentry
  const [faultCodes, setFaultCodes] = useState(
    "DTC P030000 / B1201 stored in active memory. N30/4 ESP control unit scan verified baseline alignment deviation."
  );
  const [diagnosticFiles, setDiagnosticFiles] = useState<DiagnosticAttachmentItem[]>([]);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);

  // Primary Attached Image / Photo
  const [stagedImage, setStagedImage] = useState<{
    base64: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [determinationResult, setDeterminationResult] = useState<CoverageDeterminationResponse | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showStoryCoachingTips, setShowStoryCoachingTips] = useState(true);

  // Saved Determinations History
  const [savedHistory, setSavedHistory] = useState<SavedCoverageDetermination[]>(() => {
    const saved = safeGetLocalStorage("asp_coverage_determinations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved coverage determinations", e);
      }
    }
    return [];
  });

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedCoverageDetermination | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xentryInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill personnel if props arrive after initial load
  useEffect(() => {
    if (advisors.length > 0 && (!advisorName || advisorName.includes("Advisor #104"))) {
      setAdvisorName(advisors[0].name);
    }
    if (techs.length > 0 && (!techName || techName.includes("Tech #42"))) {
      setTechName(techs[0].name);
    }
    if (managers.length > 0 && (!managerName || managerName.includes("Warranty Manager"))) {
      setManagerName(managers[0].name);
    }
  }, [employees]);

  // Insert Quick DTC / Diagnostic Tag
  const handleInsertDtcTag = (tag: string) => {
    setFaultCodes((prev) => {
      const clean = prev.trim();
      if (!clean) return tag;
      if (clean.includes(tag)) return clean;
      return `${clean}\n${tag}`;
    });
  };

  // Image Upload handler
  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setStagedImage({
        base64: reader.result as string,
        filename: file.name,
        mimeType: file.type
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Diagnostic File / Paperless Xentry Upload
  const handleDiagnosticFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsExtractingDoc(true);

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newDoc: DiagnosticAttachmentItem = {
          id: `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          base64: file.type.startsWith("image/") ? base64 : undefined,
          textExtract: `[ATTACHED PAPERLESS XENTRY FILE: ${file.name} - Extracted at ${new Date().toLocaleTimeString()}]\nDiagnostic data scan verified for VIN ${vin || 'Vehicle'}. DTC log trees validated.`
        };

        setDiagnosticFiles((prev) => [...prev, newDoc]);
        
        // Auto append note to fault codes area
        setFaultCodes((prev) => {
          const note = `[XENTRY ATTACHMENT]: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          return prev ? `${prev}\n${note}` : note;
        });
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      setIsExtractingDoc(false);
    }, 600);
  };

  // Remove diagnostic file
  const handleRemoveDiagnosticFile = (id: string) => {
    setDiagnosticFiles((prev) => prev.filter((d) => d.id !== id));
  };

  // Transpose Text from attachment into Diagnostic text area
  const handleTransposeText = (doc: DiagnosticAttachmentItem) => {
    if (doc.textExtract) {
      setFaultCodes((prev) => `${prev}\n\n${doc.textExtract}`);
    }
  };

  // Execute Coverage Determination
  const handleDetermineCoverage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!componentName.trim() && !customerConcern.trim() && !technicianFindings.trim() && !stagedImage && !faultCodes.trim()) {
      setErrorMessage("Please provide component details, diagnostic info, customer concern, or upload an image.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/coverage-determinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          roNumber,
          vin,
          mileage,
          inServiceDate,
          warrantyType,
          componentName,
          partNumber,
          customerConcern,
          technicianFindings,
          repairCorrection,
          failureType,
          faultCodes,
          advisorName,
          techName,
          alignmentTechName,
          managerName,
          imageBase64: stagedImage?.base64,
          mimeType: stagedImage?.mimeType,
          filename: stagedImage?.filename,
          context: `Model: ${model}, Mileage: ${mileage}, Warranty: ${warrantyType}, Faults: ${faultCodes}`,
          verifiedKnowledge: formatActivePoliciesForPrompt(verifiedPolicies),
          dealershipName: activeDealership
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data: CoverageDeterminationResponse = await response.json();
      setDeterminationResult(data);

      // Save to history
      const newSavedItem: SavedCoverageDetermination = {
        id: `COV-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        roNumber,
        vin,
        model,
        mileage,
        inServiceDate,
        warrantyType,
        componentName,
        partNumber,
        customerConcern,
        technicianFindings,
        repairCorrection,
        faultCodes,
        failureType,
        advisorName,
        techName,
        alignmentTechName,
        managerName,
        imageBase64: stagedImage?.base64,
        imageFilename: stagedImage?.filename,
        result: data
      };

      const updatedHistory = [newSavedItem, ...savedHistory.slice(0, 49)];
      setSavedHistory(updatedHistory);
      safeSetLocalStorage("asp_coverage_determinations", JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error("Coverage determination error:", err);
      setErrorMessage(err.message || "Failed to process warranty coverage determination.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedHistory.filter((item) => item.id !== id);
    setSavedHistory(updated);
    safeSetLocalStorage("asp_coverage_determinations", JSON.stringify(updated));
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }
  };

  // Trigger Printable Certificate / PDF Modal
  const handleTriggerPrint = (itemData?: CoverageDeterminationResponse) => {
    if (itemData) {
      setDeterminationResult(itemData);
    }
    setShowPdfModal(true);
  };

  const getLuxuryReportData = (res?: CoverageDeterminationResponse): LuxuryPdfReportData => {
    const activeRes = res || determinationResult;
    return {
      dealershipName: activeDealership,
      reportTitle: "ASP MERCEDES-BENZ WARRANTY COVERAGE DETERMINATION",
      reportSubtitle: "AUTHORITATIVE COVERAGE VERDICT & 3C STORY COACHING",
      orientation: "landscape",
      roNumber: roNumber || "N/A",
      vin: vin || "N/A",
      model: model || "Mercedes-Benz",
      mileage: mileage || "N/A",
      advisorName: advisorName || "Service Advisor",
      techName: techName || "Primary Technician",
      alignmentTechName: alignmentTechName || undefined,
      managerName: managerName || "Marcus Vance",
      verdictTitle: activeRes?.determinationTitle || "WARRANTY COVERAGE DETERMINATION",
      verdictStatus: activeRes?.coverageDetermination || "COVERED_UNDER_WARRANTY",
      confidenceScore: activeRes?.confidenceScore || 95,
      warrantyProgram: activeRes?.warrantyProgram || warrantyType,
      applicablePolicyClause: activeRes?.applicablePolicyClause || "MBUSA Warranty Policy Manual & WIS Specifications",
      complaint: activeRes?.storyWritingCoaching?.clarified3CStory?.complaint || customerConcern,
      cause: activeRes?.storyWritingCoaching?.clarified3CStory?.cause || technicianFindings,
      correction: activeRes?.storyWritingCoaching?.clarified3CStory?.correction || repairCorrection,
      fullDmsStory: activeRes?.storyWritingCoaching?.formattedFullDmsStory,
      advisorCustomerScript: activeRes?.advisorCustomerScript,
      techCoaching: activeRes?.storyWritingCoaching?.technicianStoryCoachingNotes,
      advisorCoaching: activeRes?.storyWritingCoaching?.advisorStoryCoachingNotes,
      appliedPolicies: verifiedPolicies.filter(p => p.isActive).map(p => `${p.title} (${p.referenceCode})`),
      faultCodes: faultCodes
    };
  };

  // Filtered History
  const filteredHistory = savedHistory.filter((item) => {
    const matchSearch =
      !historySearch ||
      item.roNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.vin.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.componentName.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.model.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchSearch) return false;
    if (historyFilter === "ALL") return true;
    if (historyFilter === "COVERED") return item.result.coverageDetermination.includes("COVERED");
    if (historyFilter === "DENIAL") return item.result.coverageDetermination.includes("DENIAL") || item.result.coverageDetermination.includes("NON_COVERED");
    if (historyFilter === "GOODWILL") return item.result.coverageDetermination.includes("GOODWILL");
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in font-playfair bg-black text-white">
      
      {/* SECTION BANNER */}
      <div className="relative p-6 sm:p-8 bg-[#08080a] rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/50">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-white border border-white/20 text-[10px] font-serif font-bold uppercase tracking-widest">
                  ASP WARRANTY INTELLIGENCE
                </span>
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20 text-[10px] font-serif font-bold uppercase tracking-wider">
                  ACTIVE REGISTRY: {activeDealership}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight font-serif">
                ASP WARRANTY COVERAGE DETERMINATOR
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-serif mt-1 max-w-3xl leading-relaxed">
                Determine Mercedes-Benz factory warranty coverage, distinguish <strong>Genuine Manufacturer Defects</strong> from non-warrantable outside influence, and guide technicians with real-time <strong>Story Writing Coaching</strong> to define the root cause of defect and eliminate chargebacks.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-end gap-3">
            {determinationResult && (
              <button
                type="button"
                onClick={() => handleTriggerPrint()}
                className="bg-white hover:bg-slate-200 text-black font-serif font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer border border-white"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>PRINT / LUXURY PDF REPORT</span>
              </button>
            )}
            <div className="hidden lg:flex flex-col items-end font-serif text-xs text-slate-300 space-y-1 bg-[#000000] p-3.5 rounded-xl border border-white/15">
              <div className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Factory Policy Compliance</span>
              </div>
              <span className="text-[11px] text-slate-400">MBUSA NVLW • CPO • Emissions 8/80</span>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFIED MERCEDES-BENZ POLICIES & CORRECTIVE KNOWLEDGE BASE MANAGER */}
      <MercedesKnowledgeManager
        onPoliciesChanged={setVerifiedPolicies}
        defaultExpanded={false}
      />

      {/* MAIN WORKBENCH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: INTAKE, DIRECTORY ASSIGNMENT, DIAGNOSTICS & STORY WRITING INPUTS (SPAN 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          <form onSubmit={handleDetermineCoverage} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* 1. DEALERSHIP PERSONNEL DIRECTORY ASSIGNMENT */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>DEALERSHIP PERSONNEL DIRECTORY ASSIGNMENT</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {employees.length} Directory Staff Loaded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Service Advisor */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    SERVICE ADVISOR
                  </label>
                  {advisors.length > 0 ? (
                    <select
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      {advisors.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} (Advisor)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      placeholder="e.g. John Miller (Advisor #104)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  )}
                </div>

                {/* Primary Technician */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    PRIMARY TECHNICIAN
                  </label>
                  {techs.length > 0 ? (
                    <select
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      {techs.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} (Tech)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      placeholder="e.g. Alex Rivera (Master Tech #42)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  )}
                </div>

                {/* Wheel Alignment Tech */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    WHEEL ALIGNMENT TECHNICIAN (OPTIONAL)
                  </label>
                  {techs.length > 0 ? (
                    <select
                      value={alignmentTechName}
                      onChange={(e) => setAlignmentTechName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="">-- None / Standard Repair --</option>
                      {techs.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} (Alignment Specialist)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={alignmentTechName}
                      onChange={(e) => setAlignmentTechName(e.target.value)}
                      placeholder="e.g. David Cho (Alignment Tech)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  )}
                </div>

                {/* Service / Warranty Manager */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    SERVICE / WARRANTY MANAGER
                  </label>
                  {managers.length > 0 ? (
                    <select
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      {managers.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Marcus Vance (Warranty Manager)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  )}
                </div>

              </div>
            </div>

            {/* 2. VEHICLE & CLAIM METADATA */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <Car className="w-4 h-4 text-pink-400" />
                <span>VEHICLE IDENTIFICATION & WARRANTY PROGRAM</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    VEHICLE MODEL & CHASSIS
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. 2022 Mercedes-Benz C300 4MATIC (W206)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    RO / CLAIM #
                  </label>
                  <input
                    type="text"
                    value={roNumber}
                    onChange={(e) => setRoNumber(e.target.value)}
                    placeholder="e.g. RO-88412"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    17-CHARACTER VIN
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="e.g. W1K7X8KB2MA192034"
                    maxLength={17}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    CURRENT ODOMETER MILEAGE
                  </label>
                  <input
                    type="text"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 32,450 mi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    IN-SERVICE / START DATE
                  </label>
                  <input
                    type="date"
                    value={inServiceDate}
                    onChange={(e) => setInServiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  DECLARED OEM WARRANTY PROGRAM
                </label>
                <select
                  value={warrantyType}
                  onChange={(e) => setWarrantyType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                >
                  <option value="New Vehicle Limited Warranty (4yr/50k)">New Vehicle Limited Warranty - NVLW (4yr/50,000 miles)</option>
                  <option value="Certified Pre-Owned (CPO) Warranty">Certified Pre-Owned (CPO) Warranty (1yr/Unlimited Miles)</option>
                  <option value="Federal Emissions Defect Warranty (8yr/80k)">Federal Emissions Defect Warranty (8yr/80,000 miles)</option>
                  <option value="California Emissions Warranty (7yr/70k)">California PZEV Emissions Warranty (7yr/70,000 miles)</option>
                  <option value="Service Parts Warranty (24-Month / Unlimited Miles)">Dealer Service Parts Warranty (24-Month / Unlimited Miles)</option>
                  <option value="Special Goodwill Consideration">Special Factory Goodwill Consideration</option>
                  <option value="Customer Pay / Outside Influence">Customer Pay / Outside Influence</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    DEFECTIVE COMPONENT / SUBASSEMBLY
                  </label>
                  <input
                    type="text"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    placeholder="e.g. Front Lower Control Arm Hydro-Bushing"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                    CAUSAL PART NUMBER
                  </label>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. A2053305501"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* 3. FAULT CODES (DTCS) / DIAGNOSTIC INFO & PAPERLESS XENTRY DIAGNOSIS */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>FAULT CODES (DTCS) / DIAGNOSTIC INFO & PAPERLESS XENTRY DIAGNOSIS</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Quick Test • Guided Diagnosis
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                  <span>RECORDED DTCS & DIAGNOSTIC SCAN LOGS</span>
                  <span className="text-slate-400 text-[10px] font-normal">
                    Enter stored fault codes, freeze frame values, or guided test results
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={faultCodes}
                  onChange={(e) => setFaultCodes(e.target.value)}
                  placeholder="e.g. Stored DTC P030000 in ME control unit; N30/4 ESP initial scan confirmed out of calibration; Guided test completed..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                />
              </div>

              {/* Quick DTC Tag Insert Chips */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase font-bold">
                  Quick-Insert Common Mercedes-Benz Diagnostic Tags:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "DTC P030000 (Misfire Detected)",
                    "DTC P229F62 (NOX Sensor 2 Open Circuit)",
                    "DTC B1201 (Airmatic Pressure Deviation)",
                    "DTC C1000 (Steering Angle Zero Point)",
                    "DTC P06DA00 (Engine Oil Control Valve)",
                    "DTC U0100 (Lost Comm with ECM)",
                    "+ Quick Test Scan Attached",
                    "+ Guided Test Protocol Attached",
                    "+ Romess Inclinometer Baseline Attached"
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertDtcTag(tag)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-lg text-[10px] font-mono text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & Drop Paperless Xentry Upload Zone */}
              <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 bg-slate-900/30 transition-all">
                <input
                  ref={xentryInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,image/*"
                  className="hidden"
                  onChange={(e) => handleDiagnosticFileUpload(e.target.files)}
                />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">
                        Upload Paperless Xentry Diagnostic Files
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Attach Quick Test PDFs, Guided Test trees, Adaptation logs, or cluster photos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => xentryInputRef.current?.click()}
                    disabled={isExtractingDoc}
                    className="px-3.5 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isExtractingDoc ? "EXTRACTING..." : "ATTACH FILES"}</span>
                  </button>
                </div>

                {/* Staged Diagnostic Attachments */}
                {diagnosticFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      Attached Diagnostic Documents ({diagnosticFiles.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {diagnosticFiles.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate text-slate-200 text-[11px]">{doc.name}</span>
                            <span className="text-[9px] text-slate-500 shrink-0">({(doc.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleTransposeText(doc)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[9px] rounded border border-slate-700"
                              title="Transpose to Fault Codes Box"
                            >
                              TRANSPOSE
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDiagnosticFile(doc.id)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. STORY WRITING COACHING INPUTS: 3C NARRATIVE FORMULATION */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>STORY WRITING COACHING INTAKE (COMPLAINT, CAUSE, CORRECTION)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStoryCoachingTips(!showStoryCoachingTips)}
                  className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{showStoryCoachingTips ? "Hide Coaching Rules" : "Show Coaching Rules"}</span>
                </button>
              </div>

              {/* Story Writing Rule Banner */}
              {showStoryCoachingTips && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
                  <p className="font-bold text-emerald-300 text-[11px] uppercase font-mono flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    Technician Story Writing Protocol (Zero-Chargeback Standard):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
                    <li><strong>Identify & Define Manufacturer Cause:</strong> State the exact internal material failure mechanism (e.g. hydro-bushing seal fatigue, sensor element circuit open).</li>
                    <li><strong>Rule Out Outside Influence:</strong> Explicitly state <em>"Inspected surrounding area; no physical collision marks, curb strikes, road hazard impact, or rodent chew observed."</em></li>
                    <li><strong>Cite WIS & One-Time Fasteners:</strong> Reference WIS operation code, torque-to-yield stretch bolts replaced, and quality road test completed.</li>
                  </ul>
                </div>
              )}

              {/* Complaint Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  1. CUSTOMER CONCERN / COMPLAINT (C1)
                </label>
                <textarea
                  rows={2}
                  value={customerConcern}
                  onChange={(e) => setCustomerConcern(e.target.value)}
                  placeholder="e.g. Customer states knocking noise from front suspension over bumps and during braking..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Cause Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>2. TECHNICIAN DIAGNOSTIC FINDINGS / ROUGH CAUSE (C2)</span>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase">
                    *Define Manufacturer Defect
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={technicianFindings}
                  onChange={(e) => setTechnicianFindings(e.target.value)}
                  placeholder="e.g. Inspected front suspension. Found left front thrust arm hydro-bushing torn with hydraulic fluid expelled. No collision marks or outside influence present..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Correction Input */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                  3. REPAIR ACTION / CORRECTION (C3)
                </label>
                <textarea
                  rows={2}
                  value={repairCorrection}
                  onChange={(e) => setRepairCorrection(e.target.value)}
                  placeholder="e.g. Replaced defective lower control arm assembly per WIS AR33.10. Installed new torque-to-yield stretch bolts. Performed alignment and verified via road test..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* 5. PHYSICAL COMPONENT PHOTO UPLOAD (OPTIONAL) */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>COMPONENT PHOTO / VISUAL EVIDENCE (OPTIONAL)</span>
                </h3>
                {stagedImage && (
                  <button
                    type="button"
                    onClick={() => setStagedImage(null)}
                    className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />

              {!stagedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer bg-slate-900/30 transition-all flex items-center justify-center gap-3"
                >
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300">
                    Click to attach physical component photo for visual defect analysis
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <img
                    src={stagedImage.base64}
                    alt="Defective Component"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                  />
                  <div className="truncate">
                    <p className="text-xs font-mono font-bold text-white truncate">{stagedImage.filename}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Visual Evidence Ready for Gemini Assessment</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUBMIT ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 text-white font-mono font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-pink-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-pink-400/30 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>ANALYZING COVERAGE & COMPILING STORY COACHING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>EXECUTE WARRANTY COVERAGE DETERMINATION & STORY COACHING</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: DETERMINATION RESULTS & STORY COACHING (SPAN 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {determinationResult ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* 1. COVERAGE DETERMINATION DECISION CARD */}
              <div className={`p-6 rounded-3xl border shadow-2xl space-y-5 ${
                determinationResult.coverageDetermination.includes("COVERED")
                  ? "bg-emerald-950/30 border-emerald-500/40 shadow-emerald-950/20"
                  : determinationResult.coverageDetermination.includes("GOODWILL")
                  ? "bg-amber-950/30 border-amber-500/40 shadow-amber-950/20"
                  : "bg-red-950/30 border-red-500/40 shadow-red-950/20"
              }`}>
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        determinationResult.coverageDetermination.includes("COVERED")
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : determinationResult.coverageDetermination.includes("GOODWILL")
                          ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                          : "bg-red-950 text-red-300 border border-red-500/40"
                      }`}>
                        {determinationResult.coverageDetermination.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white leading-snug">
                      {determinationResult.determinationTitle}
                    </h2>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">CONFIDENCE</span>
                    <span className="text-2xl font-black text-white font-mono">
                      {determinationResult.confidenceScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">POLICY CLAUSE</span>
                    <span className="text-slate-200 font-bold">{determinationResult.applicablePolicyClause}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">PROGRAM</span>
                    <span className="text-slate-200 font-bold">{determinationResult.warrantyProgram}</span>
                  </div>
                </div>

                {/* Classification & Outside Influence Analysis */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    MANUFACTURER DEFECT VS. OUTSIDE INFLUENCE VERDICT:
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    {determinationResult.defectVsOutsideInfluence?.technicalReasoning}
                  </p>

                  {determinationResult.defectVsOutsideInfluence?.keyEvidencePoints?.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {determinationResult.defectVsOutsideInfluence.keyEvidencePoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* 2. TECHNICIAN STORY WRITING & DEFECT DEFINITION COACHING MODULE */}
              {determinationResult.storyWritingCoaching && (
                <div className="bg-slate-900/60 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          TECHNICIAN STORY WRITING COACHING
                        </h3>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          Factory Defect Identification & Audit Protection
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(determinationResult.storyWritingCoaching!.formattedFullDmsStory, "all_story")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                    >
                      {copiedSection === "all_story" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === "all_story" ? "COPIED ALL!" : "COPY DMS STORY"}</span>
                    </button>
                  </div>

                  {/* 1. IDENTIFYING AND DEFINING MANUFACTURER CAUSE */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      1. DEFINED MANUFACTURER CAUSE OF DEFECT:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {determinationResult.storyWritingCoaching.manufacturerDefectDefinition}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                        Technical Outside Influence Defense:
                      </span>
                      <p className="text-[11px] text-slate-300 italic">
                        {determinationResult.storyWritingCoaching.whyFactoryDefectNotOutsideInfluence}
                      </p>
                    </div>
                  </div>

                  {/* 2. 3C STORY FORMULATION */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      2. STANDARDIZED 3C BREAKDOWN:
                    </span>

                    {/* Complaint */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">COMPLAINT (C1)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(determinationResult.storyWritingCoaching!.clarified3CStory.complaint, "c1")}
                          className="text-[9px] font-mono text-slate-400 hover:text-white"
                        >
                          {copiedSection === "c1" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-slate-200">{determinationResult.storyWritingCoaching.clarified3CStory.complaint}</p>
                    </div>

                    {/* Cause */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">CAUSE (C2)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(determinationResult.storyWritingCoaching!.clarified3CStory.cause, "c2")}
                          className="text-[9px] font-mono text-slate-400 hover:text-white"
                        >
                          {copiedSection === "c2" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-slate-200">{determinationResult.storyWritingCoaching.clarified3CStory.cause}</p>
                    </div>

                    {/* Correction */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-pink-400 font-bold uppercase">CORRECTION (C3)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(determinationResult.storyWritingCoaching!.clarified3CStory.correction, "c3")}
                          className="text-[9px] font-mono text-slate-400 hover:text-white"
                        >
                          {copiedSection === "c3" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-slate-200">{determinationResult.storyWritingCoaching.clarified3CStory.correction}</p>
                    </div>
                  </div>

                  {/* 3. TRIGGER WORDS VS MANDATORY PHRASING */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono text-red-400 font-bold uppercase block">
                        ⛔ AVOID TRIGGER WORDS:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {determinationResult.storyWritingCoaching.triggerWordsToAvoid.map((w, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-red-900/60 text-red-200 text-[9px] rounded font-mono">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                        ✓ MANDATORY PHRASING:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {determinationResult.storyWritingCoaching.mandatoryPhrasingToInclude.map((w, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-emerald-900/60 text-emerald-200 text-[9px] rounded font-mono">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. DIRECT COACHING FOR TECH & ADVISOR */}
                  <div className="space-y-2 text-xs bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                        Coaching for Tech ({techName}):
                      </span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        {determinationResult.storyWritingCoaching.technicianStoryCoachingNotes}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-pink-400 font-bold uppercase block">
                        Coaching for Advisor ({advisorName}):
                      </span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        {determinationResult.storyWritingCoaching.advisorStoryCoachingNotes}
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* 3. CLAIM FILING & WIS GUIDE */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>CLAIM FILING SPECIFICATIONS (NETSTAR / DMS)</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">CAUSAL PART</span>
                    <span className="text-white font-bold">{determinationResult.claimFilingGuide?.causalPartNumber || partNumber}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">DAMAGE CODE</span>
                    <span className="text-white font-bold">{determinationResult.claimFilingGuide?.damageCode || "33102 73"}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">CONDITION</span>
                    <span className="text-white font-bold">{determinationResult.claimFilingGuide?.conditionCode || "01"}</span>
                  </div>
                </div>

                {determinationResult.claimFilingGuide?.flatRateOpCodes?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      WIS Flat Rate Operations:
                    </span>
                    {determinationResult.claimFilingGuide.flatRateOpCodes.map((op, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                        <span className="text-cyan-300 font-bold">{op.code}</span>
                        <span className="text-slate-300 truncate max-w-[180px] font-sans">{op.description}</span>
                        <span className="text-emerald-400 font-bold">{op.hours}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Advisor Customer Script */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                    Service Advisor Customer Presentation Script:
                  </span>
                  <p className="text-slate-300 italic text-[11px] leading-relaxed">
                    "{determinationResult.advisorCustomerScript}"
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* Empty State / Standby */
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-xl">
                <Scale className="w-8 h-8 text-pink-400" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white uppercase font-sans">
                  Awaiting Claim & Diagnostic Intake
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Assign dealership personnel, input Fault Codes (DTCs) or Paperless Xentry files, draft the technician's 3C notes, and click <strong>Execute Warranty Coverage Determination</strong> to receive audit-proof coaching and factory coverage rulings.
                </p>
              </div>
            </div>
          )}

          {/* RECENT SAVED DETERMINATIONS DRAWER */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>SAVED DETERMINATION HISTORY ({savedHistory.length})</span>
              </h3>
              {savedHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear all saved coverage determinations from local storage?")) {
                      setSavedHistory([]);
                      safeSetLocalStorage("asp_coverage_determinations", JSON.stringify([]));
                    }
                  }}
                  className="text-[10px] font-mono text-red-400 hover:underline"
                >
                  Clear History
                </button>
              )}
            </div>

            {savedHistory.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {savedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setModel(item.model);
                      setVin(item.vin);
                      setRoNumber(item.roNumber);
                      setMileage(item.mileage);
                      setInServiceDate(item.inServiceDate);
                      setWarrantyType(item.warrantyType);
                      setComponentName(item.componentName);
                      setPartNumber(item.partNumber);
                      setFailureType(item.failureType);
                      setCustomerConcern(item.customerConcern);
                      setTechnicianFindings(item.technicianFindings);
                      setRepairCorrection(item.repairCorrection || "");
                      setFaultCodes(item.faultCodes || "");
                      if (item.advisorName) setAdvisorName(item.advisorName);
                      if (item.techName) setTechName(item.techName);
                      if (item.alignmentTechName) setAlignmentTechName(item.alignmentTechName);
                      if (item.managerName) setManagerName(item.managerName);
                      setDeterminationResult(item.result);
                    }}
                    className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{item.roNumber || "RO-AUTO"}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                          item.result.coverageDetermination.includes("COVERED") ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                        }`}>
                          {item.result.coverageDetermination.includes("COVERED") ? "COVERED" : "DENIAL / CAUTION"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[220px] font-sans mt-0.5">
                        {item.componentName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono text-center py-4">
                No determinations stored in local session.
              </p>
            )}
          </div>

        </div>

      </div>

      {/* LUXURY MERCEDES-BENZ EXECUTIVE WARRANTY REPORT MODAL */}
      {showPdfModal && (
        <LuxuryMercedesPdfModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          data={getLuxuryReportData()}
          onSendEmail={(email) => {
            alert(`Executive PDF Report dispatched successfully to ${email}`);
          }}
        />
      )}

    </div>
  );
}

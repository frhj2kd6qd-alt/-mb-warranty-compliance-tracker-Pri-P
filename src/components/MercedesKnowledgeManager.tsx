import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  RotateCcw,
  Search,
  CheckCircle2,
  Sliders
} from "lucide-react";
import {
  VerifiedMercedesPolicy,
  loadVerifiedMercedesPolicies,
  saveVerifiedMercedesPolicies,
  DEFAULT_VERIFIED_MERCEDES_POLICIES
} from "../lib/mercedesKnowledgeBase";

interface MercedesKnowledgeManagerProps {
  onPoliciesChanged?: (policies: VerifiedMercedesPolicy[]) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export function MercedesKnowledgeManager({
  onPoliciesChanged,
  className = "",
  defaultExpanded = false
}: MercedesKnowledgeManagerProps) {
  const [policies, setPolicies] = useState<VerifiedMercedesPolicy[]>(() => loadVerifiedMercedesPolicies());
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // Modal / Form state for adding/editing a policy
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [category, setCategory] = useState<VerifiedMercedesPolicy["category"]>("POLICY_MANUAL");
  const [summary, setSummary] = useState<string>("");
  const [requirementsText, setRequirementsText] = useState<string>("");
  const [auditDebitRisk, setAuditDebitRisk] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    saveVerifiedMercedesPolicies(policies);
    if (onPoliciesChanged) {
      onPoliciesChanged(policies);
    }
  }, [policies, onPoliciesChanged]);

  const activeCount = policies.filter((p) => p.isActive).length;

  const handleToggleActive = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
    showBanner("Policy status updated. AI grounding refreshed.");
  };

  const showBanner = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingPolicyId(null);
    setTitle("");
    setReferenceCode("");
    setCategory("POLICY_MANUAL");
    setSummary("");
    setRequirementsText("");
    setAuditDebitRisk("HIGH");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: VerifiedMercedesPolicy) => {
    setEditingPolicyId(p.id);
    setTitle(p.title);
    setReferenceCode(p.referenceCode);
    setCategory(p.category);
    setSummary(p.summary);
    setRequirementsText(p.mandatoryRequirements.join("\n"));
    setAuditDebitRisk(p.auditDebitRisk);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      alert("Please provide at least a title and summary for the policy / rule.");
      return;
    }

    const reqList = requirementsText
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (editingPolicyId) {
      // Edit existing
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === editingPolicyId
            ? {
                ...p,
                title: title.trim(),
                referenceCode: referenceCode.trim() || "MB-CUSTOM",
                category,
                summary: summary.trim(),
                mandatoryRequirements: reqList.length > 0 ? reqList : ["Mandatory adherence to documented work instruction."],
                auditDebitRisk,
              }
            : p
        )
      );
      showBanner("Verified Mercedes-Benz Policy successfully updated & retained.");
    } else {
      // Create new
      const newPolicy: VerifiedMercedesPolicy = {
        id: `mb-custom-${Date.now()}`,
        title: title.trim(),
        referenceCode: referenceCode.trim() || `MB-CORRECTIVE-${Date.now().toString().slice(-4)}`,
        category,
        summary: summary.trim(),
        mandatoryRequirements: reqList.length > 0 ? reqList : ["Mandatory technical compliance check."],
        auditDebitRisk,
        isActive: true,
        isCustom: true,
        createdAt: new Date().toISOString().split("T")[0]
      };
      setPolicies((prev) => [newPolicy, ...prev]);
      showBanner("New Verified Policy / Instruction successfully registered into AI Knowledge Base.");
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this verified policy from knowledge retention?")) {
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      showBanner("Policy removed from knowledge base.");
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all policies to factory default Mercedes-Benz standard rules?")) {
      setPolicies(DEFAULT_VERIFIED_MERCEDES_POLICIES);
      showBanner("Restored default Mercedes-Benz OEM policy and knowledge base.");
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.referenceCode.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "POLICY_MANUAL":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "ONE_TIME_HARDWARE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "WIS_MANDATE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "ALIGNMENT_ROMESS":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "GOODWILL_MATRIX":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "CORRECTIVE_KNOWLEDGE":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide font-sans flex items-center gap-2">
                VERIFIED MERCEDES-BENZ POLICIES & CORRECTIVE KNOWLEDGE BASE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {activeCount} ACTIVE AI RULES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Retained OEM policies, WIS work instructions, TIPS/LI bulletins & dealer corrective knowledge powering live AI evaluations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD NEW POLICY / RULE</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse policy panel" : "Expand policy panel"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="px-5 py-2 bg-cyan-950/60 border-b border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policies, WIS op codes, LI bulletins, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 font-sans"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Rules" },
                { id: "POLICY_MANUAL", label: "Policy Manual" },
                { id: "ONE_TIME_HARDWARE", label: "One-Time Hardware" },
                { id: "WIS_MANDATE", label: "WIS / Xentry" },
                { id: "ALIGNMENT_ROMESS", label: "Wheel Alignment" },
                { id: "GOODWILL_MATRIX", label: "Goodwill Matrix" },
                { id: "CORRECTIVE_KNOWLEDGE", label: "Corrective Story" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset to default OEM policies"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredPolicies.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border transition-all ${
                  p.isActive
                    ? "bg-slate-950/80 border-slate-700 hover:border-slate-600 shadow-md"
                    : "bg-slate-950/40 border-slate-800/60 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getCategoryBadgeColor(p.category)}`}>
                        {p.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400/90 font-bold">
                        {p.referenceCode}
                      </span>
                      {p.isCustom && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          CUSTOM RETAINED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {p.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id)}
                      className={`p-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                        p.isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}
                      title={p.isActive ? "Active (AI using this policy)" : "Inactive (AI ignoring this policy)"}
                    >
                      {p.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit policy"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {p.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Delete custom policy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  {p.summary}
                </p>

                {p.mandatoryRequirements && p.mandatoryRequirements.length > 0 && (
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      MANDATORY AUDIT COMPLIANCE CRITERIA:
                    </span>
                    <ul className="space-y-1 text-[10px] text-slate-300">
                      {p.mandatoryRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-left space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {editingPolicyId ? "EDIT VERIFIED MERCEDES-BENZ POLICY" : "REGISTER NEW VERIFIED POLICY / CORRECTIVE KNOWLEDGE"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    POLICY TITLE / TOPIC *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M264 Oil Control Valve Wire Harness Sealing"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    REFERENCE CODE / BULLETIN NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LI01.30-P-072341 or WIS AR01.30-P-5800"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="POLICY_MANUAL">Policy Manual (NVLW / CPO / Emissions)</option>
                    <option value="ONE_TIME_HARDWARE">One-Time Use Hardware & Fasteners</option>
                    <option value="WIS_MANDATE">WIS Work Instructions & Xentry</option>
                    <option value="TIPS_LI_BULLETIN">TIPS / LI Technical Bulletin</option>
                    <option value="ALIGNMENT_ROMESS">Wheel Alignment & Romess</option>
                    <option value="GOODWILL_MATRIX">Goodwill Assistance Matrix</option>
                    <option value="CORRECTIVE_KNOWLEDGE">Technician Corrective 3C Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                    AUDIT DEBIT EXPOSURE RISK
                  </label>
                  <select
                    value={auditDebitRisk}
                    onChange={(e) => setAuditDebitRisk(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HIGH">High (100% Factory Chargeback Risk)</option>
                    <option value="MEDIUM">Medium (Documentation Clarification Loop)</option>
                    <option value="LOW">Low (Optimized Efficiency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                  POLICY SUMMARY & FACTORY RULE EXPLANATION *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the exact factory rule, coverage constraint, or technician instruction..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                  MANDATORY AUDIT REQUIREMENTS (One bullet per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Always replace and bill aluminum stretch bolts per WIS torque spec&#10;Attach initial Quick Test scan proving DTC code&#10;Eliminate trigger word 'curb contact'"
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>RETAIN & APPLY TO AI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

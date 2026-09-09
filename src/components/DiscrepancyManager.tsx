import React, { useState } from "react";
import { ReconciliationDataset, ReconciliationDiscrepancy } from "../types/reconciliation";
import { AlertCircle, CheckCircle2, FileUp, Send, Check, ShieldAlert } from "lucide-react";

interface DiscrepancyManagerProps {
  data: ReconciliationDataset;
  onUpdateDiscrepancy?: (updatedList: ReconciliationDiscrepancy[]) => void;
}

export const DiscrepancyManager: React.FC<DiscrepancyManagerProps> = ({
  data,
  onUpdateDiscrepancy
}) => {
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<ReconciliationDiscrepancy | null>(
    data.discrepancies.length > 0 ? data.discrepancies[0] : null
  );
  const [activeTab, setActiveTab] = useState<"ALL" | "HIGH" | "MEDIUM" | "RESOLVED">("ALL");
  const [noteInput, setNoteInput] = useState("");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const handleResolve = (id: string) => {
    const updatedSet = new Set(resolvedIds);
    if (updatedSet.has(id)) {
      updatedSet.delete(id);
    } else {
      updatedSet.add(id);
    }
    setResolvedIds(updatedSet);

    if (onUpdateDiscrepancy) {
      const updatedList = data.discrepancies.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            status: updatedSet.has(id) ? "RESOLVED" : "OPEN"
          };
        }
        return d;
      });
      onUpdateDiscrepancy(updatedList);
    }
  };

  const handleAddNote = () => {
    if (!selectedDiscrepancy || !noteInput.trim()) return;
    const currentNotes = selectedDiscrepancy.operatorNotes || "";
    const updated = `${currentNotes ? currentNotes + " | " : ""}[${new Date().toLocaleDateString()} Amanda]: ${noteInput.trim()}`;
    selectedDiscrepancy.operatorNotes = updated;
    setNoteInput("");
  };

  const filteredDiscrepancies = data.discrepancies.filter((d) => {
    const isResolved = resolvedIds.has(d.id) || d.status === "RESOLVED";
    if (activeTab === "RESOLVED") return isResolved;
    if (isResolved) return false;
    if (activeTab === "HIGH") return d.riskSeverity === "HIGH";
    if (activeTab === "MEDIUM") return d.riskSeverity === "MEDIUM";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Warranty Audit Compliance & Exception Manager
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review and resolve daily discrepancies flagged between DMS technician flag records and MBUSA PXD warranty credits.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "ALL" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active ({data.discrepancies.length - resolvedIds.size})
          </button>
          <button
            onClick={() => setActiveTab("HIGH")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "HIGH" ? "bg-rose-500/20 text-rose-300 font-semibold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "RESOLVED" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Resolved ({resolvedIds.size})
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Exception List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredDiscrepancies.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">All exceptions in this filter resolved</p>
              <p className="text-xs text-zinc-400 mt-1">Check back during the next daily batch ingestion.</p>
            </div>
          ) : (
            filteredDiscrepancies.map((disc) => {
              const isSelected = selectedDiscrepancy?.id === disc.id;
              const isResolved = resolvedIds.has(disc.id) || disc.status === "RESOLVED";

              return (
                <div
                  key={disc.id}
                  onClick={() => setSelectedDiscrepancy(disc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-zinc-800/90 border-emerald-500/50 shadow-lg shadow-black/40 ring-1 ring-emerald-500/20"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-white">
                      {disc.expenseId || disc.invoiceNumber || disc.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : disc.riskSeverity === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isResolved ? "RESOLVED" : `${disc.riskSeverity} RISK`}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-zinc-200 line-clamp-1">{disc.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{disc.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/60 text-xs">
                    <span className="text-zinc-400">Tech: <span className="text-zinc-300 font-medium">{disc.employeeName}</span></span>
                    <span className="font-bold text-amber-400">
                      ${(disc.varianceAmount || disc.expenseAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedDiscrepancy ? (
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 space-y-6 shadow-2xl sticky top-20">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                      {selectedDiscrepancy.expenseId || "WARRANTY AUDIT"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      resolvedIds.has(selectedDiscrepancy.id)
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : selectedDiscrepancy.riskSeverity === "HIGH"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {resolvedIds.has(selectedDiscrepancy.id) ? "RESOLVED" : `${selectedDiscrepancy.riskSeverity} PRIORITY`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">{selectedDiscrepancy.title}</h3>
                </div>

                <button
                  id="btn-resolve-current-exception"
                  onClick={() => handleResolve(selectedDiscrepancy.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    resolvedIds.has(selectedDiscrepancy.id)
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {resolvedIds.has(selectedDiscrepancy.id) ? "Marked Resolved" : "Resolve Exception"}
                </button>
              </div>

              {/* Financial Variance Grid */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/60 text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">DMS Claimed</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    ${(selectedDiscrepancy.expenseAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">MBUSA Paid</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                    ${(selectedDiscrepancy.invoiceAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Net Variance</span>
                  <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                    ${(selectedDiscrepancy.varianceAmount || selectedDiscrepancy.expenseAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Audit Findings & Recommendation */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-zinc-300 uppercase text-[10px] tracking-wider mb-1">
                    Discrepancy Diagnosis
                  </h4>
                  <p className="text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/40 leading-relaxed">
                    {selectedDiscrepancy.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Recommended Remediation Protocol
                  </h4>
                  <p className="text-zinc-200 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg leading-relaxed">
                    {selectedDiscrepancy.recommendedAction}
                  </p>
                </div>

                {/* Operator Notes */}
                {selectedDiscrepancy.operatorNotes && (
                  <div>
                    <h4 className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider mb-1">
                      Audit Notes & History
                    </h4>
                    <p className="text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/40 font-mono text-[11px]">
                      {selectedDiscrepancy.operatorNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Add Remediation Note */}
              <div className="pt-2 border-t border-zinc-800/60">
                <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                  Append Administrator Resolution Note
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g., Attached XENTRY battery log to PXD ticket #8841..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
              Select an exception to view full audit details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

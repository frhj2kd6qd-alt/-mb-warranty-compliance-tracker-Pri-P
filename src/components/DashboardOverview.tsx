import React from "react";
import { ReconciliationDataset } from "../types/reconciliation";
import { DollarSign, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, FileText, ChevronRight } from "lucide-react";

interface DashboardOverviewProps {
  data: ReconciliationDataset;
  onNavigateTab: (tab: "ledger" | "discrepancies" | "upload" | "tanks") => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  onNavigateTab
}) => {
  const { summary, discrepancies } = data;
  const matchRate = summary.totalExpenses > 0
    ? ((summary.matchedCount / summary.totalExpenses) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-6">
      {/* Top Banner / Dealership Status */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                Active Audit Period
              </span>
              <span className="text-xs text-zinc-400">
                Last Synced: {new Date(data.generatedAt).toLocaleDateString()} at {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Mercedes-Benz Warranty Schedule & Daily ROs
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Automated reconciliation of Dealer Management System (DMS) repair orders against MBUSA NetStar remittance advice protocols and PXD warranty credits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-quick-ingest"
              onClick={() => onNavigateTab("upload")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 border border-emerald-400/20"
            >
              <FileText className="w-3.5 h-3.5" />
              Upload C-File / Remittance
            </button>
            <button
              id="btn-view-exceptions"
              onClick={() => onNavigateTab("discrepancies")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-all border border-zinc-700/80 flex items-center gap-2"
            >
              View Exceptions ({summary.discrepanciesCount})
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Claimed */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">DMS Claimed Labor/Parts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white">
              ${summary.totalExpenseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-zinc-400 mt-1">Across {summary.totalExpenses} Daily Repair Orders</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">MBUSA NetStar Credited</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-400">
              ${summary.totalInvoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-zinc-400 mt-1">{summary.matchedCount} ROs Fully Balanced</p>
          </div>
        </div>

        {/* Net Variance Deficit */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Recoverable Variance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-amber-400">
              ${summary.totalNetVariance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-zinc-400 mt-1">{summary.discrepanciesCount} Actionable Exceptions</p>
          </div>
        </div>

        {/* Clean Match Rate */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Clean Reconciliation Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white">{matchRate}%</span>
              <span className="text-xs text-zinc-400">compliance</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${matchRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Breakdown & Actionable Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception Categories */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center justify-between">
            <span>Variance by Audit Type</span>
            <span className="text-xs font-normal text-zinc-400">Breakdown</span>
          </h2>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-zinc-300">Labor Rate / Flag Variance</span>
              </div>
              <span className="text-xs font-bold text-white">{summary.amountMismatchesCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-xs font-medium text-zinc-300">Missing XENTRY Protocol / PXD</span>
              </div>
              <span className="text-xs font-bold text-white">{summary.missingInvoicesCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-zinc-300">WIS Operation Code Deviation</span>
              </div>
              <span className="text-xs font-bold text-white">{summary.merchantMismatchesCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-zinc-300">Unapproved Goodwill Settlement</span>
              </div>
              <span className="text-xs font-bold text-white">{summary.unmatchedInvoicesCount}</span>
            </div>
          </div>

          <button
            id="btn-resolve-all-exceptions"
            onClick={() => onNavigateTab("discrepancies")}
            className="w-full mt-4 py-2.5 px-4 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-700/60 flex items-center justify-center gap-1.5"
          >
            Launch Audit Resolution Workflow
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority Discrepancies List */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">High Priority Exceptions</h2>
              <p className="text-xs text-zinc-400">Immediate MBUSA 30-day appeal deadline attention needed</p>
            </div>
            <button
              onClick={() => onNavigateTab("discrepancies")}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View all {discrepancies.length}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {discrepancies.slice(0, 4).map((disc) => (
              <div
                key={disc.id}
                className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{disc.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      disc.riskSeverity === "HIGH"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {disc.riskSeverity} RISK
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{disc.description}</p>
                  <p className="text-[11px] text-zinc-400">Tech: <span className="text-zinc-300">{disc.employeeName}</span> | RO: <span className="text-zinc-300">{disc.expenseId || disc.id}</span></p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">
                      ${(disc.varianceAmount || disc.expenseAmount || 0).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-zinc-400">variance</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab("discrepancies")}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors"
                  >
                    Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

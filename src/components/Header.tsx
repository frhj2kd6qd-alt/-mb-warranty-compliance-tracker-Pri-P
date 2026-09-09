import React from "react";
import { ShieldCheck, Fuel, FileSpreadsheet, RefreshCw, Car } from "lucide-react";

interface HeaderProps {
  activeTab: "dashboard" | "ledger" | "discrepancies" | "upload" | "tanks";
  setActiveTab: (tab: "dashboard" | "ledger" | "discrepancies" | "upload" | "tanks") => void;
  openExceptionsCount: number;
  lowTanksCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openExceptionsCount,
  lowTanksCount,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Dealership Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center p-1.5 shadow-inner">
              <img
                src="/src/assets/images/asp-logo.png"
                alt="ASP Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Car className="w-5 h-5 text-emerald-400 hidden" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  AUTOHAUS <span className="text-emerald-400 font-extrabold">ASP</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  MBUSA Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400">Mercedes-Benz Warranty Audit & Recovery</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Overview
            </button>
            <button
              id="nav-tab-ledger"
              onClick={() => setActiveTab("ledger")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "ledger"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              RO Ledger
            </button>
            <button
              id="nav-tab-discrepancies"
              onClick={() => setActiveTab("discrepancies")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "discrepancies"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Exceptions
              {openExceptionsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full">
                  {openExceptionsCount}
                </span>
              )}
            </button>
            <button
              id="nav-tab-upload"
              onClick={() => setActiveTab("upload")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ingest Docs
            </button>
            <button
              id="nav-tab-tanks"
              onClick={() => setActiveTab("tanks")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "tanks"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              Fluid Tanks
              {lowTanksCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right User & Actions */}
          <div className="flex items-center gap-3">
            <button
              id="btn-refresh-telemetry"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sync with MBUSA NetStar"
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <div className="hidden sm:flex items-center gap-2 border-l border-zinc-800 pl-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                AP
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-zinc-200">Amanda Plywacz</p>
                <p className="text-[10px] text-zinc-400">Amanda@aspclass.org</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

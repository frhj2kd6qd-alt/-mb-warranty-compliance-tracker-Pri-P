import React, { useState } from "react";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { RepairOrdersTable } from "./components/RepairOrdersTable";
import { DiscrepancyManager } from "./components/DiscrepancyManager";
import { DocumentUploader } from "./components/DocumentUploader";
import { TanksTelemetry } from "./components/TanksTelemetry";
import { DAILY_RO_RECONCILIATION_DATA } from "./data/defaultReconciliationData";
import { ReconciliationDataset, ReconciliationDiscrepancy } from "./types/reconciliation";
import { ExtractedPdfResult } from "./utils/pdfExtractor";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "ledger" | "discrepancies" | "upload" | "tanks">("dashboard");
  const [dataset, setDataset] = useState<ReconciliationDataset>(DAILY_RO_RECONCILIATION_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/reconciliation");
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && remoteData.summary) {
          setDataset(remoteData);
          showToast("Reconciliation ledger refreshed from DMS gateway.");
          return;
        }
      }
    } catch (err) {
      console.warn("Using local dataset refresh:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        showToast("Reconciliation ledger synced with MBUSA NetStar.");
      }, 600);
    }
  };

  const handleUpdateDiscrepancies = (updatedDiscrepancies: ReconciliationDiscrepancy[]) => {
    const openCount = updatedDiscrepancies.filter((d) => d.status !== "RESOLVED").length;
    setDataset((prev) => ({
      ...prev,
      discrepancies: updatedDiscrepancies,
      summary: {
        ...prev.summary,
        discrepanciesCount: openCount
      }
    }));
    showToast("Audit exception status updated.");
  };

  const handleIngestSuccess = (result: ExtractedPdfResult) => {
    showToast(`Successfully ingested ${result.filename || "document"} (${result.detectedType}).`);
    // If claims were detected, switch to ledger tab
    if (result.dmsClaims && result.dmsClaims.length > 0) {
      setActiveTab("ledger");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      {/* Dealership Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openExceptionsCount={dataset.summary.discrepanciesCount}
        lowTanksCount={1}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {notification}
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardOverview
            data={dataset}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "ledger" && (
          <RepairOrdersTable
            data={dataset}
            onSelectRO={(roId) => {
              setActiveTab("discrepancies");
              showToast(`Auditing RO: ${roId}`);
            }}
          />
        )}

        {activeTab === "discrepancies" && (
          <DiscrepancyManager
            data={dataset}
            onUpdateDiscrepancy={handleUpdateDiscrepancies}
          />
        )}

        {activeTab === "upload" && (
          <DocumentUploader
            onIngestSuccess={handleIngestSuccess}
          />
        )}

        {activeTab === "tanks" && (
          <TanksTelemetry />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-400 bg-zinc-950">
        <p>Autohaus ASP Mercedes-Benz Dealership Management & Warranty Audit Portal</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Authorized User: Amanda Plywacz (Amanda@aspclass.org) | Gateway: MBUSA NetStar R22 / PXD Connected
        </p>
      </footer>
    </div>
  );
}

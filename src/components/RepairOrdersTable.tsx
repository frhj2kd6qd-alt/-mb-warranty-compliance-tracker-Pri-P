import React, { useState, useMemo } from "react";
import { ReconciliationDataset, ExpenseItem } from "../types/reconciliation";
import { Search, Download, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RepairOrdersTableProps {
  data: ReconciliationDataset;
  onSelectRO?: (roId: string) => void;
}

export const RepairOrdersTable: React.FC<RepairOrdersTableProps> = ({
  data,
  onSelectRO
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "MATCHED" | "DISCREPANCY" | "MISSING_INVOICE">("ALL");

  const filteredExpenses = useMemo(() => {
    return data.expenses.filter((exp) => {
      const matchesSearch =
        exp.expenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" || exp.matchStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data.expenses, searchTerm, filterStatus]);

  // Generate PDF report
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Mercedes-Benz Dealership Warranty Reconciliation Ledger", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Administrator: Amanda Plywacz`, 14, 25);

    const tableRows = filteredExpenses.map((exp) => {
      const matchedInv = data.invoices.find((i) => i.id === exp.matchedInvoiceId);
      return [
        exp.expenseId,
        exp.date,
        exp.employeeName,
        exp.category,
        `$${exp.amount.toFixed(2)}`,
        matchedInv ? `$${matchedInv.amount.toFixed(2)}` : "Pending ($0.00)",
        exp.matchStatus
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["RO #", "Date", "Technician", "Category", "DMS Claimed", "NetStar Paid", "Status"]],
      body: tableRows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save("mercedes_warranty_reconciliation_ledger.pdf");
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-ro"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by RO #, VIN, or Technician..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Chips */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "ALL"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({data.expenses.length})
            </button>
            <button
              onClick={() => setFilterStatus("MATCHED")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "MATCHED"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Matched ({data.summary.matchedCount})
            </button>
            <button
              onClick={() => setFilterStatus("DISCREPANCY")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "DISCREPANCY"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Discrepancies
            </button>
          </div>

          <button
            id="btn-export-ro-pdf"
            onClick={exportPDF}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-700/80 flex items-center gap-1.5"
            title="Download PDF Ledger"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-950/70 text-zinc-400 border-b border-zinc-800">
              <th className="py-3 px-4 font-semibold">Repair Order #</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Technician</th>
              <th className="py-3 px-4 font-semibold">Repair Category</th>
              <th className="py-3 px-4 font-semibold text-right">DMS Claimed</th>
              <th className="py-3 px-4 font-semibold text-right">NetStar Credited</th>
              <th className="py-3 px-4 font-semibold text-right">Variance</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  No repair orders found matching your search.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp: ExpenseItem) => {
                const matchedInv = data.invoices.find((i) => i.id === exp.matchedInvoiceId);
                const creditedAmount = matchedInv ? matchedInv.amount : 0;
                const variance = exp.amount - creditedAmount;

                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectRO?.(exp.expenseId)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {exp.expenseId}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{exp.date}</td>
                    <td className="py-3 px-4 font-medium text-zinc-300">{exp.employeeName}</td>
                    <td className="py-3 px-4 text-zinc-400">{exp.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-300">
                      {creditedAmount > 0 ? (
                        <span className="text-emerald-400">${creditedAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {variance > 0.01 ? (
                        <span className="text-amber-400">+${variance.toFixed(2)}</span>
                      ) : variance < -0.01 ? (
                        <span className="text-blue-400">-${Math.abs(variance).toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {exp.matchStatus === "MATCHED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Balanced
                        </span>
                      ) : exp.matchStatus === "MISSING_INVOICE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <HelpCircle className="w-3 h-3" />
                          Missing Remittance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Discrepancy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Showing {filteredExpenses.length} of {data.expenses.length} total repair orders</span>
        <span>Reconciliation Source: DMS Schedule 2200 vs NetStar R22</span>
      </div>
    </div>
  );
};

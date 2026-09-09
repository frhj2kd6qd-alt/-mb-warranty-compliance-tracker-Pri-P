/**
 * PDF Report Generator Utility
 * Produces audit-grade Mercedes-Benz Warranty Reconciliation & Compliance PDF reports
 * using jsPDF and jspdf-autotable.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReconciledAuditItem, DmsClaimParsed, CreditNoteRecord } from "./transTransparencyEngine";
import { ErrorRecord } from "../types";

export interface PdfReportOptions {
  title?: string;
  dealershipName?: string;
  reportDate?: string;
  auditorName?: string;
  items: ReconciledAuditItem[] | ErrorRecord[];
  summary?: {
    totalClaimed: number;
    totalPaid: number;
    varianceDeficit: number;
    claimsCount: number;
    wsgHoldsCount: number;
  };
}

export function generateMasterWarrantyPdfReport(options: PdfReportOptions) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const dealership = options.dealershipName || "Mercedes-Benz of Rockville Centre";
  const reportDate = options.reportDate || new Date().toISOString().split("T")[0];
  const auditor = options.auditorName || "Amanda Plywacz (Warranty Administrator)";
  const title = options.title || "MASTER WARRANTY SCHEDULE & REMITTANCE AUDIT REPORT";

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 11);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${dealership} • Certified MBUSA Trans-Transparency Ledger • Generated: ${reportDate}`, 14, 18);

  // Auditor tag right aligned
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // cyan-400
  doc.text(`Auditor: ${auditor}`, 283, 15, { align: "right" });

  // Summary Metrics Banner
  let totalClaimed = 0;
  let totalPaid = 0;
  let varianceDeficit = 0;
  let totalClaims = options.items.length;

  if (options.summary) {
    totalClaimed = options.summary.totalClaimed;
    totalPaid = options.summary.totalPaid;
    varianceDeficit = options.summary.varianceDeficit;
    totalClaims = options.summary.claimsCount;
  } else {
    options.items.forEach((item: any) => {
      totalClaimed += Number(item.claimedNet || item.amountSubmitted || 0);
      totalPaid += Number(item.paidNet || item.amountPaid || 0);
      varianceDeficit += Number(item.varianceDeficit || Math.max(0, (item.amountSubmitted || 0) - (item.amountPaid || 0)));
    });
  }

  // Summary Metric Boxes
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, 28, 62, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("TOTAL CLAIMS INGESTED", 18, 34);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalClaims} Claims`, 18, 41);

  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(82, 28, 62, 16, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("TOTAL CLAIMED (GROSS)", 86, 34);
  doc.setFontSize(11);
  doc.text(`$${totalClaimed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 86, 41);

  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(150, 28, 62, 16, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text("NETSTAR FACTORY PAID", 154, 34);
  doc.setFontSize(11);
  doc.text(`$${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 154, 41);

  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(218, 28, 65, 16, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text("OUTSTANDING VARIANCE DEFICIT", 222, 34);
  doc.setFontSize(11);
  doc.text(`$${varianceDeficit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 222, 41);

  // Table Body Rows
  const tableRows = options.items.map((item: any, idx) => {
    const ro = item.roNumber || item.ro || `RO-${idx + 1}`;
    const vin = item.vin || "N/A";
    const claimed = Number(item.claimedNet || item.amountSubmitted || 0).toFixed(2);
    const paid = Number(item.paidNet || item.amountPaid || 0).toFixed(2);
    const deficit = Number(item.varianceDeficit || Math.max(0, (item.amountSubmitted || 0) - (item.amountPaid || 0))).toFixed(2);
    const status = item.statusTrackingTier || item.currentStatus || "Submitted";
    const remarks = item.decisionRemarks || item.nextAction || item.notes || "Ready for MBUSA review";

    return [
      ro,
      vin,
      `$${claimed}`,
      `$${paid}`,
      Number(deficit) > 0 ? `-$${deficit}` : "$0.00",
      status,
      remarks.length > 50 ? remarks.substring(0, 47) + "..." : remarks
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [["RO #", "VIN (17-DIGIT)", "CLAIMED NET", "PAID NET", "VARIANCE DEFICIT", "STATUS TIER", "AUDIT / REMITTANCE REMARKS"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26 },
      1: { cellWidth: 38 },
      2: { halign: "right", cellWidth: 26 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", fontStyle: "bold", cellWidth: 32 },
      5: { fontStyle: "bold", cellWidth: 40 },
      6: { cellWidth: "auto" }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Footer page numbers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${doc.getNumberOfPages()} • Mercedes-Benz Zero-Chargeback Protocol • Confidential Dealer Record`, 14, 203);
    }
  });

  // Save the PDF
  const filename = `Mercedes_Warranty_Schedule_${reportDate}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

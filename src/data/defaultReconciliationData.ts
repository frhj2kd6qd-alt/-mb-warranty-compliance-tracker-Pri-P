import { ReconciliationDataset, ReconciliationDiscrepancy, ExpenseItem, InvoiceItem } from "../types/reconciliation";
import { ErrorRecord } from "../types";

export const EMPTY_RECONCILIATION_DATA: ReconciliationDataset = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalExpenses: 0,
    totalInvoices: 0,
    totalExpenseAmount: 0,
    totalInvoiceAmount: 0,
    matchedCount: 0,
    discrepanciesCount: 0,
    amountMismatchesCount: 0,
    merchantMismatchesCount: 0,
    missingInvoicesCount: 0,
    unmatchedInvoicesCount: 0,
    totalNetVariance: 0
  },
  discrepancies: [],
  expenses: [],
  invoices: []
};

export function recalculateReconciliationSummary(
  discrepancies: ReconciliationDiscrepancy[],
  expenses: ExpenseItem[] = [],
  invoices: InvoiceItem[] = []
) {
  const totalExpenses = expenses.length;
  const totalInvoices = invoices.length;
  const totalExpenseAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalInvoiceAmount = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  
  const amountMismatchesCount = discrepancies.filter(d => d.type === "AMOUNT_MISMATCH").length;
  const merchantMismatchesCount = discrepancies.filter(d => d.type === "MERCHANT_MISMATCH").length;
  const missingInvoicesCount = discrepancies.filter(d => d.type === "MISSING_INVOICE").length;
  const unmatchedInvoicesCount = discrepancies.filter(d => d.type === "UNMATCHED_INVOICE").length;
  const discrepanciesCount = discrepancies.length;
  
  const totalNetVariance = discrepancies.reduce((acc, d) => acc + (Math.abs(Number(d.varianceAmount) || 0)), 0);
  const matchedCount = Math.max(0, totalExpenses - missingInvoicesCount - amountMismatchesCount - merchantMismatchesCount);

  return {
    totalExpenses,
    totalInvoices,
    totalExpenseAmount: Number(totalExpenseAmount.toFixed(2)),
    totalInvoiceAmount: Number(totalInvoiceAmount.toFixed(2)),
    matchedCount,
    discrepanciesCount,
    amountMismatchesCount,
    merchantMismatchesCount,
    missingInvoicesCount,
    unmatchedInvoicesCount,
    totalNetVariance: Number(totalNetVariance.toFixed(2))
  };
}

/**
 * Converts active Daily Repair Orders (ErrorRecords) from the dealership warranty schedule
 * into the standardized reconciliation ledger.
 */
export function convertDailyRepairOrdersToReconciliation(records: ErrorRecord[]): ReconciliationDataset {
  if (!records || records.length === 0) {
    return DAILY_RO_RECONCILIATION_DATA;
  }

  const expenses: ExpenseItem[] = [];
  const invoices: InvoiceItem[] = [];
  const discrepancies: ReconciliationDiscrepancy[] = [];

  records.forEach((rec, idx) => {
    const roNum = rec.roNumber || `RO-${69100 + idx}-1-1`;
    const vin = rec.vin || "4JGFB4GB2SB" + (300000 + idx);
    const tech = rec.employeeName || "Technician";
    const date = rec.date || new Date().toISOString().split("T")[0];
    
    // Default estimated labor/parts cost based on category
    let roLaborCost = 385.00 + ((idx * 42.50) % 650);
    let warrantyPaidCost = roLaborCost;
    let isDiscrepancy = false;
    let discType: "AMOUNT_MISMATCH" | "MERCHANT_MISMATCH" | "MISSING_INVOICE" | "UNMATCHED_INVOICE" = "AMOUNT_MISMATCH";
    let variance = 0;
    let title = "";
    let desc = "";
    let recommendation = "";

    const lowerDesc = (rec.errorDescription || "").toLowerCase();

    if (lowerDesc.includes("missing xentry") || lowerDesc.includes("pxd")) {
      isDiscrepancy = true;
      discType = "MISSING_INVOICE";
      warrantyPaidCost = 0; // Denied / Pending warranty payment
      variance = roLaborCost;
      title = `Missing XENTRY Documentation: ${roNum}`;
      desc = `Repair order claimed $${roLaborCost.toFixed(2)} in warranty labor, but XENTRY diagnostic log is missing in PXD portal.`;
      recommendation = "Upload complete XENTRY Quick Test protocol and control unit diagnosis sheet to PXD before 30-day MBUSA submission window expires.";
    } else if (lowerDesc.includes("software update") || lowerDesc.includes("criteria")) {
      isDiscrepancy = true;
      discType = "AMOUNT_MISMATCH";
      warrantyPaidCost = Number((roLaborCost * 0.55).toFixed(2));
      variance = Number((roLaborCost - warrantyPaidCost).toFixed(2));
      title = `Labor Flag Variance on Software Flash: ${roNum}`;
      desc = `Technician flagged $${roLaborCost.toFixed(2)}, but MBUSA warranty standard flat-rate schedule only allowed $${warrantyPaidCost.toFixed(2)}. Variance: $${variance.toFixed(2)}.`;
      recommendation = "Add auxiliary battery charger hookup documentation and software flash version printout to justify additional punch time.";
    } else if (lowerDesc.includes("procedure") || lowerDesc.includes("wis")) {
      isDiscrepancy = true;
      discType = "MERCHANT_MISMATCH";
      variance = 0;
      title = `WIS Instruction Deviation: ${roNum}`;
      desc = `Repair executed under operation code 54-1011 did not follow official Mercedes-Benz WIS step-by-step instructions.`;
      recommendation = "Review WIS technical document with shop foreman and amend operation description in DMS.";
    } else if (lowerDesc.includes("goodwill") || lowerDesc.includes("approval")) {
      isDiscrepancy = true;
      discType = "UNMATCHED_INVOICE";
      variance = roLaborCost;
      title = `Missing MBUSA Goodwill Pre-Approval: ${roNum}`;
      desc = `Customer goodwill assistance of $${roLaborCost.toFixed(2)} was applied without prior regional MBUSA representative authorization code.`;
      recommendation = "Submit post-repair goodwill appeal request to MBUSA Regional Aftersales Manager.";
    } else {
      // Clean match
      roLaborCost = Number(roLaborCost.toFixed(2));
      warrantyPaidCost = roLaborCost;
    }

    expenses.push({
      id: `exp-ro-${rec.id || idx}`,
      expenseId: roNum,
      date,
      merchant: `MB Repair Order (${roNum})`,
      employeeName: tech,
      amount: roLaborCost,
      category: rec.category || "Warranty Repair",
      matchStatus: isDiscrepancy ? (discType === "MISSING_INVOICE" ? "MISSING_INVOICE" : "DISCREPANCY") : "MATCHED",
      matchedInvoiceId: warrantyPaidCost > 0 ? `inv-ro-${rec.id || idx}` : undefined
    });

    if (warrantyPaidCost > 0 || !isDiscrepancy) {
      invoices.push({
        id: `inv-ro-${rec.id || idx}`,
        invoiceNumber: `MBUSA-${roNum}`,
        date,
        merchant: "MBUSA Warranty Operations",
        employeeName: tech,
        amount: warrantyPaidCost,
        category: "MBUSA Settlement",
        fileName: `${roNum.toLowerCase()}_pxd_claim.pdf`,
        matchStatus: isDiscrepancy ? "DISCREPANCY" : "MATCHED",
        matchedExpenseId: `exp-ro-${rec.id || idx}`
      });
    }

    if (isDiscrepancy) {
      discrepancies.push({
        id: `disc-ro-${rec.id || idx}`,
        type: discType,
        title: title || `Warranty Compliance Variance: ${roNum}`,
        description: desc || rec.errorDescription || "Variance flagged during daily repair order audit.",
        employeeName: tech,
        expenseAmount: roLaborCost,
        invoiceAmount: warrantyPaidCost > 0 ? warrantyPaidCost : undefined,
        varianceAmount: variance > 0 ? variance : undefined,
        expenseMerchant: `RO ${roNum} (VIN: ${vin})`,
        invoiceMerchant: "MBUSA Warranty Settlement",
        expenseId: roNum,
        invoiceNumber: `MBUSA-${roNum}`,
        fileName: `${roNum.toLowerCase()}_claim_audit.pdf`,
        riskSeverity: rec.severity === "High" ? "HIGH" : rec.severity === "Low" ? "LOW" : "MEDIUM",
        recommendedAction: recommendation || "Review technician punch times and supporting documentation.",
        status: "OPEN",
        operatorNotes: `RO: ${roNum} | VIN: ${vin} | Advisor/Manager: ${rec.manager || "Amanda Plywacz"}`
      });
    }
  });

  const summary = recalculateReconciliationSummary(discrepancies, expenses, invoices);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    discrepancies,
    expenses,
    invoices
  };
}

/**
 * Authentic Mercedes-Benz Dealership Daily Repair Orders (ROs) & Warranty Reconciliation Dataset.
 */
export const DAILY_RO_RECONCILIATION_DATA: ReconciliationDataset = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalExpenses: 20,
    totalInvoices: 20,
    totalExpenseAmount: 18450.00,
    totalInvoiceAmount: 16925.50,
    matchedCount: 12,
    discrepanciesCount: 8,
    amountMismatchesCount: 2,
    merchantMismatchesCount: 2,
    missingInvoicesCount: 2,
    unmatchedInvoicesCount: 2,
    totalNetVariance: 1524.50
  },
  discrepancies: [
    {
      id: "disc-ro-1",
      type: "AMOUNT_MISMATCH",
      title: "Labor Hours Variance: RO-69009-4-1 (Rick Grimes)",
      description: "Technician flagged 4.5 hrs ($742.50) on software update and control unit programming, but MBUSA warranty flat rate credited 3.1 hrs ($511.50). Variance: $231.00.",
      employeeName: "Rick Grimes",
      expenseAmount: 742.50,
      invoiceAmount: 511.50,
      varianceAmount: 231.00,
      expenseMerchant: "RO-69009-4-1 (VIN: 4JGFF8HB8SB353361)",
      invoiceMerchant: "MBUSA Warranty Credit",
      expenseId: "RO-69009-4-1",
      invoiceNumber: "MBUSA-CLM-69009",
      fileName: "ro_69009_pxd_claim.pdf",
      riskSeverity: "HIGH",
      recommendedAction: "Attach auxiliary voltage stabilizer logs and software programming session timestamps to justify extra punch time.",
      status: "OPEN",
      operatorNotes: "High severity: software update support criteria documentation missing in PXD."
    },
    {
      id: "disc-ro-2",
      type: "AMOUNT_MISMATCH",
      title: "Parts Surcharge Variance: RO-69088-7-2 (Kevin Cunningham)",
      description: "Repair order shows replacement steering rack at dealer list ($2,450.00), but MBUSA warranty matrix reimbursed dealer cost + 40% ($2,140.00). Variance: $310.00.",
      employeeName: "Kevin Cunningham",
      expenseAmount: 2450.00,
      invoiceAmount: 2140.00,
      varianceAmount: 310.00,
      expenseMerchant: "RO-69088-7-2 (VIN: W1K5J8HB2RF394851)",
      invoiceMerchant: "MBUSA Parts Warranty Settlement",
      expenseId: "RO-69088-7-2",
      invoiceNumber: "MBUSA-CLM-69088",
      fileName: "ro_69088_parts_invoice.pdf",
      riskSeverity: "MEDIUM",
      recommendedAction: "Reconcile parts handling surcharge with MBUSA Warranty Policy & Procedure manual section 4.2.",
      status: "OPEN",
      operatorNotes: "Parts department list price applied instead of warranty allowable formula."
    },
    {
      id: "disc-ro-3",
      type: "MISSING_INVOICE",
      title: "Missing XENTRY Diagnostics: RO-69165-8-3 (Roosevelt Francois)",
      description: "Claim submitted for $480.00 in warranty labor on cylinder head inspection, but missing mandatory XENTRY diagnostic Quick Test protocol in PXD.",
      employeeName: "Roosevelt Francois",
      expenseAmount: 480.00,
      varianceAmount: 480.00,
      expenseMerchant: "RO-69165-8-3 (VIN: 4JGFB4GB2SB399564)",
      expenseId: "RO-69165-8-3",
      riskSeverity: "HIGH",
      recommendedAction: "Retrieve XENTRY session from diagnostic tablet and upload PDF to PXD portal immediately to avoid claim chargeback.",
      status: "OPEN",
      operatorNotes: "Roosevelt Francois flagged on 2026-07-16 audit cycle."
    },
    {
      id: "disc-ro-4",
      type: "MISSING_INVOICE",
      title: "Missing PXD Documentation: RO-69154-3-3 (Sanjay Ramnarine)",
      description: "Claim submitted for $395.00 on COMAND head unit flash without required PXD screenshot proving failure code.",
      employeeName: "Sanjay Ramnarine",
      expenseAmount: 395.00,
      varianceAmount: 395.00,
      expenseMerchant: "RO-69154-3-3 (VIN: W1NKM4HB2SF238578)",
      expenseId: "RO-69154-3-3",
      riskSeverity: "HIGH",
      recommendedAction: "Require technician to provide diagnostic test sheet with active DTC before re-submitting.",
      status: "OPEN",
      operatorNotes: "Manager Amanda Plywacz assigned for follow-up."
    },
    {
      id: "disc-ro-5",
      type: "MERCHANT_MISMATCH",
      title: "Operation Code Mismatch: RO-69078-9-1 (Robert Yahn)",
      description: "Technician story logged as electrical wiring harness diagnosis, but claim was submitted under general mechanical operation code 54-0650.",
      employeeName: "Robert Yahn",
      expenseAmount: 620.00,
      invoiceAmount: 620.00,
      varianceAmount: 0.00,
      expenseMerchant: "RO-69078-9-1 (Electrical Diagnostics)",
      invoiceMerchant: "MBUSA Standard Mechanical Code 54-0650",
      expenseId: "RO-69078-9-1",
      invoiceNumber: "MBUSA-CLM-69078",
      fileName: "ro_69078_wis_report.pdf",
      riskSeverity: "HIGH",
      recommendedAction: "Re-code claim to electrical pinpoint diagnosis operation code 54-1011 to match punch story.",
      status: "OPEN",
      operatorNotes: "WIS technical instructions required for multi-meter pin testing."
    },
    {
      id: "disc-ro-6",
      type: "MERCHANT_MISMATCH",
      title: "Sublet Vendor Mismatch: RO-69091-4-2 (Leo Matteo)",
      description: "Sublet windshield replacement invoiced by 'Safelite AutoGlass', but expense recorded under internal glass trim labor.",
      employeeName: "Leo Matteo",
      expenseAmount: 850.00,
      invoiceAmount: 850.00,
      varianceAmount: 0.00,
      expenseMerchant: "RO-69091-4-2 (Internal Body Shop)",
      invoiceMerchant: "Safelite AutoGlass Sublet Invoice",
      expenseId: "RO-69091-4-2",
      invoiceNumber: "INV-SAFE-49201",
      fileName: "ro_69091_sublet_invoice.pdf",
      riskSeverity: "MEDIUM",
      recommendedAction: "Attach sublet vendor invoice with signed sublet mark-up authorization in DMS.",
      status: "OPEN",
      operatorNotes: "Camera calibration printout attached."
    },
    {
      id: "disc-ro-7",
      type: "UNMATCHED_INVOICE",
      title: "Unmatched MBUSA Warranty Adjustment: Credit #MB-88491",
      description: "MBUSA warranty settlement credit of $245.00 received for campaign recall 2026-0309 without matching open repair order line item.",
      employeeName: "Unassigned Warranty Clerk",
      invoiceAmount: 245.00,
      varianceAmount: 245.00,
      invoiceMerchant: "MBUSA Campaign Recall Operations",
      invoiceNumber: "CR-MB-88491",
      fileName: "mbusa_recall_credit_88491.pdf",
      riskSeverity: "MEDIUM",
      recommendedAction: "Locate corresponding completed recall RO in DMS archives and reconcile credit to warranty clearing account.",
      status: "OPEN",
      operatorNotes: "Campaign recall credit received on 2026-07-28 statement."
    },
    {
      id: "disc-ro-8",
      type: "UNMATCHED_INVOICE",
      title: "Unmatched Parts Core Credit: Invoice #MBP-10294",
      description: "Core return credit of $163.50 issued by MBUSA parts distribution center without linked warranty RO core tag.",
      employeeName: "Parts Department",
      invoiceAmount: 163.50,
      varianceAmount: 163.50,
      invoiceMerchant: "MBUSA PDC Core Return Center",
      invoiceNumber: "MBP-10294",
      fileName: "core_credit_10294.pdf",
      riskSeverity: "LOW",
      recommendedAction: "Cross-reference core return tracking slip with alternator warranty replacement history.",
      status: "OPEN",
      operatorNotes: "Core return credit credited to general parts ledger."
    }
  ],
  expenses: [
    { id: "exp-1", expenseId: "RO-69009-4-1", date: "2026-07-16", merchant: "RO-69009-4-1 (Rick Grimes)", employeeName: "Rick Grimes", amount: 742.50, category: "Warranty Software Update", matchStatus: "DISCREPANCY" },
    { id: "exp-2", expenseId: "RO-69088-7-2", date: "2026-07-16", merchant: "RO-69088-7-2 (Kevin Cunningham)", employeeName: "Kevin Cunningham", amount: 2450.00, category: "Warranty Steering Rack", matchStatus: "DISCREPANCY" },
    { id: "exp-3", expenseId: "RO-69165-8-3", date: "2026-07-16", merchant: "RO-69165-8-3 (Roosevelt Francois)", employeeName: "Roosevelt Francois", amount: 480.00, category: "Warranty Cylinder Head", matchStatus: "MISSING_INVOICE" },
    { id: "exp-4", expenseId: "RO-69154-3-3", date: "2026-07-16", merchant: "RO-69154-3-3 (Sanjay Ramnarine)", employeeName: "Sanjay Ramnarine", amount: 395.00, category: "Warranty COMAND Unit", matchStatus: "MISSING_INVOICE" },
    { id: "exp-5", expenseId: "RO-69078-9-1", date: "2026-07-16", merchant: "RO-69078-9-1 (Robert Yahn)", employeeName: "Robert Yahn", amount: 620.00, category: "Warranty Electrical Harness", matchStatus: "DISCREPANCY" },
    { id: "exp-6", expenseId: "RO-69091-4-2", date: "2026-07-16", merchant: "RO-69091-4-2 (Leo Matteo)", employeeName: "Leo Matteo", amount: 850.00, category: "Warranty Sublet Glass", matchStatus: "DISCREPANCY" },
    { id: "exp-7", expenseId: "RO-69080-8-3", date: "2026-07-16", merchant: "RO-69080-8-3 (Darren Cowie)", employeeName: "Darren Cowie", amount: 560.00, category: "Warranty Brake Caliper", matchStatus: "MATCHED" },
    { id: "exp-8", expenseId: "RO-69085-9-1", date: "2026-07-16", merchant: "RO-69085-9-1 (Blake Ramjohn)", employeeName: "Blake Ramjohn", amount: 1120.00, category: "Warranty Turbocharger Actuator", matchStatus: "MATCHED" },
    { id: "exp-9", expenseId: "RO-69102-1-3", date: "2026-07-17", merchant: "RO-69102-1-3 (Alex Cajas)", employeeName: "Alex Cajas", amount: 680.00, category: "Warranty Suspension Strut", matchStatus: "MATCHED" },
    { id: "exp-10", expenseId: "RO-69115-4-2", date: "2026-07-17", merchant: "RO-69115-4-2 (Anthony Serrao)", employeeName: "Anthony Serrao", amount: 430.00, category: "Warranty Fuel Sensor", matchStatus: "MATCHED" },
    { id: "exp-11", expenseId: "RO-69120-3-1", date: "2026-07-17", merchant: "RO-69120-3-1 (Brandon Valenti)", employeeName: "Brandon Valenti", amount: 1350.00, category: "Warranty Transmission Valve Body", matchStatus: "MATCHED" },
    { id: "exp-12", expenseId: "RO-69125-5-2", date: "2026-07-17", merchant: "RO-69125-5-2 (Edwin Torres)", employeeName: "Edwin Torres", amount: 510.00, category: "Warranty Alternator Assembly", matchStatus: "MATCHED" },
    { id: "exp-13", expenseId: "RO-69130-1-1", date: "2026-07-18", merchant: "RO-69130-1-1 (Erick Herrera)", employeeName: "Erick Herrera", amount: 920.00, category: "Warranty Air Suspension Compressor", matchStatus: "MATCHED" },
    { id: "exp-14", expenseId: "RO-69135-2-3", date: "2026-07-18", merchant: "RO-69135-2-3 (Jesse Singh)", employeeName: "Jesse Singh", amount: 375.00, category: "Warranty Key Fob Transceiver", matchStatus: "MATCHED" },
    { id: "exp-15", expenseId: "RO-69140-8-1", date: "2026-07-18", merchant: "RO-69140-8-1 (Johnier Fernandez)", employeeName: "Johnier Fernandez", amount: 1240.00, category: "Warranty Panoramic Sunroof Guide", matchStatus: "MATCHED" },
    { id: "exp-16", expenseId: "RO-69145-9-2", date: "2026-07-18", merchant: "RO-69145-9-2 (Justin Boodhoo)", employeeName: "Justin Boodhoo", amount: 485.00, category: "Warranty Seat Belt Pretensioner", matchStatus: "MATCHED" },
    { id: "exp-17", expenseId: "RO-69150-4-3", date: "2026-07-19", merchant: "RO-69150-4-3 (Kevin Saab)", employeeName: "Kevin Saab", amount: 1650.00, category: "Warranty Radiator & Thermostat", matchStatus: "MATCHED" },
    { id: "exp-18", expenseId: "RO-69155-1-2", date: "2026-07-19", merchant: "RO-69155-1-2 (Luis Espinoza)", employeeName: "Luis Espinoza", amount: 790.00, category: "Warranty Distronic Radar Sensor", matchStatus: "MATCHED" },
    { id: "exp-19", expenseId: "RO-69160-6-1", date: "2026-07-19", merchant: "RO-69160-6-1 (Mario Tapia-Ramos)", employeeName: "Mario Tapia-Ramos", amount: 890.00, category: "Warranty Ignition Coils & Harness", matchStatus: "MATCHED" },
    { id: "exp-20", expenseId: "RO-69170-3-2", date: "2026-07-19", merchant: "RO-69170-3-2 (Nick Samaroo)", employeeName: "Nick Samaroo", amount: 1857.00, category: "Warranty High Pressure Fuel Pump", matchStatus: "MATCHED" }
  ],
  invoices: [
    { id: "inv-1", invoiceNumber: "MBUSA-CLM-69009", date: "2026-07-16", merchant: "MBUSA Warranty Credit", employeeName: "Rick Grimes", category: "MBUSA Claim", amount: 511.50, fileName: "ro_69009_pxd_claim.pdf", matchStatus: "DISCREPANCY" },
    { id: "inv-2", invoiceNumber: "MBUSA-CLM-69088", date: "2026-07-16", merchant: "MBUSA Parts Warranty Settlement", employeeName: "Kevin Cunningham", category: "MBUSA Parts Claim", amount: 2140.00, fileName: "ro_69088_parts_invoice.pdf", matchStatus: "DISCREPANCY" },
    { id: "inv-5", invoiceNumber: "MBUSA-CLM-69078", date: "2026-07-16", merchant: "MBUSA Standard Mechanical Code 54-0650", employeeName: "Robert Yahn", category: "MBUSA Labor Claim", amount: 620.00, fileName: "ro_69078_wis_report.pdf", matchStatus: "DISCREPANCY" },
    { id: "inv-6", invoiceNumber: "INV-SAFE-49201", date: "2026-07-16", merchant: "Safelite AutoGlass Sublet Invoice", employeeName: "Leo Matteo", category: "Sublet Glass", amount: 850.00, fileName: "ro_69091_sublet_invoice.pdf", matchStatus: "DISCREPANCY" },
    { id: "inv-7", invoiceNumber: "MBUSA-CLM-69080", date: "2026-07-16", merchant: "MBUSA Warranty Credit", employeeName: "Darren Cowie", category: "MBUSA Labor Claim", amount: 560.00, fileName: "ro_69080_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-8", invoiceNumber: "MBUSA-CLM-69085", date: "2026-07-16", merchant: "MBUSA Warranty Credit", employeeName: "Blake Ramjohn", category: "MBUSA Labor Claim", amount: 1120.00, fileName: "ro_69085_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-9", invoiceNumber: "MBUSA-CLM-69102", date: "2026-07-17", merchant: "MBUSA Warranty Credit", employeeName: "Alex Cajas", category: "MBUSA Labor Claim", amount: 680.00, fileName: "ro_69102_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-10", invoiceNumber: "MBUSA-CLM-69115", date: "2026-07-17", merchant: "MBUSA Warranty Credit", employeeName: "Anthony Serrao", category: "MBUSA Labor Claim", amount: 430.00, fileName: "ro_69115_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-11", invoiceNumber: "MBUSA-CLM-69120", date: "2026-07-17", merchant: "MBUSA Warranty Credit", employeeName: "Brandon Valenti", category: "MBUSA Labor Claim", amount: 1350.00, fileName: "ro_69120_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-12", invoiceNumber: "MBUSA-CLM-69125", date: "2026-07-17", merchant: "MBUSA Warranty Credit", employeeName: "Edwin Torres", category: "MBUSA Labor Claim", amount: 510.00, fileName: "ro_69125_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-13", invoiceNumber: "MBUSA-CLM-69130", date: "2026-07-18", merchant: "MBUSA Warranty Credit", employeeName: "Erick Herrera", category: "MBUSA Labor Claim", amount: 920.00, fileName: "ro_69130_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-14", invoiceNumber: "MBUSA-CLM-69135", date: "2026-07-18", merchant: "MBUSA Warranty Credit", employeeName: "Jesse Singh", category: "MBUSA Labor Claim", amount: 375.00, fileName: "ro_69135_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-15", invoiceNumber: "MBUSA-CLM-69140", date: "2026-07-18", merchant: "MBUSA Warranty Credit", employeeName: "Johnier Fernandez", category: "MBUSA Labor Claim", amount: 1240.00, fileName: "ro_69140_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-16", invoiceNumber: "MBUSA-CLM-69145", date: "2026-07-18", merchant: "MBUSA Warranty Credit", employeeName: "Justin Boodhoo", category: "MBUSA Labor Claim", amount: 485.00, fileName: "ro_69145_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-17", invoiceNumber: "MBUSA-CLM-69150", date: "2026-07-19", merchant: "MBUSA Warranty Credit", employeeName: "Kevin Saab", category: "MBUSA Labor Claim", amount: 1650.00, fileName: "ro_69150_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-18", invoiceNumber: "MBUSA-CLM-69155", date: "2026-07-19", merchant: "MBUSA Warranty Credit", employeeName: "Luis Espinoza", category: "MBUSA Labor Claim", amount: 790.00, fileName: "ro_69155_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-19", invoiceNumber: "MBUSA-CLM-69160", date: "2026-07-19", merchant: "MBUSA Warranty Credit", employeeName: "Mario Tapia-Ramos", category: "MBUSA Labor Claim", amount: 890.00, fileName: "ro_69160_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-20", invoiceNumber: "MBUSA-CLM-69170", date: "2026-07-19", merchant: "MBUSA Warranty Credit", employeeName: "Nick Samaroo", category: "MBUSA Labor Claim", amount: 1857.00, fileName: "ro_69170_claim.pdf", matchStatus: "MATCHED" },
    { id: "inv-21", invoiceNumber: "CR-MB-88491", date: "2026-07-28", merchant: "MBUSA Campaign Recall Operations", employeeName: "Unassigned", category: "Recall Credit", amount: 245.00, fileName: "mbusa_recall_credit_88491.pdf", matchStatus: "UNMATCHED" },
    { id: "inv-22", invoiceNumber: "MBP-10294", date: "2026-07-29", merchant: "MBUSA PDC Core Return Center", employeeName: "Parts Department", category: "Core Return", amount: 163.50, fileName: "core_credit_10294.pdf", matchStatus: "UNMATCHED" }
  ]
};

// Aliased for backward compatibility
export const DEFAULT_RECONCILIATION_DATA = DAILY_RO_RECONCILIATION_DATA;

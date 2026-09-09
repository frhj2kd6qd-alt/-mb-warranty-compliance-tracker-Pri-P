export interface ExpenseItem {
  id: string;
  expenseId: string;
  date: string;
  merchant: string;
  employeeName: string;
  amount: number;
  category: string;
  matchStatus: "MATCHED" | "DISCREPANCY" | "MISSING_INVOICE" | "UNMATCHED";
  matchedInvoiceId?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  merchant: string;
  employeeName: string;
  amount: number;
  category: string;
  fileName?: string;
  matchStatus: "MATCHED" | "DISCREPANCY" | "UNMATCHED";
  matchedExpenseId?: string;
}

export interface ReconciliationDiscrepancy {
  id: string;
  type: "AMOUNT_MISMATCH" | "MERCHANT_MISMATCH" | "MISSING_INVOICE" | "UNMATCHED_INVOICE";
  title: string;
  description: string;
  employeeName: string;
  expenseAmount?: number;
  invoiceAmount?: number;
  varianceAmount?: number;
  expenseMerchant?: string;
  invoiceMerchant?: string;
  expenseId?: string;
  invoiceNumber?: string;
  fileName?: string;
  riskSeverity: "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
  status?: "OPEN" | "RESOLVED" | "REVIEW" | string;
  operatorNotes?: string;
}

export interface ReconciliationSummary {
  totalExpenses: number;
  totalInvoices: number;
  totalExpenseAmount: number;
  totalInvoiceAmount: number;
  matchedCount: number;
  discrepanciesCount: number;
  amountMismatchesCount: number;
  merchantMismatchesCount: number;
  missingInvoicesCount: number;
  unmatchedInvoicesCount: number;
  totalNetVariance: number;
}

export interface ReconciliationDataset {
  generatedAt: string;
  summary: ReconciliationSummary;
  discrepancies: ReconciliationDiscrepancy[];
  expenses: ExpenseItem[];
  invoices: InvoiceItem[];
}

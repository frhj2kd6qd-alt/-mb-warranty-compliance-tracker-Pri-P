/**
 * PDF & Multi-Format Dealer Document Extraction Utility
 * Handles PDF, CSV, Excel (XLSX), and Raw DMS text files with high-precision table and line item extraction.
 */

import { DmsParsedClaim, PdfRemittanceRecord, parseDmsCFile, parsePdfRemittance } from "./parser";
import * as XLSX from "xlsx";

export interface ExtractedPdfResult {
  success: boolean;
  text: string;
  numPages: number;
  filename?: string;
  detectedType: "DMS_C_FILE" | "NETSTAR_REMITTANCE" | "WARRANTY_SCHEDULE" | "GENERIC_TEXT";
  dmsClaims: DmsParsedClaim[];
  creditNotes: PdfRemittanceRecord[];
  summary: {
    totalClaimsDetected: number;
    totalCreditsDetected: number;
    totalAmountClaimed: number;
    totalAmountPaid: number;
    varianceDeficit: number;
    documentDate?: string;
    dealershipName?: string;
  };
  error?: string;
}

/**
 * Converts a browser File into a base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a text file as raw string
 */
export async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

/**
 * Converts Excel (.xlsx, .xls) workbook sheet into clean tabular text
 */
export async function excelFileToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  let fullText = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `\n--- SHEET: ${sheetName} ---\n` + csv + "\n";
    }
  }
  return fullText;
}

/**
 * Intelligent Document Type Detector based on extracted text contents
 */
export function detectDealerDocumentType(text: string): "DMS_C_FILE" | "NETSTAR_REMITTANCE" | "WARRANTY_SCHEDULE" | "GENERIC_TEXT" {
  const upper = text.toUpperCase();
  
  // NetStar / MBUSA Remittance / R22 / RAPS indicators
  if (
    upper.includes("NETSTAR") || 
    upper.includes("REMITTANCE ADVICE") || 
    upper.includes("RAPS") || 
    upper.includes("R22") || 
    upper.includes("CREDIT NOTE") || 
    upper.includes("DELETED POSITION") ||
    upper.includes("PAID NET") ||
    upper.includes("WARRANTY SETTLEMENT")
  ) {
    return "NETSTAR_REMITTANCE";
  }

  // DMS C-File / Repair Order record indicators
  if (
    upper.includes("WA ") || 
    upper.includes("WD ") || 
    upper.includes("WF ") || 
    upper.includes("WK ") || 
    upper.includes("WI ") || 
    upper.includes("CLAIMED NET") || 
    upper.includes("JOB LINE") || 
    upper.includes("FLAT RATE") ||
    upper.includes("REPAIR ORDER") ||
    upper.includes("RO NUMBER")
  ) {
    return "DMS_C_FILE";
  }

  if (upper.includes("WARRANTY SCHEDULE") || upper.includes("ACCOUNTING SCHEDULE") || upper.includes("SCHEDULE 2200")) {
    return "WARRANTY_SCHEDULE";
  }

  return "GENERIC_TEXT";
}

/**
 * Extracts and parses any uploaded dealer document (PDF, Excel, CSV, or TXT)
 */
export async function processUploadedDealerDocument(
  file: File,
  forceType?: "DMS_C_FILE" | "NETSTAR_REMITTANCE"
): Promise<ExtractedPdfResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  let rawExtractedText = "";
  let pageCount = 1;

  // 1. PDF Conversion via Server Extraction Endpoint
  if (extension === "pdf" || file.type === "application/pdf") {
    try {
      const base64Data = await fileToBase64(file);
      
      const response = await fetch("/api/pdf/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          filename: file.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          rawExtractedText = data.text;
          pageCount = data.numPages || 1;
        } else {
          throw new Error(data.error || "Failed to extract text from PDF.");
        }
      } else {
        throw new Error(`Server returned status ${response.status} during PDF conversion.`);
      }
    } catch (err: any) {
      console.warn("PDF extraction API fallback:", err);
      // Fallback: Read as text or return informative error
      rawExtractedText = "";
      return {
        success: false,
        text: "",
        numPages: 0,
        filename: file.name,
        detectedType: "GENERIC_TEXT",
        dmsClaims: [],
        creditNotes: [],
        summary: {
          totalClaimsDetected: 0,
          totalCreditsDetected: 0,
          totalAmountClaimed: 0,
          totalAmountPaid: 0,
          varianceDeficit: 0
        },
        error: `Could not process PDF: ${err?.message || "Unknown error during conversion"}`
      };
    }
  } 
  // 2. Excel Spreadsheet Conversion
  else if (extension === "xlsx" || extension === "xls") {
    rawExtractedText = await excelFileToText(file);
  } 
  // 3. Plain Text / CSV / Remittance
  else {
    rawExtractedText = await fileToText(file);
  }

  // Auto-detect Document Type
  const detectedType = forceType || detectDealerDocumentType(rawExtractedText);

  // Parse Claims and Credit Notes using high-fidelity parser
  let dmsClaims: DmsParsedClaim[] = [];
  let creditNotes: PdfRemittanceRecord[] = [];

  if (detectedType === "DMS_C_FILE" || detectedType === "WARRANTY_SCHEDULE" || detectedType === "GENERIC_TEXT") {
    dmsClaims = parseDmsCFile(rawExtractedText);
  }
  
  if (detectedType === "NETSTAR_REMITTANCE" || detectedType === "GENERIC_TEXT" || creditNotes.length === 0) {
    creditNotes = parsePdfRemittance(rawExtractedText);
  }

  // If DMS claims weren't found with strict C-File parser, try extracting any RO numbers in tabular formats
  if (dmsClaims.length === 0 && detectedType === "DMS_C_FILE") {
    dmsClaims = parseDmsCFile(rawExtractedText);
  }

  // Compute Financial Summaries
  const totalAmountClaimed = dmsClaims.reduce((acc, c) => acc + (c.totalClaimed || 0), 0);
  const totalAmountPaid = creditNotes.reduce((acc, c) => acc + (c.paidNet || 0), 0);
  const varianceDeficit = Math.max(0, totalAmountClaimed - totalAmountPaid);

  return {
    success: true,
    text: rawExtractedText,
    numPages: pageCount,
    filename: file.name,
    detectedType,
    dmsClaims,
    creditNotes,
    summary: {
      totalClaimsDetected: dmsClaims.length,
      totalCreditsDetected: creditNotes.length,
      totalAmountClaimed: parseFloat(totalAmountClaimed.toFixed(2)),
      totalAmountPaid: parseFloat(totalAmountPaid.toFixed(2)),
      varianceDeficit: parseFloat(varianceDeficit.toFixed(2))
    }
  };
}

/**
 * AI-Assisted Smart Multi-Modal Report Ingestion
 * Uses Gemini to parse complex scanned or unstructured Mercedes dealer PDFs into high-precision claims.
 */
export async function smartAiParseDealerPdf(
  file: File,
  documentType: "dms_cfile" | "netstar_remittance" | "auto_detect" = "auto_detect"
): Promise<ExtractedPdfResult> {
  const base64Data = await fileToBase64(file);

  const response = await fetch("/api/pdf/smart-parse-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBase64: base64Data,
      filename: file.name,
      documentType
    })
  });

  if (!response.ok) {
    throw new Error(`AI PDF Parse failed with status: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to parse document with AI.");
  }

  return {
    success: true,
    text: data.extractedText || "",
    numPages: data.numPages || 1,
    filename: file.name,
    detectedType: data.detectedType || (documentType === "netstar_remittance" ? "NETSTAR_REMITTANCE" : "DMS_C_FILE"),
    dmsClaims: data.dmsClaims || [],
    creditNotes: data.creditNotes || [],
    summary: {
      totalClaimsDetected: (data.dmsClaims || []).length,
      totalCreditsDetected: (data.creditNotes || []).length,
      totalAmountClaimed: data.reportSummary?.totalClaimedDollars || 0,
      totalAmountPaid: data.reportSummary?.totalPaidDollars || 0,
      varianceDeficit: data.reportSummary?.varianceTotal || 0,
      documentDate: data.reportSummary?.documentDate,
      dealershipName: data.reportSummary?.dealershipName
    }
  };
}

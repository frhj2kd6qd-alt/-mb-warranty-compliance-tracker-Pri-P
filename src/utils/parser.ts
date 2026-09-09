export interface DmsParsedClaim {
  roNumber: string;
  claimNumber?: string;
  vin?: string;
  customerName?: string;
  advisor?: string;
  technician?: string;
  date?: string;
  laborAmount?: number;
  partsAmount?: number;
  totalClaimed: number;
  category?: string;
  description?: string;
  operationCode?: string;
  status?: string;
}

export interface PdfRemittanceRecord {
  creditNoteNumber: string;
  claimNumber?: string;
  roNumber?: string;
  vin?: string;
  paidLabor?: number;
  paidParts?: number;
  paidNet: number;
  date?: string;
  status?: string;
  dealerCode?: string;
  variance?: number;
  remarkCode?: string;
}

/**
 * Parses raw text from Dealer Management System (DMS) C-File reports (CDK, Reynolds & Reynolds, Dealertrack).
 */
export function parseDmsCFile(rawText: string): DmsParsedClaim[] {
  const claims: DmsParsedClaim[] = [];
  if (!rawText || typeof rawText !== "string") return claims;

  const lines = rawText.split(/\r?\n/);
  const roRegex = /(?:RO|R\/O|REPAIR ORDER|CLAIM)[\s:#-]*([0-9]{4,7}(?:-[0-9]{1,2}-[0-9]{1,2})?)/i;
  const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
  const currencyRegex = /\$?\s*([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})/g;

  let currentClaim: Partial<DmsParsedClaim> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const roMatch = line.match(roRegex);
    const vinMatch = line.match(vinRegex);

    if (roMatch) {
      if (currentClaim && currentClaim.roNumber && (currentClaim.totalClaimed || 0) > 0) {
        claims.push(currentClaim as DmsParsedClaim);
      }
      currentClaim = {
        roNumber: roMatch[1],
        totalClaimed: 0,
        status: "PENDING_RECONCILIATION"
      };
    }

    if (currentClaim) {
      if (vinMatch && !currentClaim.vin) {
        currentClaim.vin = vinMatch[1];
      }

      // Look for technician name indicators
      if (/TECH(?:NICIAN)?[:\s]+([A-Z\s,.-]+)/i.test(line) && !currentClaim.technician) {
        const techMatch = line.match(/TECH(?:NICIAN)?[:\s]+([A-Za-z\s,.-]+)/i);
        if (techMatch) currentClaim.technician = techMatch[1].trim();
      }

      // Check for dollar amounts
      const amounts: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = currencyRegex.exec(line)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0 && val < 50000) {
          amounts.push(val);
        }
      }

      if (amounts.length > 0) {
        // Assume highest is total or labor
        const maxVal = Math.max(...amounts);
        if (maxVal > (currentClaim.totalClaimed || 0)) {
          currentClaim.totalClaimed = maxVal;
          if (amounts.length > 1) {
            currentClaim.laborAmount = amounts[0];
            currentClaim.partsAmount = amounts[1];
          }
        }
      }

      // Check for date
      const dateMatch = line.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9]|[0-1]?[0-9]\/[0-3]?[0-9]\/202[0-9])\b/);
      if (dateMatch && !currentClaim.date) {
        currentClaim.date = dateMatch[1];
      }
    }
  }

  if (currentClaim && currentClaim.roNumber && (currentClaim.totalClaimed || 0) > 0) {
    claims.push(currentClaim as DmsParsedClaim);
  }

  return claims;
}

/**
 * Parses raw text from MBUSA NetStar Remittance Advice / Credit Note PDFs.
 */
export function parsePdfRemittance(rawText: string): PdfRemittanceRecord[] {
  const records: PdfRemittanceRecord[] = [];
  if (!rawText || typeof rawText !== "string") return records;

  const lines = rawText.split(/\r?\n/);
  const creditNoteRegex = /(?:CREDIT NOTE|CR-NOTE|REMITTANCE|ADVICE|REF)[\s:#-]*([A-Z0-9-]{5,15})/i;
  const roRegex = /(?:RO|R\/O|REPAIR ORDER|CLM)[\s:#-]*([0-9]{4,7}(?:-[0-9]{1,2}-[0-9]{1,2})?)/i;
  const currencyRegex = /\$?\s*([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})/g;

  let currentRecord: Partial<PdfRemittanceRecord> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cnMatch = line.match(creditNoteRegex);
    const roMatch = line.match(roRegex);

    if (cnMatch || roMatch) {
      if (currentRecord && currentRecord.creditNoteNumber && (currentRecord.paidNet || 0) > 0) {
        records.push(currentRecord as PdfRemittanceRecord);
      }
      currentRecord = {
        creditNoteNumber: cnMatch ? cnMatch[1] : `MBUSA-${roMatch ? roMatch[1] : Math.floor(Math.random() * 90000 + 10000)}`,
        roNumber: roMatch ? roMatch[1] : undefined,
        paidNet: 0,
        status: "APPROVED"
      };
    }

    if (currentRecord) {
      const amounts: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = currencyRegex.exec(line)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0 && val < 50000) {
          amounts.push(val);
        }
      }

      if (amounts.length > 0) {
        const maxVal = Math.max(...amounts);
        if (maxVal > (currentRecord.paidNet || 0)) {
          currentRecord.paidNet = maxVal;
          if (amounts.length > 1) {
            currentRecord.paidLabor = amounts[0];
            currentRecord.paidParts = amounts[1];
          }
        }
      }

      const dateMatch = line.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9]|[0-1]?[0-9]\/[0-3]?[0-9]\/202[0-9])\b/);
      if (dateMatch && !currentRecord.date) {
        currentRecord.date = dateMatch[1];
      }
    }
  }

  if (currentRecord && currentRecord.creditNoteNumber && (currentRecord.paidNet || 0) > 0) {
    records.push(currentRecord as PdfRemittanceRecord);
  }

  return records;
}

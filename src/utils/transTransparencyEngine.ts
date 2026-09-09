/**
 * Trans-Transparency Backend Engine
 * Proprietary Mercedes-Benz DMS ("C-files") & Credit Note (R22/RAPS) Reconciler
 */

import {
  parseDmsCFile as coreParseDmsCFile,
  parsePdfRemittance as coreParsePdfRemittance,
  reconcileDmsAndPdfRecords as coreReconcileDmsAndPdfRecords,
  formatAuditSummaryMarkdown as coreFormatAuditSummaryMarkdown,
  DmsParsedClaim,
  PdfRemittanceRecord,
  BridgedAuditRecord,
  OperatorOverride,
  StatusTrackingTier,
  SAMPLE_RAW_C_FILE,
  SAMPLE_RAW_R22_REMITTANCE
} from "./parser";

export type {
  DmsJobLine,
  DmsParsedClaim,
  PdfRemittanceRecord,
  BridgedAuditRecord,
  StatusTrackingTier,
  OperatorOverride
} from "./parser";

export type DmsClaimParsed = DmsParsedClaim;
export type CreditNoteRecord = PdfRemittanceRecord;
export type ReconciledAuditItem = BridgedAuditRecord & {
  path?: "PATH_A" | "PATH_B" | "PATH_C" | "PATH_D";
  statusLabel?: "CLOSED / FULLY PAID" | "PAID WITH VARIANCE" | "DENIED" | "PENDING MB REVIEW";
  matchedCreditSource?: "R22" | "RAPS";
};
export type OperatorOverrideRecord = OperatorOverride;
export type AuditPath = "PATH_A" | "PATH_B" | "PATH_C" | "PATH_D";

export { SAMPLE_RAW_C_FILE, SAMPLE_RAW_R22_REMITTANCE };

export const parseDmsCFile = coreParseDmsCFile;
export const parseCreditNotes = coreParsePdfRemittance;
export const parsePdfRemittance = coreParsePdfRemittance;

export function reconcileDmsAndCredits(
  dmsClaims: DmsParsedClaim[],
  creditNotes: PdfRemittanceRecord[],
  operatorOverrides: Record<string, OperatorOverride> = {}
): ReconciledAuditItem[] {
  const bridged = coreReconcileDmsAndPdfRecords(dmsClaims, creditNotes, operatorOverrides);
  return bridged.map(item => {
    let path: AuditPath = "PATH_A";
    if (item.statusTrackingTier === "CLOSED / FULLY PAID") path = "PATH_A";
    else if (item.statusTrackingTier === "PAID WITH VARIANCE") path = "PATH_B";
    else if (item.statusTrackingTier === "DENIED") path = "PATH_C";
    else if (item.statusTrackingTier === "WSG OVERRIDE / HOLD") path = "PATH_D";
    else path = "PATH_A";

    return {
      ...item,
      path,
      statusLabel: item.systemStatus,
      matchedCreditSource: (item.matchedPdfSource as "R22" | "RAPS") || "R22"
    };
  });
}

export const bridgeDmsAndPdfRecords = reconcileDmsAndCredits;
export const generateExecutiveAuditSummary = coreFormatAuditSummaryMarkdown;
export const formatAuditSummaryMarkdown = coreFormatAuditSummaryMarkdown;

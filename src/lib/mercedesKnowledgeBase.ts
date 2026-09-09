import { safeGetLocalStorage, safeSetLocalStorage } from "./safeStorage";

export interface VerifiedMercedesPolicy {
  id: string;
  category: "POLICY_MANUAL" | "WIS_MANDATE" | "TIPS_LI_BULLETIN" | "ONE_TIME_HARDWARE" | "ALIGNMENT_ROMESS" | "GOODWILL_MATRIX" | "CORRECTIVE_KNOWLEDGE";
  title: string;
  referenceCode: string; // e.g. "MBUSA WPM 3.1", "WIS AR33.10-P-0100", "LI00.00-P-065432"
  summary: string;
  mandatoryRequirements: string[];
  auditDebitRisk: "HIGH" | "MEDIUM" | "LOW";
  isActive: boolean;
  isCustom?: boolean;
  createdAt: string;
}

export const DEFAULT_VERIFIED_MERCEDES_POLICIES: VerifiedMercedesPolicy[] = [
  {
    id: "mb-pol-001",
    category: "POLICY_MANUAL",
    title: "Defect in Material & Factory Workmanship vs. Outside Influence",
    referenceCode: "MBUSA WPM Sec. 3.1 & 4.2",
    summary: "Coverage is strictly confined to factory material, casting, metallurgical, or workmanship defects during the warranty term. Any failure caused by external impact, road debris, curb strikes, rodents, chemical corrosion, water flooding, or aftermarket tampering is 100% non-warrantable.",
    mandatoryRequirements: [
      "Story must explicitly articulate the internal failure mechanism (e.g. internal seal rupture, bushing tear without impact, internal solder fracture).",
      "Technician must verify and document zero external impact marks, wheel lip denting, or collision damage on adjacent components.",
      "Eliminate trigger words: 'hit bump', 'impact', 'pothole', 'drove through puddle', 'customer damaged'."
    ],
    auditDebitRisk: "HIGH",
    isActive: true,
    createdAt: "2024-01-15"
  },
  {
    id: "mb-pol-002",
    category: "ONE_TIME_HARDWARE",
    title: "Mandatory One-Time Use Fasteners & Stretch Bolt Replacement",
    referenceCode: "WIS Mandate AR00.20-P-0010 / AH33.00-P-0001",
    summary: "All torque-to-yield stretch bolts, self-locking micro-encapsulated collar nuts, aluminum steering/suspension fasteners, injector copper crush rings, and single-use subframe bolts removed during repair MUST be replaced with new parts and billed as individual line items on the DMS warranty invoice.",
    mandatoryRequirements: [
      "Every suspension control arm, ball joint, tie rod, and axle spindle repair must bill new factory torque-to-yield hardware.",
      "Reusing old fasteners or omitting them from DMS invoice results in an automatic 100% warranty chargeback during audit.",
      "Fastener torque + angle degree tightening specifications must be acknowledged in repair correction."
    ],
    auditDebitRisk: "HIGH",
    isActive: true,
    createdAt: "2024-01-15"
  },
  {
    id: "mb-pol-003",
    category: "WIS_MANDATE",
    title: "Paperless Xentry Diagnosis & SCN Flashing Proof Mandate",
    referenceCode: "MBUSA Paperless Xentry Policy 2024.1",
    summary: "Technicians are mandated to upload all Initial and Final Quick Tests, Guided Diagnostic Test step protocols supporting punch time, Adaptation reset logs, and SCN software flash verification trees directly into Paperless Xentry Diagnosis.",
    mandatoryRequirements: [
      "Initial Quick Test with stored freeze frame DTCs required on all electronic claims.",
      "Guided Diagnostic test logs must support any claimed high diagnosis time (FRUs).",
      "In event of system downtime, high-resolution photos of instrument cluster/Xentry screen must be documented and supplied to warranty administration."
    ],
    auditDebitRisk: "HIGH",
    isActive: true,
    createdAt: "2024-01-15"
  },
  {
    id: "mb-pol-004",
    category: "ALIGNMENT_ROMESS",
    title: "Wheel Alignment Audit & Romess Ride Height Inclinometer Baseline",
    referenceCode: "WIS AR40.20-P-0200 / OF40.20-P-3000",
    summary: "Warranty reimbursement for wheel alignment operations requires electronic verification of initial and final camber/toe/caster values, electronic Romess ride height inclination angle input, and Steering Angle Sensor (N80/N30) zero-point calibration.",
    mandatoryRequirements: [
      "Romess electronic inclinometer values (front control arm & rear axle shaft angles) must be documented.",
      "Toe and camber adjustment operations are only claimable if measured initial values deviate outside Mercedes-Benz factory tolerances.",
      "Steering angle sensor calibration must be confirmed after mechanical adjustment."
    ],
    auditDebitRisk: "MEDIUM",
    isActive: true,
    createdAt: "2024-01-15"
  },
  {
    id: "mb-pol-005",
    category: "GOODWILL_MATRIX",
    title: "Post-Warranty Customer Loyalty Goodwill Assistance Authorization",
    referenceCode: "MBUSA Goodwill Matrix Sec. 8.4",
    summary: "Special goodwill participation for vehicles slightly outside base warranty (up to 65,000 miles / 5 years) requiring consistent authorized dealer service history and Service Director / Factory Representative pre-approval.",
    mandatoryRequirements: [
      "50/50 Dealer-Factory or 75/25 split authorization code required.",
      "Customer loyalty maintenance history at authorized Mercedes-Benz dealership must be verified.",
      "Pre-authorization electronic token or Service Director digital sign-off must be attached before claim submission."
    ],
    auditDebitRisk: "MEDIUM",
    isActive: true,
    createdAt: "2024-01-15"
  },
  {
    id: "mb-pol-006",
    category: "CORRECTIVE_KNOWLEDGE",
    title: "Technician 3C Story Writing Causation & Audit Defense Protocol",
    referenceCode: "ASP Corrective Protocol CP-3C-2024",
    summary: "The 3C story must follow strict tripartite isolation: Complaint (customer symptom without speculation), Cause (root metallurgical/electrical defect with DTC evidence), Correction (exact WIS operation steps, part replacement, torque sequence, adaptation, and verification road test).",
    mandatoryRequirements: [
      "Never mix customer complaint with technician diagnosis.",
      "Always state the specific physical failure (e.g. 'internal valve seal leakage causing low rail pressure').",
      "Include clear quality verification confirmation ('Road tested 5 miles, confirmed noise eliminated, final Quick Test scan shows zero active DTCs')."
    ],
    auditDebitRisk: "HIGH",
    isActive: true,
    createdAt: "2024-01-15"
  }
];

const STORAGE_KEY = "asp_verified_mercedes_policies_v1";

export function loadVerifiedMercedesPolicies(): VerifiedMercedesPolicy[] {
  const saved = safeGetLocalStorage(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse saved verified Mercedes policies", e);
    }
  }
  return DEFAULT_VERIFIED_MERCEDES_POLICIES;
}

export function saveVerifiedMercedesPolicies(policies: VerifiedMercedesPolicy[]) {
  safeSetLocalStorage(STORAGE_KEY, JSON.stringify(policies));
}

export function formatActivePoliciesForPrompt(policies: VerifiedMercedesPolicy[]): string {
  const active = policies.filter((p) => p.isActive);
  if (active.length === 0) return "No custom verified policies loaded. Use default OEM standards.";

  return active
    .map(
      (p, i) =>
        `[VERIFIED MB POLICY ${i + 1}]: ${p.title} (${p.referenceCode})\n` +
        `Category: ${p.category} | Audit Risk: ${p.auditDebitRisk}\n` +
        `Summary: ${p.summary}\n` +
        `Mandatory Requirements:\n${p.mandatoryRequirements.map((r) => `  - ${r}`).join("\n")}`
    )
    .join("\n\n");
}

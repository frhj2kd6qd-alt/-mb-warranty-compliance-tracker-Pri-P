import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import aspLogo from "../assets/images/asp-logo.png";

/**
 * Generates and downloads a comprehensive Application Usage Instruction Manual PDF
 * for the ASP Mercedes-Benz Warranty Compliance Tracker & Command Center.
 */
export const generateAppUsagePDF = (): Promise<{ blobUrl: string, filename: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const img = new Image();
      img.src = aspLogo;

      const renderDocument = () => {
        try {
          // Page setup metrics
          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 14;
          const contentWidth = pageWidth - margin * 2;

          let currentY = 16;

          // Helper to add page header on each page
          const drawHeader = (docObj: jsPDF, isFirstPage: boolean = false) => {
            if (img.complete && img.naturalWidth !== 0) {
              docObj.addImage(img, "JPEG", margin, 10, 14, 14);
              docObj.setFont("helvetica", "bold");
              docObj.setFontSize(12);
              docObj.setTextColor(15, 23, 42); // slate-900
              docObj.text("ASP MERCEDES-BENZ WARRANTY COMPLIANCE TRACKER", margin + 18, 15);
              docObj.setFont("helvetica", "bold");
              docObj.setFontSize(8);
              docObj.setTextColor(225, 29, 72); // rose-600
              docObj.text("APPLICATION USAGE & OPERATIONAL SOP MANUAL", margin + 18, 20);
            } else {
              docObj.setFont("helvetica", "bold");
              docObj.setFontSize(12);
              docObj.setTextColor(15, 23, 42);
              docObj.text("ASP MERCEDES-BENZ WARRANTY COMPLIANCE TRACKER", margin, 15);
              docObj.setFont("helvetica", "bold");
              docObj.setFontSize(8);
              docObj.setTextColor(225, 29, 72);
              docObj.text("APPLICATION USAGE & OPERATIONAL SOP MANUAL", margin, 20);
            }

            docObj.setDrawColor(226, 232, 240); // slate-200
            docObj.setLineWidth(0.5);
            docObj.line(margin, 25, pageWidth - margin, 25);
          };

          // Draw Page 1 Header
          drawHeader(doc, true);
          currentY = 32;

          // Document Metadata Box
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text("SYSTEM IDENTIFIER:", margin + 4, currentY + 6);
          doc.setFont("helvetica", "normal");
          doc.text("ASP-MB-WARRANTY-V4.8 (Enterprise Production)", margin + 40, currentY + 6);

          doc.setFont("helvetica", "bold");
          doc.text("DOCUMENT PURPOSE:", margin + 4, currentY + 12);
          doc.setFont("helvetica", "normal");
          doc.text("Standard Operating Procedures & Feature Guide for Dealers, Technicians & Advisors", margin + 40, currentY + 12);

          doc.setFont("helvetica", "bold");
          doc.text("DATE GENERATED:", margin + 4, currentY + 18);
          doc.setFont("helvetica", "normal");
          doc.text(`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 40, currentY + 18);

          currentY += 28;

          // SECTION 1: SYSTEM OVERVIEW & COMPLIANCE ARCHITECTURE
          doc.setFillColor(15, 23, 42); // slate-900 header
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 1: SYSTEM OVERVIEW & COMPLIANCE ARCHITECTURE", margin + 4, currentY + 5);
          currentY += 11;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          
          const overviewText = [
            "The ASP Command Center is a proprietary system designed to bring clarity, accountability, and audit awareness into",
            "the warranty process without disrupting dealership operations."
          ];
          overviewText.forEach(line => {
            doc.text(line, margin, currentY);
            currentY += 4.5;
          });
          currentY += 4;
          
          doc.setFont("helvetica", "bold");
          doc.text("• Proprietary Service Tool:", margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text("Built as an internal operational platform used exclusively by ASP to support warranty booking and administration", margin + 5, currentY + 4.5);
          doc.text("services. It is a self-developed service tool, not commercial software for sale.", margin + 5, currentY + 9);
          currentY += 14;

          doc.setFont("helvetica", "bold");
          doc.text("• Audit Realism & Transparency:", margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text("Manufacturer audits are predetermined, scheduled, and governed by factory algorithms. Neither administrators", margin + 5, currentY + 4.5);
          doc.text("nor software can prevent, cure, or guarantee immunity from factory audits.", margin + 5, currentY + 9);
          currentY += 14;

          doc.setFont("helvetica", "bold");
          doc.text("• Risk Reporting & Management Action:", margin, currentY);
          doc.setFont("helvetica", "normal");
          doc.text("The platform's sole purpose is live visibility into claim errors, 3 C's discrepancies, and documentation gaps", margin + 5, currentY + 4.5);
          doc.text("during booking. It reports financial risk so dealership management—who are ultimately responsible for operational", margin + 5, currentY + 9);
          doc.text("change—can correct staff behavior and safeguard store revenue.", margin + 5, currentY + 13.5);
          currentY += 18.5;

          // SECTION 2: GARAGE VISUAL OPERATIONAL BAYS & DYNAMIC FLUID METRICS
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 2: GARAGE VISUAL OPERATIONAL BAYS & DYNAMIC FLUID METRICS", margin + 4, currentY + 5);
          currentY += 11;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text("The Garage is the home base, visualizing live risk dispersion across active service bays with fluid metrics.", margin, currentY);
          currentY += 6;
          
          autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [["Visual Component", "Functionality & Metrics"]],
            body: [
              ["Active Repair Bays", "Displays current ROs, severity levels, and assigned staff in an immersive 3D grid."],
              ["Fluid Metrics Rings", "Live telemetry reflecting total risk volume, potential financial loss, and resolution speed."]
            ],
            styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" }
          });

          currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 30;

          // SECTION 3: COCKPIT DASHBOARD & INTERACTIVE OLED CONSOLE
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 3: COCKPIT DASHBOARD & INTERACTIVE OLED CONSOLE", margin + 4, currentY + 5);
          currentY += 11;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text("The Cockpit serves as the primary command interface, featuring modular data vents and quick-action toolbars.", margin, currentY);
          currentY += 6;

          autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [["Control Interface Element", "Operational Functionality"]],
            body: [
              [
                "Telemetry Vents (Top Left)",
                "Clicking vents instantly routes user to contextual intake modules (Tech or Advisor)."
              ],
              [
                "Audit Discrepancy Scanners",
                "Monitors data streams for 3 C's mismatch, missing WIS documents, and time clock errors."
              ],
              [
                "Quick-Action Command Grid",
                "Allows one-click access to Personnel Directory, Live Database Connections, and Export Tools."
              ]
            ],
            styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" }
          });

          // PAGE BREAK FOR PAGE 2
          doc.addPage();
          drawHeader(doc, false);
          currentY = 32;

          // SECTION 4: PHASE 1 INTAKE & LIVE CLAIM RISK ASSESSMENT
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 4: PHASE 1 INTAKE & LIVE CLAIM RISK ASSESSMENT", margin + 4, currentY + 5);
          currentY += 14;

          const steps = [
            { step: "Step 1: Select Active Role", desc: "Choose whether you are inputting data as a Technician or Service Advisor via top intake sub-tabs or clicking Chrome Vents." },
            { step: "Step 2: Enter Repair Order Details", desc: "Input 6-digit RO Number, 17-character Mercedes-Benz VIN, Mileage, and select Technician/Advisor from personnel directory." },
            { step: "Step 3: Opcode & Labor Audit", desc: "Provide primary Opcode (e.g., 54-1011) and claimed labor hours. The system checks against standard time allowances." },
            { step: "Step 4: Craft 3 C's Story Narrative", desc: "Input detailed Complaint, Cause, and Correction narratives. The Gemini AI engine checks story validity in real time." },
            { step: "Step 5: Attach Supporting Media", desc: "Upload XENTRY diagnostic logs, multi-point inspection sheets, or photographs using the Batch Document Uploader." },
            { step: "Step 6: Submit & Sync to Ledger", desc: "Click 'Submit Intake Record' to store in live Firestore database and trigger compliance scoring." }
          ];

          steps.forEach(s => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text(s.step, margin, currentY);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            
            const splitDesc = doc.splitTextToSize(s.desc, contentWidth - 45);
            doc.text(splitDesc, margin + 45, currentY);
            
            currentY += Math.max(splitDesc.length * 4 + 6, 12);
          });

          currentY += 6;

          // SECTION 5: LIVE TRACKING & CLAIMS LEDGER AUDIT TABLES
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 5: LIVE TRACKING & CLAIMS LEDGER AUDIT TABLES", margin + 4, currentY + 5);
          currentY += 11;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text("The Tracking Ledger serves as the primary operational grid for monitoring pending, flagged, and approved claims.", margin, currentY);
          currentY += 6;

          autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [["Category / Status", "Indicator Color", "Risk Level & Required Action"]],
            body: [
              [
                "Technician Story Risk",
                "Cyan Badge",
                "Requires story expansion or XENTRY diagnostic attachment before Central CWS submission."
              ],
              [
                "Advisor Authorization Risk",
                "Amber Badge",
                "Customer authorization missing, date mismatch, or opcode labor hour overlap detected."
              ],
              [
                "Live Error & Discrepancy Flagging",
                "Red Critical Badge",
                "Claim flagged by auditor. Immediate resolution required via Phase 3 Financial Checkout Sheet."
              ],
              [
                "Verified / Approved",
                "Emerald Green Badge",
                "All 3 C's verified, labor time validated, and documentation ready for CWS reimbursement."
              ]
            ],
            styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" }
          });

          currentY = (doc as any).lastAutoTable?.finalY + 8 || currentY + 50;

          // SECTION 6: EXECUTIVE REPORTING CENTER & ROSTER ANALYTICS
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, currentY, contentWidth, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(255, 255, 255);
          doc.text("SECTION 6: EXECUTIVE REPORTING CENTER & ROSTER ANALYTICS", margin + 4, currentY + 5);
          currentY += 13;

          const reportingItems = [
            "• Executive Reporting & Roster Analytics: High-density visualization for real-time shop floor oversight.",
            "• Executive Analytics: Auto-calculated Financial Exposure, Capital Recoveries, and Coachability Index.",
            "• CSV & Excel Export: Instant raw data dispatch for dealer management system (DMS) reconciliation.",
            "• Compliance PDF Export: Formal printable audit summaries with executive breakdown tables.",
            "• Google Workspace Hub: Integrated dispatch for Gmail notices, Google Calendar appointments, and Sheets syncing."
          ];

          reportingItems.forEach(item => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            const splitItem = doc.splitTextToSize(item, contentWidth);
            doc.text(splitItem, margin, currentY);
            currentY += splitItem.length * 4.5 + 4;
          });

          // FOOTERS FOR ALL PAGES
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("ASP MERCEDES-BENZ COMPLIANCE SYSTEM • PROPRIETARY & CONFIDENTIAL", margin, 287);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 287, { align: "right" });
          }

          const filename = `ASP_MB_Warranty_Tracker_Usage_Guide.pdf`;
          const pdfBlob = doc.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);
          resolve({ blobUrl, filename });

        } catch (err) {
          reject(err);
        }
      };

      if (img.complete) {
        renderDocument();
      } else {
        img.onload = () => renderDocument();
        img.onerror = () => renderDocument(); // Render even if logo fails
      }
    } catch (err) {
      reject(err);
    }
  });
};

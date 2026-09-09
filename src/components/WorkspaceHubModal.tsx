import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Calendar, 
  FormInput, 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  X, 
  Send, 
  Clock, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { 
  signInWithGoogleWorkspace, 
  sendGmailMessage, 
  createCalendarEvent, 
  createGoogleForm,
  getFormResponses,
  exportToGoogleSheets,
  exportToGoogleDoc,
  exportToGoogleSlides,
  downloadCsvFallback,
  downloadDocFallback,
  downloadSlidesFallback
} from "../lib/workspace";
import { ErrorRecord } from "../types";

interface WorkspaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ErrorRecord[];
  initialTab?: "gmail" | "calendar" | "forms" | "sheets" | "docs" | "slides";
  prefillEmail?: { to?: string; subject?: string; body?: string };
  prefillCalendar?: { summary?: string; description?: string };
}

export const WorkspaceHubModal: React.FC<WorkspaceHubModalProps> = ({
  isOpen,
  onClose,
  records,
  initialTab = "gmail",
  prefillEmail,
  prefillCalendar
}) => {
  const [activeTab, setActiveTab] = useState<"gmail" | "calendar" | "forms" | "sheets" | "docs" | "slides">(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  // Gmail State
  const [emailTo, setEmailTo] = useState<string>(prefillEmail?.to || "");
  const [emailSubject, setEmailSubject] = useState<string>(prefillEmail?.subject || "ASP Executive Audit & Warranty Report");
  const [emailBody, setEmailBody] = useState<string>(
    prefillEmail?.body ||
      `Hello Team,\n\nPlease review the attached ASP Warranty & Compliance audit metrics:\n• Total Audited Records: ${records.length}\n• Flagged Red Items: ${records.filter(r => (r.severityColor || r.overallStatus) === 'RED').length}\n• Flagged Yellow Items: ${records.filter(r => (r.severityColor || r.overallStatus) === 'YELLOW').length}\n\nAction Required: Immediate remediation on critical warranty items.\n\nBest regards,\nASP Operations Security`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  // Calendar State
  const [calSummary, setCalSummary] = useState<string>(prefillCalendar?.summary || "ASP Warranty Audit Review & Claim Sync");
  const [calDescription, setCalDescription] = useState<string>(prefillCalendar?.description || "Review flagged warranty claim discrepancies and technician labor code compliance.");
  const [calStart, setCalStart] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [calEnd, setCalEnd] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 3, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [calAttendees, setCalAttendees] = useState<string>("");
  const [isSchedulingCal, setIsSchedulingCal] = useState(false);
  const [showCalConfirm, setShowCalConfirm] = useState(false);

  // Forms State
  const [formTitle, setFormTitle] = useState<string>("ASP Warranty & Technical Labor Audit Form");
  const [formDesc, setFormDesc] = useState<string>("Technician and Service Advisor intake questionnaire for warranty claim verification.");
  const [formQuestions, setFormQuestions] = useState<string[]>([
    "Repair Order Number (RO#)",
    "Service Advisor Name",
    "Technician Employee ID",
    "Labor Code / Operation Description",
    "Reason for Punch Clock / Discrepancy Note"
  ]);
  const [newQuestionText, setNewQuestionText] = useState<string>("");
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [showFormConfirm, setShowFormConfirm] = useState(false);
  const [lastFormId, setLastFormId] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<any[] | null>(null);
  const [isCheckingResponses, setIsCheckingResponses] = useState(false);

  // Sheets / Docs / Slides State
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  if (!isOpen) return null;

  const clearMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
    setCreatedUrl(null);
  };

  // 1. Gmail Handler
  const handleSendGmail = async () => {
    clearMessages();
    if (!emailTo.trim()) {
      setErrorMessage("Please enter a recipient email address.");
      return;
    }
    setIsSendingEmail(true);
    try {
      const authResult = await signInWithGoogleWorkspace();
      if (!authResult) {
        setStatusMessage("Google Workspace sign-in was cancelled or popup closed.");
        setIsSendingEmail(false);
        return;
      }
      
      const res = await sendGmailMessage(
        { to: emailTo.trim(), subject: emailSubject.trim(), body: emailBody },
        authResult.accessToken
      );
      
      setStatusMessage(`Gmail message successfully dispatched! (ID: ${res.id})`);
      setShowEmailConfirm(false);
    } catch (err: any) {
      if (err?.message?.includes('popup-closed-by-user') || err?.code === 'auth/popup-closed-by-user') {
        setStatusMessage("Sign-in popup closed.");
      } else {
        console.error(err);
        setErrorMessage(err.message || "Failed to send Gmail message.");
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 2. Calendar Handler
  const handleScheduleCalendar = async () => {
    clearMessages();
    setIsSchedulingCal(true);
    try {
      const authResult = await signInWithGoogleWorkspace();
      if (!authResult) {
        setStatusMessage("Google Workspace sign-in was cancelled or popup closed.");
        setIsSchedulingCal(false);
        return;
      }

      const attendeesArr = calAttendees
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const res = await createCalendarEvent(
        {
          summary: calSummary,
          description: calDescription,
          startDateTime: new Date(calStart).toISOString(),
          endDateTime: new Date(calEnd).toISOString(),
          attendees: attendeesArr
        },
        authResult.accessToken
      );

      setStatusMessage("Google Calendar audit event successfully scheduled!");
      setCreatedUrl(res.htmlLink);
      setShowCalConfirm(false);
    } catch (err: any) {
      if (err?.message?.includes('popup-closed-by-user') || err?.code === 'auth/popup-closed-by-user') {
        setStatusMessage("Sign-in popup closed.");
      } else {
        console.error(err);
        setErrorMessage(err.message || "Failed to schedule Google Calendar event.");
      }
    } finally {
      setIsSchedulingCal(false);
    }
  };

  // 3. Forms Handler
  const handleCreateForm = async () => {
    clearMessages();
    setIsCreatingForm(true);
    try {
      const authResult = await signInWithGoogleWorkspace();
      if (!authResult) {
        setStatusMessage("Google Workspace sign-in was cancelled or popup closed.");
        setIsCreatingForm(false);
        return;
      }

      const res = await createGoogleForm(
        {
          title: formTitle,
          description: formDesc,
          questions: formQuestions
        },
        authResult.accessToken
      );

      setLastFormId(res.formId);
      setStatusMessage("Google Form successfully compiled and published!");
      setCreatedUrl(res.editUrl);
      setShowFormConfirm(false);
    } catch (err: any) {
      if (err?.message?.includes('popup-closed-by-user') || err?.code === 'auth/popup-closed-by-user') {
        setStatusMessage("Sign-in popup closed.");
      } else {
        console.error(err);
        setErrorMessage(err.message || "Failed to create Google Form.");
      }
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleFetchResponses = async () => {
    if (!lastFormId) return;
    setIsCheckingResponses(true);
    try {
      const authResult = await signInWithGoogleWorkspace();
      if (!authResult) {
        setStatusMessage("Google Workspace sign-in was cancelled or popup closed.");
        setIsCheckingResponses(false);
        return;
      }

      const data = await getFormResponses(lastFormId, authResult.accessToken);
      setFormResponses(data.responses || []);
    } catch (err: any) {
      if (err?.message?.includes('popup-closed-by-user') || err?.code === 'auth/popup-closed-by-user') {
        setStatusMessage("Sign-in popup closed.");
      } else {
        console.error(err);
        setErrorMessage(err.message || "Failed to fetch form responses.");
      }
    } finally {
      setIsCheckingResponses(false);
    }
  };

  // Quick export handlers
  const handleQuickExport = async (type: "sheets" | "docs" | "slides") => {
    clearMessages();
    setIsProcessingDoc(true);
    try {
      const authResult = await signInWithGoogleWorkspace();
      if (!authResult) {
        setStatusMessage("Google Workspace sign-in was cancelled or popup closed.");
        setIsProcessingDoc(false);
        return;
      }

      if (type === "sheets") {
        const res = await exportToGoogleSheets("ASP Warranty Audit Dataset", records, authResult.accessToken);
        setStatusMessage("Exported to Google Sheets successfully!");
        setCreatedUrl(res.spreadsheetUrl);
      } else if (type === "docs") {
        const green = records.filter(r => (r.severityColor || r.overallStatus) === 'GREEN').length;
        const yellow = records.filter(r => (r.severityColor || r.overallStatus) === 'YELLOW').length;
        const red = records.filter(r => (r.severityColor || r.overallStatus) === 'RED').length;
        const res = await exportToGoogleDoc(
          "ASP Executive Audit Briefing",
          `Total audited records: ${records.length}. Critical flags requiring attention: ${red}.`,
          { totalRecords: records.length, green, yellow, red },
          authResult.accessToken
        );
        setStatusMessage("Exported to Google Docs successfully!");
        setCreatedUrl(res.documentUrl);
      } else if (type === "slides") {
        const green = records.filter(r => (r.severityColor || r.overallStatus) === 'GREEN').length;
        const yellow = records.filter(r => (r.severityColor || r.overallStatus) === 'YELLOW').length;
        const red = records.filter(r => (r.severityColor || r.overallStatus) === 'RED').length;
        const res = await exportToGoogleSlides(
          "ASP Executive Briefing Deck",
          {
            totalRecords: records.length,
            green,
            yellow,
            red,
            topIssues: ["Labor code overlap discrepancy", "Missing punch clock authorization", "3 C's narrative incompleteness"]
          },
          authResult.accessToken
        );
        setStatusMessage("Exported to Google Slides presentation deck!");
        setCreatedUrl(res.presentationUrl);
      }
    } catch (err: any) {
      console.warn("API Error, offering fallback:", err);
      if (type === "sheets") downloadCsvFallback("ASP_Audit_Data", records);
      if (type === "docs") downloadDocFallback("ASP_Executive_Briefing", "Audit summary compiled.", { totalRecords: records.length, green: 0, yellow: 0, red: 0 });
      if (type === "slides") downloadSlidesFallback("ASP_Executive_Briefing", { totalRecords: records.length, green: 0, yellow: 0, red: 0, topIssues: [] });
      setStatusMessage(`Downloaded local offline fallback document.`);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        key="workspace-hub-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                GOOGLE WORKSPACE HUB
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  LIVE API
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Direct Google Workspace automation for Gmail, Calendar, Forms, Sheets, Docs & Slides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("gmail"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "gmail"
                ? "bg-slate-900 text-red-400 border-red-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Mail className="w-4 h-4" />
            GMAIL
          </button>

          <button
            onClick={() => { setActiveTab("calendar"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "calendar"
                ? "bg-slate-900 text-blue-400 border-blue-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Calendar className="w-4 h-4" />
            GOOGLE CALENDAR
          </button>

          <button
            onClick={() => { setActiveTab("forms"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "forms"
                ? "bg-slate-900 text-purple-400 border-purple-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <FormInput className="w-4 h-4" />
            GOOGLE FORMS
          </button>

          <button
            onClick={() => { setActiveTab("sheets"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "sheets"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            SHEETS
          </button>

          <button
            onClick={() => { setActiveTab("docs"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "docs"
                ? "bg-slate-900 text-cyan-400 border-cyan-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <FileText className="w-4 h-4" />
            DOCS
          </button>

          <button
            onClick={() => { setActiveTab("slides"); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all border-b-2 ${
              activeTab === "slides"
                ? "bg-slate-900 text-amber-400 border-amber-500 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40"
            }`}
          >
            <Presentation className="w-4 h-4" />
            SLIDES
          </button>
        </div>

        {/* Modal Status Banner */}
        {statusMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            {createdUrl && (
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors shrink-0"
              >
                OPEN LINK
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs font-mono text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= GMAIL TAB ================= */}
          {activeTab === "gmail" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-400" />
                    COMPOSE GMAIL EMAIL
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Send audit briefings, technician compliance alerts, or claim follow-ups directly via your Google Account.
                  </p>
                </div>

                {/* Templates dropdown/buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEmailSubject("ASP Audit Discrepancy Alert - Immediate Attention");
                      setEmailBody(
                        `URGENT COMPLIANCE NOTICE:\n\nThe ASP Audit Intelligence System detected labor overlap or 3 C's narrative discrepancies on your recent repair orders.\n\nPlease review your active claims in the Control Room or contact the Warranty Administrator immediately.\n\nASP Systems`
                      );
                    }}
                    className="text-[10px] font-mono bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Template: Discrepancy Alert
                  </button>
                  <button
                    onClick={() => {
                      setEmailSubject("ASP Executive Weekly Warranty Summary");
                      setEmailBody(
                        `EXECUTIVE WARRANTY SUMMARY REPORT:\n\n• Total Claims Audited: ${records.length}\n• Compliant Claims (Green): ${records.filter(r => (r.severityColor || r.overallStatus) === 'GREEN').length}\n• Flagged Discrepancies (Yellow/Red): ${records.filter(r => (r.severityColor || r.overallStatus) !== 'GREEN').length}\n\nAll metrics synced with ASP System Intelligence.`
                      );
                    }}
                    className="text-[10px] font-mono bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Template: Weekly Briefing
                  </button>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">To (Recipient Email Address):</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="e.g. manager@dealership.com, technician@aspclass.org"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Subject Line:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Body Content:</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-mono text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Explicit User Confirmation Step per SKILL.md */}
              {showEmailConfirm ? (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-red-300 font-bold">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <span>CONFIRM SENDING EMAIL VIA GMAIL API?</span>
                  </div>
                  <p className="text-slate-300">
                    This will send an email to <strong className="text-white">{emailTo}</strong> with subject <strong className="text-white">"{emailSubject}"</strong> using your authenticated Google Workspace Gmail account.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSendGmail}
                      disabled={isSendingEmail}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSendingEmail ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      YES, DISPATCH GMAIL MESSAGE
                    </button>
                    <button
                      onClick={() => setShowEmailConfirm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!emailTo.trim()) {
                        setErrorMessage("Please specify a recipient email before proceeding.");
                        return;
                      }
                      setErrorMessage(null);
                      setShowEmailConfirm(true);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    PROCEED TO SEND EMAIL
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= GOOGLE CALENDAR TAB ================= */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  SCHEDULE GOOGLE CALENDAR EVENT
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Create compliance audit review sessions, labor rate reviews, or denial appeal meetings directly in Google Calendar.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Event Title / Summary:</label>
                  <input
                    type="text"
                    value={calSummary}
                    onChange={(e) => setCalSummary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Start Date & Time:</label>
                    <input
                      type="datetime-local"
                      value={calStart}
                      onChange={(e) => setCalStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">End Date & Time:</label>
                    <input
                      type="datetime-local"
                      value={calEnd}
                      onChange={(e) => setCalEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Attendees (Comma Separated Emails):</label>
                  <input
                    type="text"
                    value={calAttendees}
                    onChange={(e) => setCalAttendees(e.target.value)}
                    placeholder="e.g. advisor@aspclass.org, technician@dealership.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Meeting Description / Agenda:</label>
                  <textarea
                    rows={3}
                    value={calDescription}
                    onChange={(e) => setCalDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Explicit User Confirmation Step */}
              {showCalConfirm ? (
                <div className="p-4 bg-blue-950/40 border border-blue-500/50 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>CONFIRM GOOGLE CALENDAR EVENT CREATION?</span>
                  </div>
                  <p className="text-slate-300">
                    This will add <strong className="text-white">"{calSummary}"</strong> on <strong className="text-white">{new Date(calStart).toLocaleString()}</strong> to your primary Google Calendar.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleScheduleCalendar}
                      disabled={isSchedulingCal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSchedulingCal ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      YES, SCHEDULE EVENT
                    </button>
                    <button
                      onClick={() => setShowCalConfirm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCalConfirm(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    PROCEED TO SCHEDULE CALENDAR EVENT
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= GOOGLE FORMS TAB ================= */}
          {activeTab === "forms" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <FormInput className="w-4 h-4 text-purple-400" />
                  CREATE GOOGLE FORM & AUDIT QUESTIONNAIRE
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Generate customized intake forms for technicians or advisors. Submitted responses can be synced with ASP Audit Intelligence.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Form Title:</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Form Description:</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-2">Form Questions / Intake Fields:</label>
                  <div className="space-y-2 mb-3">
                    {formQuestions.map((q, idx) => (
                      <div key={`form-q-${idx}`} className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-300">
                        <span className="w-5 h-5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                          {idx + 1}
                        </span>
                        <span className="flex-1 truncate">{q}</span>
                        <button
                          onClick={() => setFormQuestions(formQuestions.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new question */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Add a custom question (e.g., '3 C's Cause Explanation')"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newQuestionText.trim()) {
                          e.preventDefault();
                          setFormQuestions([...formQuestions, newQuestionText.trim()]);
                          setNewQuestionText("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newQuestionText.trim()) {
                          setFormQuestions([...formQuestions, newQuestionText.trim()]);
                          setNewQuestionText("");
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 rounded-lg text-xs flex items-center gap-1 transition-colors font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ADD
                    </button>
                  </div>
                </div>
              </div>

              {/* Explicit User Confirmation Step */}
              {showFormConfirm ? (
                <div className="p-4 bg-purple-950/40 border border-purple-500/50 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <FormInput className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>CONFIRM GOOGLE FORM CREATION?</span>
                  </div>
                  <p className="text-slate-300">
                    This will build and publish a new Google Form titled <strong className="text-white">"{formTitle}"</strong> containing <strong className="text-white">{formQuestions.length} custom fields</strong> in your Google account.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleCreateForm}
                      disabled={isCreatingForm}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isCreatingForm ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <FormInput className="w-4 h-4" />
                      )}
                      YES, COMPILE GOOGLE FORM
                    </button>
                    <button
                      onClick={() => setShowFormConfirm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {lastFormId ? (
                    <button
                      onClick={handleFetchResponses}
                      disabled={isCheckingResponses}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                      {isCheckingResponses ? "FETCHING..." : "CHECK FORM RESPONSES"}
                    </button>
                  ) : <div />}

                  <button
                    onClick={() => setShowFormConfirm(true)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <FormInput className="w-4 h-4" />
                    PROCEED TO CREATE FORM
                  </button>
                </div>
              )}

              {/* Form responses output */}
              {formResponses && (
                <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-xl space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-purple-300 font-bold border-b border-slate-800 pb-2">
                    <span>RECEIVED FORM RESPONSES ({formResponses.length})</span>
                    <button onClick={() => setFormResponses(null)} className="text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {formResponses.length === 0 ? (
                    <p className="text-slate-500 py-2">No responses received yet for this Google Form.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {formResponses.map((resp, idx) => (
                        <div key={`resp-${idx}`} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-purple-400 font-bold">Response #{idx + 1}</span>
                          <pre className="text-[10px] text-slate-300 mt-1 whitespace-pre-wrap">
                            {JSON.stringify(resp.answers || resp, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= SHEETS / DOCS / SLIDES TAB ================= */}
          {(activeTab === "sheets" || activeTab === "docs" || activeTab === "slides") && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {activeTab === "sheets" && <FileSpreadsheet className="w-8 h-8 text-emerald-400" />}
                {activeTab === "docs" && <FileText className="w-8 h-8 text-cyan-400" />}
                {activeTab === "slides" && <Presentation className="w-8 h-8 text-amber-400" />}
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    GOOGLE {activeTab} AUTOMATION
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Export real-time audit records and compliance telemetry directly to Google {activeTab.toUpperCase()}.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-300">Audited Dataset Payload:</span>
                  <span className="font-bold text-cyan-400">{records.length} Active Audit Records</span>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  Click below to compile and send the current audit records dataset directly into Google {activeTab.toUpperCase()} under your authenticated Google Workspace session.
                </p>

                <button
                  onClick={() => handleQuickExport(activeTab)}
                  disabled={isProcessingDoc}
                  className={`w-full py-3 px-4 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-slate-950 ${
                    activeTab === "sheets" ? "bg-emerald-400 hover:bg-emerald-300" :
                    activeTab === "docs" ? "bg-cyan-400 hover:bg-cyan-300" :
                    "bg-amber-400 hover:bg-amber-300"
                  }`}
                >
                  {isProcessingDoc ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  GENERATE & OPEN GOOGLE {activeTab.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GOOGLE WORKSPACE API ACTIVE (OAuth2 Scopes Configured)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-bold"
          >
            CLOSE HUB
          </button>
        </div>
      </motion.div>
    </div>
  );
};

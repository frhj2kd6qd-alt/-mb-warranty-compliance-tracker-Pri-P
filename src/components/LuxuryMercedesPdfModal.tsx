import React, { useState } from "react";
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  Send,
  Sparkles,
  LayoutTemplate,
  Maximize2
} from "lucide-react";
import { LuxuryPdfReportData, generateLuxuryMercedesHtml, printLuxuryMercedesReport } from "../utils/luxuryMercedesPdf";

interface LuxuryMercedesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LuxuryPdfReportData;
  onSendEmail?: (email: string) => void;
}

export function LuxuryMercedesPdfModal({
  isOpen,
  onClose,
  data,
  onSendEmail
}: LuxuryMercedesPdfModalProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(data.orientation || "landscape");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("Amanda@aspclass.org");
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentData: LuxuryPdfReportData = {
    ...data,
    orientation
  };

  const handlePrint = () => {
    printLuxuryMercedesReport(currentData);
  };

  const handleCopyHtml = () => {
    const html = generateLuxuryMercedesHtml(currentData);
    navigator.clipboard.writeText(html);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSend = () => {
    if (onSendEmail && emailInput.trim()) {
      setIsSending(true);
      onSendEmail(emailInput.trim());
      setTimeout(() => {
        setIsSending(false);
        setShowEmailInput(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full shadow-2xl relative my-6 text-left flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-serif uppercase tracking-wide">
                  LUXURY MERCEDES-BENZ EXECUTIVE WARRANTY REPORT
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PLAYFAIR LUXURY EDITION
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {currentData.dealershipName} • RO #{currentData.roNumber || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  orientation === "portrait"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  orientation === "landscape"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Landscape
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Font: Playfair Display + Space Mono
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-slate-400">
              Logo: Halo Burst.png
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied HTML!" : "Copy Report HTML"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Email / Send</span>
            </button>
          </div>
        </div>

        {showEmailInput && (
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 animate-fade-in">
            <input
              type="email"
              placeholder="Enter recipient email (e.g. Amanda@aspclass.org)..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              {isSending ? "Dispatching..." : "Send Report"}
            </button>
          </div>
        )}

        {/* Live Document Preview Iframe */}
        <div className="flex-1 bg-slate-950 p-3 sm:p-4 overflow-y-auto">
          <div className={`mx-auto bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300 transition-all ${
            orientation === "landscape" ? "max-w-4xl" : "max-w-2xl"
          }`}>
            <iframe
              title="Luxury Mercedes Report Preview"
              srcDoc={generateLuxuryMercedesHtml(currentData)}
              className={`w-full border-none transition-all ${
                orientation === "landscape" ? "h-[580px]" : "h-[750px]"
              }`}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <div>
            Active Registry Location: <strong className="text-white">{currentData.dealershipName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {orientation === "landscape" ? "Landscape" : "Portrait"} PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

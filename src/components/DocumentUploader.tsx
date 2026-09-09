import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { processUploadedDealerDocument, ExtractedPdfResult } from "../utils/pdfExtractor";

interface DocumentUploaderProps {
  onIngestSuccess: (result: ExtractedPdfResult) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onIngestSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ExtractedPdfResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await processUploadedDealerDocument(file);
      setLastResult(result);
      if (result.success) {
        onIngestSuccess(result);
      } else if (result.error) {
        setErrorMsg(result.error);
      }
    } catch (err: any) {
      console.error("Document ingestion error:", err);
      setErrorMsg(err.message || "Failed to parse dealer document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-emerald-400" />
          Multi-Modal Document Ingestion (DMS C-File / NetStar Remittance)
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          Upload raw dealership DMS C-Files, NetStar R22 Remittance Advice PDFs, or Schedule 2200 Excel workbooks to automatically extract claims and flag variances.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-700/80 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/60"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept=".pdf,.xlsx,.xls,.csv,.txt"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-sm font-semibold text-white">Extracting Table Data & Line Items...</p>
                <p className="text-xs text-zinc-400">Processing claims, operation codes, and remittance numbers</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shadow-inner">
                  <UploadCloud className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drop your dealer document here, or <span className="text-emerald-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Supports PDF, Excel (.xlsx/.xls), CSV, and raw ASCII DMS dump files
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    CDK / Reynolds DMS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    NetStar Remittance R22
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    PXD Credit Advice
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Extraction Results Preview */}
      {lastResult && (
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Ingestion Complete: {lastResult.filename}
                </h3>
                <p className="text-xs text-zinc-400">
                  Detected Type: <span className="text-emerald-400 font-semibold">{lastResult.detectedType}</span>
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-400">
              {lastResult.numPages} Page(s) Scanned
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Claims Detected</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{lastResult.summary.totalClaimsDetected}</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Credits Detected</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{lastResult.summary.totalCreditsDetected}</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Claimed Dollars</span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                ${lastResult.summary.totalAmountClaimed.toFixed(2)}
              </span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Net Variance</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                ${lastResult.summary.varianceDeficit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Sample Lines Preview */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-zinc-300 mb-2">Raw Text Extract Sample</h4>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {lastResult.text.slice(0, 1500) || "Document content extracted successfully."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

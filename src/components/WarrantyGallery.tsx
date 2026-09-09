import React, { useState, useEffect } from "react";
import { safeGetLocalStorage } from "../lib/safeStorage";
import WarrantyCoverageDeterminator from "./WarrantyCoverageDeterminator";
import { Employee } from "../types";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Save, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  FileText, 
  Search, 
  Camera,
  Layers,
  Wrench,
  AlertOctagon,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  ExternalLink,
  Scale,
  Video,
  X
} from "lucide-react";

interface SavedAuditItem {
  id: string;
  filename: string;
  imageBase64: string;
  context: string;
  analyzedAt: string;
  analysisResult?: {
    detectedItem: string;
    partNumber: string;
    complianceCategory: string;
    auditObservations: string[];
    auditResult: "PASS" | "WARNING" | "FAIL";
    complianceIssues: string[];
    recommendation: string;
  };
}

export default function WarrantyGallery({ 
  employees,
  dealershipName 
}: { 
  employees?: Employee[];
  dealershipName?: string;
}) {
  const [galleryTab, setGalleryTab] = useState<"media" | "determinator">("determinator");

  // Saved gallery state in localStorage
  const [galleryItems, setGalleryItems] = useState<SavedAuditItem[]>(() => {
    const saved = safeGetLocalStorage("asp_warranty_gallery");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved warranty gallery items", e);
      }
    }
    return [];
  });

  const [selectedItem, setSelectedItem] = useState<SavedAuditItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // AI Image generation and refinement states
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // AI Video generation states
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenError, setVideoGenError] = useState<string | null>(null);
  
  // Custom loading message sequencing during Gemini call
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // Custom user context for the analysis
  const [customContext, setCustomContext] = useState("");

  // Input states for uploads
  const [stagedImage, setStagedImage] = useState<{ base64: string; filename: string; mimeType: string } | null>(null);

  // PDF Preview & Print Modal state
  const [previewPrintItem, setPreviewPrintItem] = useState<SavedAuditItem | null>(null);

  // Trigger dedicated printable window for saving as PDF
  const handleTriggerPrint = (itemToPrint: SavedAuditItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPreviewPrintItem(itemToPrint);
      alert("Popup was blocked by browser! Opened the PDF Report preview modal. Click 'PRINT / SAVE AS PDF' inside the modal.");
      return;
    }

    const res = itemToPrint.analysisResult;
    const statusLabel = res?.auditResult === "PASS" ? "COMPLIANCE APPROVED" : res?.auditResult === "WARNING" ? "COMPLIANCE WARNING" : "NON-COMPLIANCE DETECTED";
    const statusColor = res?.auditResult === "PASS" ? "#059669" : res?.auditResult === "WARNING" ? "#d97706" : "#dc2626";
    const statusBg = res?.auditResult === "PASS" ? "#ecfdf5" : res?.auditResult === "WARNING" ? "#fffbeb" : "#fef2f2";

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASP Warranty Compliance Inspection Report - ${itemToPrint.filename}</title>
          <style>
            @page { size: letter; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; line-height: 1.5; font-size: 12px; }
            .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .brand-title { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .brand-sub { font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
            .doc-id { text-align: right; font-family: monospace; font-size: 10px; color: #334155; line-height: 1.4; }
            
            .status-banner { display: flex; justify-content: space-between; align-items: center; background: ${statusBg}; border: 1.5px solid ${statusColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
            .status-text { font-size: 14px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .grid-container { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-bottom: 16px; }
            .image-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; background: #f8fafc; text-align: center; }
            .image-box img { max-width: 100%; max-height: 230px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; }
            .image-caption { font-size: 9px; font-family: monospace; color: #64748b; margin-top: 6px; word-break: break-all; }
            
            .data-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
            .data-label { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
            .data-val { font-size: 13px; font-weight: 800; color: #0f172a; }
            
            .section-title { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px; }
            ul { margin: 0; padding-left: 18px; }
            li { margin-bottom: 4px; color: #1e293b; font-weight: 500; }
            
            .recommendation-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px; border-radius: 0 6px 6px 0; margin-top: 8px; color: #0f172a; font-weight: 500; }
            
            .signature-section { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
            .sig-line { border-top: 1px solid #0f172a; margin-top: 32px; padding-top: 4px; font-size: 9px; color: #475569; font-weight: 700; text-transform: uppercase; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background:#0f172a; color:#fff; padding:12px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-radius:8px;">
            <span style="font-family:sans-serif; font-size:13px; font-weight:bold;">📄 ASP WARRANTY INSPECTION PDF REPORT</span>
            <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px;">
              🖨️ PRINT / SAVE AS PDF
            </button>
          </div>

          <div class="report-header">
            <div>
              <div class="brand-title">ASP Warranty Inspection Report</div>
              <div class="brand-sub">Automotive Warranty & Parts Defect Compliance Division</div>
            </div>
            <div class="doc-id">
              <strong>REPORT ID:</strong> AUDIT-${itemToPrint.id.toUpperCase()}<br/>
              <strong>STAMP DATE:</strong> ${new Date(itemToPrint.analyzedAt).toLocaleString()}
            </div>
          </div>

          <div class="status-banner">
            <div>
              <div class="status-text">${statusLabel}</div>
              <div style="font-size:10px; color:#334155; margin-top:2px;">Automated Gemini 3.5 AI Compliance Analysis & Image Scan</div>
            </div>
            <div style="font-family:monospace; font-size:11px; font-weight:bold; color:#0f172a;">
              COMPLIANCE STAMP: VERIFIED
            </div>
          </div>

          <div class="grid-container">
            <div class="image-box">
              <img src="${itemToPrint.imageBase64}" alt="Supplied Warranty Item" />
              <div class="image-caption">Supplied Image: ${itemToPrint.filename}</div>
            </div>

            <div>
              <div class="data-card">
                <div class="data-label">IDENTIFIED WARRANTY ITEM</div>
                <div class="data-val">${res?.detectedItem || itemToPrint.filename}</div>
              </div>
              
              <div class="data-card">
                <div class="data-label">ESTIMATED PART NUMBER</div>
                <div class="data-val" style="font-family:monospace;">${res?.partNumber || "N/A"}</div>
              </div>

              <div class="data-card" style="margin-bottom:0;">
                <div class="data-label">COMPLIANCE CATEGORY</div>
                <div class="data-val" style="font-size:11px;">${res?.complianceCategory || "Standard Warranty Verification"}</div>
              </div>
            </div>
          </div>

          <div class="section-title">1. VISUAL METADATA OBSERVATIONS</div>
          <ul>
            ${(res?.auditObservations || []).map(obs => `<li>${obs}</li>`).join('')}
          </ul>

          <div class="section-title">2. COMPLIANCE DEFICIENCIES & ISSUES</div>
          ${(res?.complianceIssues && res.complianceIssues.length > 0) 
            ? `<ul>${res.complianceIssues.map(iss => `<li style="color:#dc2626;"><strong>DEFICIENCY:</strong> ${iss}</li>`).join('')}</ul>`
            : `<div style="color:#16a34a; font-weight:700; padding:4px 0;">✓ No compliance deficiencies detected. Item meets standard warranty documentation requirements.</div>`
          }

          <div class="section-title">3. AUDITOR ACTION PLAN & RECOMMENDED REMEDY</div>
          <div class="recommendation-box">
            ${res?.recommendation || "Proceed with standard warranty submission."}
          </div>

          ${itemToPrint.context ? `
            <div class="section-title">4. TECHNICIAN CONTEXT NARRATIVE</div>
            <div style="font-style:italic; color:#334155; padding:6px 0; background:#f8fafc; border-radius:4px; padding:8px;">
              "${itemToPrint.context}"
            </div>
          ` : ''}

          <div class="signature-section">
            <div>
              <div class="sig-line">Service Manager / Warranty Administrator Signature</div>
            </div>
            <div>
              <div class="sig-line">Date & Dealership Official Stamp</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // Safe Persistence to localStorage with QuotaExceeded fallback
  useEffect(() => {
    const tryPersist = (items: SavedAuditItem[]) => {
      try {
        localStorage.setItem("asp_warranty_gallery", JSON.stringify(items));
      } catch (err) {
        console.warn("Storage quota exceeded when saving asp_warranty_gallery. Pruning heavy base64 payloads...", err);
        if (items.length > 0) {
          // Attempt 1: Keep active image full, but convert older image payloads (>80KB) to lightweight SVGs
          const pruned = items.map((item, idx) => {
            if (idx === 0) return item; // Keep newest item intact
            return {
              ...item,
              imageBase64: item.imageBase64.length > 80000 
                ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' fill='%230f172a'><rect width='100%' height='100%' fill='%230f172a'/><text x='50%' y='50%' fill='%2394a3b8' font-family='sans-serif' font-size='12' text-anchor='middle'>Image Stored in Active Session</text></svg>"
                : item.imageBase64
            };
          });

          try {
            localStorage.setItem("asp_warranty_gallery", JSON.stringify(pruned));
          } catch (innerErr) {
            // Attempt 2: Keep only the 3 most recent items
            try {
              localStorage.setItem("asp_warranty_gallery", JSON.stringify(items.slice(0, 3)));
            } catch {
              // Attempt 3: Clear storage key safely if full, without crashing React
              try {
                localStorage.removeItem("asp_warranty_gallery");
              } catch {
                // Ignore storage error
              }
            }
          }
        }
      }
    };

    tryPersist(galleryItems);
  }, [galleryItems]);

  // Loading message animator
  useEffect(() => {
    if (!isAnalyzing) return;
    const messages = [
      "ASP COMPLIANCE LINK SECURED. INITIATING GEMINI DEEP SCAN...",
      "EXTRACTING PHYSICAL AND GEOMETRIC TEXTURES FROM WARRANTY ITEM...",
      "ANALYZING METALLURGICAL STRUCTURAL DEFECTS & IMPACT MARKS...",
      "VERIFYING AUDIT COMPLIANCE STANDARDS & CHECKSUMS...",
      "COMPILING DETAILED WARRANTY SUBMISSION RECOMMENDATION..."
    ];
    setLoadingMessage(messages[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2800);
  
  return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Helper to convert base64 (or local images) to staging
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setStagedImage({
        base64: reader.result as string,
        filename: file.name,
        mimeType: file.type || "image/jpeg"
      });
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Error reading uploaded file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processSelectedFile(file);
    } else {
      alert("Please upload a valid image file.");
    }
  };

  // Triggering the Gemini analysis API
  const analyzeImageWithGemini = async () => {
    if (!stagedImage) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/gemini/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64: stagedImage.base64,
          mimeType: stagedImage.mimeType,
          filename: stagedImage.filename,
          context: customContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server returned an error status");
      }

      const result = await response.json();
      
      // Save item to gallery
      const newAuditItem: SavedAuditItem = {
        id: "item-" + Date.now(),
        filename: stagedImage.filename,
        imageBase64: stagedImage.base64,
        context: customContext,
        analyzedAt: new Date().toISOString(),
        analysisResult: result
      };

      setGalleryItems(prev => [newAuditItem, ...prev]);
      setSelectedItem(newAuditItem);
      // Clear staged image input
      setStagedImage(null);
      setCustomContext("");

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this analyzed item from your local warranty gallery?")) {
      setGalleryItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleGenerateOrRefineImage = async (refine: boolean) => {
    if (!imagePrompt.trim()) {
      alert("Please enter a description or refinement prompt.");
      return;
    }
    
    setIsGeneratingImage(true);
    setGenError(null);

    try {
      const bodyPayload: any = {
        prompt: imagePrompt,
        aspectRatio: imageAspectRatio
      };

      if (refine) {
        if (!stagedImage) {
          alert("No staged image to refine.");
          setIsGeneratingImage(false);
          return;
        }
        bodyPayload.baseImage = stagedImage.base64;
        bodyPayload.mimeType = stagedImage.mimeType;
      }

      const response = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image generation server error");
      }

      const result = await response.json();
      
      if (result.success && result.imageBase64) {
        const isSvg = result.imageBase64.startsWith("data:image/svg");
        setStagedImage({
          base64: result.imageBase64,
          filename: refine 
            ? `refined_${stagedImage?.filename || "photo"}` 
            : `ai_schematic_${Date.now()}.${isSvg ? "svg" : "png"}`,
          mimeType: isSvg ? "image/svg+xml" : "image/png"
        });
        setImagePrompt(""); // clear prompt
      } else {
        throw new Error("No image was returned from the generator endpoint.");
      }

    } catch (err: any) {
      console.error(err);
      setGenError(err.message || "An unexpected error occurred during image compilation.");
    } finally {
      setIsGeneratingImage(false);
    }
  };


  const handleGenerateVideo = async () => {
    if (!stagedImage) {
      alert("Please upload or generate a photo to animate into a video.");
      return;
    }
    
    setIsVideoGenerating(true);
    setVideoGenError(null);
    setGeneratedVideoUrl(null);

    try {
      const response = await fetch("/api/gemini/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: imagePrompt || "Animate this image realistically",
          aspectRatio: imageAspectRatio === "1:1" ? "16:9" : imageAspectRatio, // 16:9 or 9:16 supported
          baseImage: stagedImage.base64,
          mimeType: stagedImage.mimeType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Video generation server error");
      }
      
      const result = await response.json();
      
      if (result.success && result.videoBase64) {
        setGeneratedVideoUrl(result.videoBase64);
      } else if (result.success && result.videoUri) {
        setGeneratedVideoUrl(result.videoUri);
      } else {
        throw new Error("No video was returned from the generator endpoint.");
      }
    } catch (err: any) {
      console.error(err);
      setVideoGenError(err.message || "An unexpected error occurred during video compilation.");
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-playfair bg-black text-white">
      {/* Brand & Section Header with Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between p-6 sm:p-8 bg-[#08080a] rounded-2xl border border-white/15 shadow-2xl gap-4">
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.2em] text-slate-300 mb-1">
            ASP Command System // Warranty & Diagnostic Intelligence
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
            {galleryTab === "determinator" ? "ASP Warranty Coverage Determinator" : "Warranty Media Lab"}
          </h2>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#000000] p-1.5 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => setGalleryTab("determinator")}
            className={`px-4 py-2 rounded-lg text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              galleryTab === "determinator"
                ? "bg-white text-black shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Scale size={14} className={galleryTab === "determinator" ? "text-black" : "text-slate-300"} />
            Coverage Determinator
          </button>
          <button
            type="button"
            onClick={() => setGalleryTab("media")}
            className={`px-4 py-2 rounded-lg text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              galleryTab === "media"
                ? "bg-white text-black shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <ImageIcon size={14} className={galleryTab === "media" ? "text-black" : "text-slate-300"} />
            Media & AI Studio
          </button>
        </div>
      </div>

      {/* RENDER COVERAGE DETERMINATOR VIEW */}
      {galleryTab === "determinator" && (
        <WarrantyCoverageDeterminator employees={employees} dealershipName={dealershipName} />
      )}

      {/* RENDER MEDIA LAB VIEW */}
      {galleryTab === "media" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT WORKSPACE: UPLOAD ZONE & SAVED GALLERY (SPAN 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* DRAG-AND-DROP UPLOADER ZONE */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 mb-4 flex items-center gap-2">
              <Upload size={14} className="text-blue-500" />
              UPLOAD WARRANTY ITEM IMAGE
            </h3>

            {/* Visual Box */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 p-8 rounded-xl bg-slate-950/80 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center min-h-[160px]"
            >
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                  <span className="text-xs text-slate-300 font-mono font-bold">Staging upload file...</span>
                </>
              ) : (
                <>
                  <Camera className="w-10 h-10 text-slate-600 group-hover:text-blue-400 mb-3 transition-colors" />
                  <div className="text-xs font-mono text-slate-300 font-bold">Drag & drop photo here, or browse</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Supports parts photos, invoices, and diagnostic screens</div>
                </>
              )}
            </div>
          </div>

          {/* AI PHOTO GENERATOR & REFINER */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              AI PHOTO GENERATOR & REFINER
            </h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase">
              Synthesize parts images or edit existing staged photos using Gemini 3.1 Image model.
            </p>

            <div className="space-y-3">
              {/* Prompt textarea */}
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., 'A rusty cracked Mercedes brake disc on a dark workbench' or 'Add rust and damage circle highlights'..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-purple-500 outline-none resize-none placeholder:text-slate-600"
              />

              {/* Aspect Ratio selector */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ASPECT RATIO</span>
                <div className="flex gap-1">
                  {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setImageAspectRatio(ratio)}
                      className={`px-2 py-1 text-[10px] font-mono rounded border ${
                        imageAspectRatio === ratio 
                          ? "bg-purple-950/60 text-purple-400 border-purple-500/40" 
                          : "bg-slate-950/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"
                      } transition-colors`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleGenerateOrRefineImage(false)}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isGeneratingImage && !stagedImage ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  GENERATE NEW
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateOrRefineImage(true)}
                  disabled={isGeneratingImage || !stagedImage || !imagePrompt.trim()}
                  className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-mono text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isGeneratingImage && stagedImage ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} className="text-purple-400" />
                  )}
                  REFINE STAGED
                </button>
              </div>

              {/* VEO VIDEO GENERATOR BUTTON */}
              <div className="pt-2 border-t border-slate-800/60 mt-4">
                <h3 className="text-[10px] font-mono font-bold tracking-widest text-slate-300 flex items-center gap-2 mb-2 uppercase">
                   Animate Image into Video (Veo)
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isVideoGenerating || !stagedImage}
                  className="w-full bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/40 text-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isVideoGenerating ? (
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                  ) : (
                    <Sparkles size={14} className="text-cyan-400" />
                  )}
                  {isVideoGenerating ? "GENERATING VEO CLIP (MAY TAKE 30s)..." : "ANIMATE STAGED PHOTO (16:9 / 9:16)"}
                </button>
                {videoGenError && (
                  <div className="p-3 mt-2 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-mono text-rose-300">{videoGenError}</p>
                  </div>
                )}
                {generatedVideoUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-400 z-10 flex items-center gap-1 border border-cyan-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> VEO OUTPUT
                    </div>
                    <video 
                      src={generatedVideoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-auto object-cover max-h-[300px] bg-black"
                    />
                  </div>
                )}
              </div>


              {/* Status or error display */}
              {isGeneratingImage && (
                <div className="text-[10px] text-purple-400 font-mono font-bold animate-pulse text-center">
                  COMPILING PIXELS IN THE CLOUD WITH VEO LITE...
                </div>
              )}

              {genError && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-[10px] text-rose-400 font-mono leading-normal">
                  <div className="font-bold uppercase mb-0.5">GENERATOR ERROR:</div>
                  {genError}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE IMAGE COMPREHENSIVE CONTROL (IF IMAGE STAGED) */}
          {stagedImage && (
            <div className="bg-slate-900/60 border border-blue-500/40 p-5 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded font-mono font-bold">
                  STAGED FOR AUDIT ANALYSIS
                </span>
                <button 
                  onClick={() => setStagedImage(null)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </div>

              {/* Thumb */}
              <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-800 relative bg-black">
                <img 
                  src={stagedImage.base64} 
                  alt="Staged" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] font-mono text-slate-300">
                <span className="text-slate-500">File:</span> {stagedImage.filename}
              </div>

              {/* User Context notes input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                  Audit Context & Technician Narratives (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Type any specific details, repair descriptions, repair order notes, or customer concerns to guide the compliance auditor..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-blue-500 outline-none resize-none placeholder:text-slate-600"
                />
              </div>

              {/* Analyze button */}
              <button
                onClick={analyzeImageWithGemini}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-mono text-xs font-bold py-3 rounded-xl shadow-lg shadow-blue-950 transition-colors uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    ANALYZING COMPLIANCE MATRIX...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="animate-pulse" />
                    RUN GEMINI COMPLIANCE AUDIT
                  </>
                )}
              </button>
            </div>
          )}

          {/* HISTORICAL WORK GALLERY */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-300 mb-1 flex items-center gap-2">
              <ImageIcon size={14} className="text-emerald-500" />
              SAVED WARRANTY AUDIT HISTORY ({galleryItems.length})
            </h3>

            {galleryItems.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 border border-slate-900 rounded-xl">
                <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">No items audited yet</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">Upload a parts photo to run the Gemini warranty compliance checker.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {galleryItems.map((item, itemIdx) => {
                  const auditRes = item.analysisResult;
                  const borderClass = auditRes?.auditResult === "PASS" 
                    ? "border-emerald-500/20 hover:border-emerald-500" 
                    : auditRes?.auditResult === "WARNING" 
                      ? "border-yellow-500/20 hover:border-yellow-500" 
                      : "border-rose-500/20 hover:border-rose-500";
                  
                  const statusColor = auditRes?.auditResult === "PASS" 
                    ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/30" 
                    : auditRes?.auditResult === "WARNING" 
                      ? "text-yellow-400 bg-yellow-950/40 border-yellow-800/30" 
                      : "text-rose-400 bg-rose-950/40 border-rose-800/30";

                  return (
                    <div
                      key={`gallery-item-${item.id}-${itemIdx}`}
                      onClick={() => setSelectedItem(item)}
                      className={`group relative flex flex-col p-2 bg-slate-950 rounded-xl border ${borderClass} ${selectedItem?.id === item.id ? "ring-2 ring-blue-500 border-transparent" : ""} transition-all duration-200 cursor-pointer overflow-hidden`}
                    >
                      {/* image thumnail */}
                      <div className="w-full h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative">
                        <img 
                          src={item.imageBase64} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {auditRes?.auditResult && (
                          <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${statusColor}`}>
                            {auditRes.auditResult}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="mt-2 text-left">
                        <div className="text-[10px] font-black text-slate-200 truncate font-sans">
                          {auditRes?.detectedItem || item.filename}
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase flex justify-between items-center">
                          <span>{new Date(item.analyzedAt).toLocaleDateString()}</span>
                          <button 
                            onClick={(e) => deleteItem(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 px-1 py-0.5 rounded transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT WORKSPACE: LIVE INTERACTIVE COMPLIANCE REPORT CONSOLE (SPAN 7) */}
        <div className="lg:col-span-7 h-full">
          
          {/* LOGIC ROUTING PANEL */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl h-full min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(30,41,59,0.2),rgba(0,0,0,0))] pointer-events-none"></div>

            {/* Header telemetry info */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-6 relative z-10">
              <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider">
                ASP COMPLIANCE GRAPHICAL DIAGNOSTICS & TELEMETRY
              </span>
              <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                {selectedItem ? "Report Opened" : "Audit Idle"}
              </span>
            </div>

            {/* LIVE DISPLAY */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
              
              {/* STATE 1: ACTIVE ANALYZING GEMINI */}
              {isAnalyzing && (
                <div className="text-center py-16 space-y-6 animate-pulse">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    {/* Ring glow */}
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-slate-800 animate-spin"></div>
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black font-mono text-blue-400 tracking-widest">
                      AI COMPLIANCE SCROLL ACTIVE
                    </h4>
                    <p className="text-xs font-mono text-slate-500 max-w-md mx-auto uppercase tracking-wider leading-relaxed">
                      {loadingMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 2: ERROR OCCURRED */}
              {analysisError && !isAnalyzing && (
                <div className="p-6 rounded-xl border border-rose-500/20 bg-rose-950/20 text-center max-w-lg mx-auto space-y-3 animate-fade-in">
                  <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-black font-mono text-rose-400">AUDIT INTERRUPTED</h4>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed uppercase tracking-wider">
                    {analysisError}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ensure your GEMINI_API_KEY is properly set up in the secrets panel and your server connection is alive.
                  </p>
                </div>
              )}

              {/* STATE 3: NO ITEM SELECTED & IDLE */}
              {!selectedItem && !isAnalyzing && !analysisError && (
                <div className="text-center py-20 max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-7 h-7 text-slate-700 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black font-sans text-slate-400 uppercase tracking-wider">Audit Console Standby</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-mono uppercase">
                      Select any previously saved warranty audit from your history panel or upload an image and launch the AI analyzer.
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 4: REPORT REPORT SUMMARY */}
              {selectedItem && !isAnalyzing && !analysisError && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Top Header info (Compliance Category, Status, Code) */}
                  {selectedItem.analysisResult && (() => {
                    const res = selectedItem.analysisResult;
                    const statusConfig = res.auditResult === "PASS"
                      ? {
                          color: "text-emerald-400",
                          border: "border-emerald-500/30",
                          bg: "bg-emerald-950/30",
                          indicator: "bg-emerald-400 shadow-[0_0_10px_#10b981]",
                          icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
                          label: "COMPLIANCE APPROVED"
                        }
                      : res.auditResult === "WARNING"
                        ? {
                            color: "text-yellow-400",
                            border: "border-yellow-500/30",
                            bg: "bg-yellow-950/30",
                            indicator: "bg-yellow-400 shadow-[0_0_10px_#f59e0b]",
                            icon: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
                            label: "COMPLIANCE WARNING"
                          }
                        : {
                            color: "text-rose-500",
                            border: "border-rose-500/30",
                            bg: "bg-rose-950/30",
                            indicator: "bg-rose-500 shadow-[0_0_10px_#f43f5e]",
                            icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
                            label: "NON-COMPLIANCE DETECTED"
                          };

                    return (
                      <div className="space-y-6">
                        {/* PDF REPORT ACTION BAR */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <span className="text-xs font-mono font-bold text-slate-200 block uppercase tracking-wider">
                                PDF WARRANTY REPORT GENERATOR
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Export full compliance document with supplied image & findings
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewPrintItem(selectedItem)}
                              className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-[11px] font-mono font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                            >
                              <Eye size={13} />
                              PREVIEW
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerPrint(selectedItem)}
                              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] font-mono font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-950 transition-colors cursor-pointer"
                            >
                              <Printer size={14} />
                              PRINT / SAVE PDF
                            </button>
                          </div>
                        </div>

                        {/* Status Strip */}
                        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border ${statusConfig.border} ${statusConfig.bg} gap-3`}>
                          <div className="flex items-center gap-2.5">
                            {statusConfig.icon}
                            <div>
                              <div className={`text-xs font-black font-mono uppercase tracking-wider ${statusConfig.color}`}>
                                {statusConfig.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                                AUDIT STAMP: {new Date(selectedItem.analyzedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className={`w-3.5 h-3.5 rounded-full ${statusConfig.indicator}`}></span>
                        </div>

                        {/* Title of detected item */}
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-wider mb-0.5">IDENTIFIED WARRANTY ITEM</span>
                            <h4 className="text-sm font-black text-white">{res.detectedItem}</h4>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-wider mb-0.5">ESTIMATED PART NUMBER</span>
                            <h4 className="text-xs font-mono font-bold text-slate-300">{res.partNumber}</h4>
                          </div>
                        </div>

                        {/* Split Observations and Issues */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Visual Observations */}
                          <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2.5">
                            <span className="text-[9px] font-mono font-bold text-blue-400 block uppercase tracking-widest">VISUAL METADATA DETECTED</span>
                            <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono font-bold leading-normal">
                              {res.auditObservations.map((obs, idx) => (
                                <li key={`obs-${idx}-${obs.slice(0, 15)}`} className="flex items-start gap-1.5">
                                  <span className="text-blue-500 text-xs shrink-0 select-none">•</span>
                                  <span>{obs}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Compliance Issues */}
                          <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2.5">
                            <span className="text-[9px] font-mono font-bold text-rose-400 block uppercase tracking-widest">COMPLIANCE DEFICIENCIES</span>
                            {res.complianceIssues.length === 0 ? (
                              <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                                <CheckCircle size={12} />
                                NO AUDIT DISCREPANCIES DETECTED
                              </div>
                            ) : (
                              <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono font-bold leading-normal">
                                {res.complianceIssues.map((issue, idx) => (
                                  <li key={`issue-${idx}-${issue.slice(0, 15)}`} className="flex items-start gap-1.5">
                                    <span className="text-rose-500 text-xs shrink-0 select-none">•</span>
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Actionable recommendation */}
                        <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-xl space-y-2.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-widest">AUDITOR ACTION PLAN & REMEDY</span>
                          <p className="text-xs text-slate-300 font-mono leading-relaxed">
                            {res.recommendation}
                          </p>
                        </div>

                        {/* Staged Notes Context */}
                        {selectedItem.context && (
                          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg text-[10px] text-slate-500 font-mono">
                            <span className="text-slate-400 font-bold block mb-1">USER SUPPLIED CONTEXT NOTES:</span>
                            <p className="italic">"{selectedItem.context}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Bottom metadata tag */}
            <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[8px] font-mono text-slate-600 relative z-10">
              <span>ASP CORE AI SERVICES • COMPLIANCE AGENT 3.5</span>
              <span>STABILITY CHECKS: SECURE ENDPOINT</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ON-SCREEN PDF REPORT PREVIEW MODAL */}
      {previewPrintItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-left space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  PDF REPORT DOCUMENT PREVIEW
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewPrintItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Sheet Simulation */}
            <div className="bg-white text-slate-900 rounded-xl p-6 font-sans text-xs shadow-inner space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    ASP WARRANTY INSPECTION REPORT
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    AUTOMOTIVE WARRANTY & PARTS DEFECT COMPLIANCE DIVISION
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-600 leading-tight">
                  <p><strong>REPORT ID:</strong> AUDIT-{previewPrintItem.id.toUpperCase()}</p>
                  <p><strong>DATE:</strong> {new Date(previewPrintItem.analyzedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`p-3 rounded-lg border flex justify-between items-center ${
                previewPrintItem.analysisResult?.auditResult === "PASS"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : previewPrintItem.analysisResult?.auditResult === "WARNING"
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-rose-50 border-rose-300 text-rose-800"
              }`}>
                <div>
                  <span className="font-black text-sm uppercase tracking-wider block">
                    {previewPrintItem.analysisResult?.auditResult === "PASS" ? "COMPLIANCE APPROVED" : previewPrintItem.analysisResult?.auditResult === "WARNING" ? "COMPLIANCE WARNING" : "NON-COMPLIANCE DETECTED"}
                  </span>
                  <span className="text-[10px] opacity-80">Official Gemini 3.5 AI Compliance Analysis & Image Scan</span>
                </div>
                <div className="font-mono text-xs font-bold uppercase border px-2 py-1 rounded bg-white/60">
                  STAMP: VERIFIED
                </div>
              </div>

              {/* Supplied Image & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 text-center">
                  <img 
                    src={previewPrintItem.imageBase64} 
                    alt="Supplied Part" 
                    className="max-h-48 w-full object-contain rounded border border-slate-200 bg-black/5" 
                  />
                  <p className="text-[9px] font-mono text-slate-500 mt-1 truncate">
                    Supplied Image: {previewPrintItem.filename}
                  </p>
                </div>
                <div className="space-y-2 font-mono">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] font-bold text-slate-500 block uppercase">IDENTIFIED WARRANTY ITEM</span>
                    <span className="text-xs font-bold text-slate-900">{previewPrintItem.analysisResult?.detectedItem || previewPrintItem.filename}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] font-bold text-slate-500 block uppercase">ESTIMATED PART NUMBER</span>
                    <span className="text-xs font-bold text-slate-900">{previewPrintItem.analysisResult?.partNumber || "N/A"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] font-bold text-slate-500 block uppercase">COMPLIANCE CATEGORY</span>
                    <span className="text-xs font-bold text-slate-900">{previewPrintItem.analysisResult?.complianceCategory || "Standard Verification"}</span>
                  </div>
                </div>
              </div>

              {/* Visual Observations */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
                  1. VISUAL METADATA OBSERVATIONS
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
                  {previewPrintItem.analysisResult?.auditObservations.map((obs, idx) => (
                    <li key={idx}>{obs}</li>
                  ))}
                </ul>
              </div>

              {/* Deficiencies */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
                  2. COMPLIANCE DEFICIENCIES & ISSUES
                </h4>
                {previewPrintItem.analysisResult?.complianceIssues.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-rose-700 font-bold">
                    {previewPrintItem.analysisResult.complianceIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-700 font-bold">✓ No compliance deficiencies detected.</p>
                )}
              </div>

              {/* Recommendation */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
                  3. AUDITOR ACTION PLAN & REMEDY
                </h4>
                <div className="p-3 bg-slate-100 border-l-4 border-blue-600 rounded-r font-medium text-slate-800">
                  {previewPrintItem.analysisResult?.recommendation}
                </div>
              </div>

              {previewPrintItem.context && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
                    4. TECHNICIAN CONTEXT NARRATIVE
                  </h4>
                  <p className="italic text-slate-600 bg-slate-50 p-2 rounded">
                    "{previewPrintItem.context}"
                  </p>
                </div>
              )}

              {/* Signature Block */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-6">
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Service Manager / Warranty Administrator Signature
                </div>
                <div className="border-t border-slate-900 pt-1 text-[9px] font-bold text-slate-500 uppercase">
                  Date & Dealership Official Stamp
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewPrintItem(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                CLOSE PREVIEW
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTriggerPrint(previewPrintItem);
                  setPreviewPrintItem(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-950 transition-colors cursor-pointer"
              >
                <Printer size={15} />
                PRINT / SAVE AS PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


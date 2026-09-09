import React, { useState } from "react";
import { 
  Play, 
  ExternalLink, 
  Sparkles, 
  Database,
  ArrowRight,
  RefreshCw,
  Car,
  Users,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { ErrorRecord } from "../types";

interface AppIntroductionProps {
  onNavigateToTab: (tab: string) => void;
  records?: ErrorRecord[];
}

export default function AppIntroduction({ onNavigateToTab }: AppIntroductionProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const videoDriveUrl = "https://drive.google.com/file/d/17uh1TVXNJvQ0ATviZhT6-Wur0s9CpCG9/view?usp=drive_link";
  const videoEmbedUrl = "https://drive.google.com/file/d/17uh1TVXNJvQ0ATviZhT6-Wur0s9CpCG9/preview";

  const reloadIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-20 animate-fade-in text-white bg-black">
      
      {/* HERO SECTION */}
      <section className="max-w-4xl space-y-6 pt-4">
        <div className="inline-flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
            Operations Orientation 2024
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] animate-pulse"></span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight leading-[1.05]">
          Operations Guide &amp; Application Entry
        </h1>

        <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
          Explore the core workflow, accounting ledger reconciliation, DMS character offset calculations, and report consolidation tools designed for zero chargebacks.
        </p>

        {/* CONTROLS ROW */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button
            onClick={() => onNavigateToTab("database")}
            className="btn-luxury cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Go to Master Schedule</span>
          </button>
          
          <button
            onClick={() => onNavigateToTab("garage")}
            className="btn-luxury btn-luxury-ghost cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 opacity-80" />
            <span>Review Accounting</span>
          </button>
          
          <button
            onClick={() => onNavigateToTab("directory")}
            className="btn-luxury btn-luxury-ghost cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 opacity-80" />
            <span>Personnel Directory</span>
          </button>
        </div>
      </section>

      {/* VIDEO CONTAINER */}
      <section className="border border-white/12 bg-[#050505] p-6 sm:p-8 rounded-none relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 mb-6 border-b border-white/12 gap-3">
          <div>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-normal">
              Orientation Video Walkthrough
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/50 block mt-1">
              HD Source: Google Drive Cloud Stream
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#00FF94]">
            <span className="w-2 h-2 rounded-full bg-[#00FF94] animate-pulse"></span>
            <span>Stream Ready</span>
          </div>
        </div>

        {/* 16:9 Aspect Ratio Video Frame */}
        <div className="relative w-full aspect-video bg-black border border-white/12 overflow-hidden">
          <iframe
            key={iframeKey}
            src={videoEmbedUrl}
            title="App Introduction & Restructure Orientation Video"
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>

        <div className="mt-4 font-mono text-[11px] text-white/40 leading-relaxed max-w-2xl flex items-start gap-2">
          <span>*</span>
          <span>Notice: If the video player displays a permissions notice, use the direct link button to view in Google Drive.</span>
        </div>
      </section>

      {/* STATUS PANE - 2 Column Split Card Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/12 border border-white/12">
        <div className="bg-black p-8 sm:p-10 space-y-3">
          <h3 className="font-serif text-xl sm:text-2xl text-white font-normal">
            Relocated KPI Metrics
          </h3>
          <p className="text-white/60 text-sm leading-relaxed font-sans">
            Access live DMS accounting audit calculations, KPI roadmap, and operations flow in the Garage view.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab("garage")}
              className="text-xs font-mono text-white/80 hover:text-white uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Garage Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-black p-8 sm:p-10 space-y-3">
          <h3 className="font-serif text-xl sm:text-2xl text-white font-normal">
            Report Consolidation
          </h3>
          <p className="text-white/60 text-sm leading-relaxed font-sans">
            Automated reconciliation tools for monthly claim submission and technician performance data.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab("database")}
              className="text-xs font-mono text-white/80 hover:text-white uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Audit Reports in Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER COMPLIANCE BAR */}
      <footer className="border-t border-white/12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-white/40">
          <ShieldCheck className="w-4 h-4 text-white/50" />
          <span>v4.3.2 // Systematic Tracking</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={videoDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-luxury btn-luxury-ghost text-[11px] py-2 px-3.5 border-transparent hover:border-white/20"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Direct Video Link</span>
          </a>
          <a
            href={videoDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-luxury btn-luxury-ghost text-[11px] py-2 px-3.5 border-transparent hover:border-white/20"
          >
            <span>Open in Drive</span>
          </a>
          <button
            onClick={reloadIframe}
            className="btn-luxury btn-luxury-ghost text-[11px] py-2 px-3.5 border-transparent hover:border-white/20 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Player</span>
          </button>
        </div>
      </footer>

    </div>
  );
}


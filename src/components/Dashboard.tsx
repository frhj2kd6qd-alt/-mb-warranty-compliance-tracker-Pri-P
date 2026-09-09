import React, { useState } from "react";
import { ErrorCategory, ErrorRecord, Employee } from "../types";
import mainDashBg from "../assets/images/asp day time dashboard.png";
import nightDashBg from "../assets/images/asp night time dashboard.png";
import commandCenterBg from "../assets/images/command-center-bg.png";
import cleanGarageBg from "../assets/images/clean garage.png";
import gatewayBg from "../assets/mb central warranty gateway.png";
import { 
  Image as ImageIcon, 
  CheckCircle2, 
  Sparkles
} from "lucide-react";

export type CockpitTheme = "DAY_COCKPIT" | "NIGHT_COCKPIT" | "COMMAND_CENTER" | "GARAGE_STUDIO" | "WARRANTY_GATEWAY";

interface DashboardProps {
  records: ErrorRecord[];
  employees: Employee[];
  onPromptInput?: (category: ErrorCategory) => void;
  onNavigateToTab?: (tab: string, focusTarget?: string) => void;
  onAddRecord?: (record: any) => void;
}

export default function Dashboard({ records, employees, onPromptInput, onNavigateToTab, onAddRecord }: DashboardProps) {
  // Theme and imagery swapping state
  const [activeTheme, setActiveTheme] = useState<CockpitTheme>("DAY_COCKPIT");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <div 
      className="w-full flex flex-col items-center justify-start p-0 mb-8 bg-[#000000] font-playfair text-white select-none" 
      id="compliance-dashboard-imagery-wrapper"
    >
      {/* 16:9 Aspect Ratio Frame with selectable background imagery */}
      <div 
        className="relative w-full aspect-[16/9] bg-[#000000] rounded-2xl overflow-hidden transition-all duration-500 shrink-0 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.95)]"
        id="dashboard-frame"
      >
        {/* Multi-Theme Imagery Swapper Stack */}
        <img 
          src={mainDashBg} 
          alt="Mercedes Cockpit Day" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none transition-opacity duration-700"
          style={{ opacity: activeTheme === "DAY_COCKPIT" ? 1 : 0 }}
        />
        <img 
          src={nightDashBg} 
          alt="Mercedes Cockpit Night" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none transition-opacity duration-700"
          style={{ opacity: activeTheme === "NIGHT_COCKPIT" ? 1 : 0 }}
        />
        <img 
          src={commandCenterBg} 
          alt="Command Center" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none transition-opacity duration-700"
          style={{ opacity: activeTheme === "COMMAND_CENTER" ? 1 : 0 }}
        />
        <img 
          src={cleanGarageBg} 
          alt="Precision Clean Garage" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none transition-opacity duration-700"
          style={{ opacity: activeTheme === "GARAGE_STUDIO" ? 1 : 0 }}
        />
        <img 
          src={gatewayBg} 
          alt="MB Central Gateway" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none transition-opacity duration-700"
          style={{ opacity: activeTheme === "WARRANTY_GATEWAY" ? 1 : 0 }}
        />

        {/* Real-time screen glare & contrast reflection layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/50 pointer-events-none z-10" />

        {/* TOP COCKPIT CONTROLS & IMAGERY THEME SWAPPER */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {/* Theme Swapper Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-black/85 hover:bg-black/95 border border-white/20 hover:border-white/40 rounded-full shadow-2xl backdrop-blur-md text-xs font-serif tracking-wider font-semibold text-white transition-all cursor-pointer"
              title="Swap cockpit & studio background theme"
            >
              <ImageIcon className="w-3.5 h-3.5 text-white" />
              <span>Theme: {activeTheme.replace("_", " ")}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-[#08080a]/95 border border-white/20 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl space-y-1">
                <div className="text-[11px] font-serif font-bold text-slate-300 px-2 py-1 tracking-wider uppercase border-b border-white/10">
                  Select Visual Atmosphere
                </div>
                {[
                  { id: "DAY_COCKPIT", label: "☀️ Cockpit Day Telematics" },
                  { id: "NIGHT_COCKPIT", label: "🌙 Cockpit Night HUD" },
                  { id: "COMMAND_CENTER", label: "🖥️ Command Center" },
                  { id: "GARAGE_STUDIO", label: "🏎️ High-Tech Workshop" },
                  { id: "WARRANTY_GATEWAY", label: "🌐 Central Gateway" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTheme(t.id as CockpitTheme);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-serif transition-all flex items-center justify-between cursor-pointer ${
                      activeTheme === t.id 
                        ? 'bg-white text-black font-bold' 
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{t.label}</span>
                    {activeTheme === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Day / Night Toggle */}
          <div className="flex items-center bg-black/85 border border-white/20 rounded-full shadow-2xl p-1 backdrop-blur-md">
            <button
              onClick={() => setActiveTheme("DAY_COCKPIT")}
              className={`px-3 py-1 rounded-full text-xs font-serif tracking-wider font-bold transition-all cursor-pointer ${
                activeTheme === "DAY_COCKPIT" 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              DAY
            </button>
            <button
              onClick={() => setActiveTheme("NIGHT_COCKPIT")}
              className={`px-3 py-1 rounded-full text-xs font-serif tracking-wider font-bold transition-all cursor-pointer ${
                activeTheme === "NIGHT_COCKPIT" 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              NIGHT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

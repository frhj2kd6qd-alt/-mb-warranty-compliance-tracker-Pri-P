import React, { useState, useMemo } from "react";
import { ErrorCategory, ErrorRecord, Employee, SeverityLevel, SeverityColor } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Users, 
  Calendar, 
  Activity, 
  UserCheck, 
  AlertTriangle, 
  Filter, 
  Info,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface ComplianceHeatmapProps {
  records: ErrorRecord[];
  employees: Employee[];
}

export default function ComplianceHeatmap({ records, employees }: ComplianceHeatmapProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [hoveredCell, setHoveredCell] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    count: number;
    highestSeverity?: SeverityLevel;
    highestSeverityColor?: SeverityColor;
    errorDetails: string[];
  } | null>(null);

  // 1. Generate the last 30 days ending today (July 10, 2026 or current calendar time)
  const last30Days = useMemo(() => {
    const dates = [];
    // We anchor around current date
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  }, []);

  const dateRangeString = useMemo(() => {
    if (last30Days.length === 0) return "";
    const firstDate = new Date(last30Days[0]);
    const lastDate = new Date(last30Days[last30Days.length - 1]);
    
    const format = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${format(firstDate)} – ${format(lastDate)}`;
  }, [last30Days]);

  // 2. Filter records within the 30-day window
  const recordsInLast30Days = useMemo(() => {
    const set30 = new Set(last30Days);
    return records.filter(r => set30.has(r.date));
  }, [records, last30Days]);

  // 3. Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [employees, searchTerm]);

  // 4. Group error records by employee and date
  const employeeDateMap = useMemo(() => {
    // key: employeeName_YYYY-MM-DD -> list of records
    const map: Record<string, ErrorRecord[]> = {};
    
    recordsInLast30Days.forEach(rec => {
      // Skip if category filter is active
      if (categoryFilter !== "ALL" && rec.category !== categoryFilter) {
        return;
      }
      
      const key = `${rec.employeeName.trim()}_${rec.date}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(rec);
    });
    
    return map;
  }, [recordsInLast30Days, categoryFilter]);

  // 5. Aggregate statistics for the dashboard header
  const stats = useMemo(() => {
    const totalDeviations = recordsInLast30Days.length;
    
    // Find top category
    const catCount: Record<string, number> = {};
    let topCat = "N/A";
    let maxCat = 0;
    
    // Find most active day
    const dayCount: Record<string, number> = {};
    let peakDay = "N/A";
    let maxDayCount = 0;

    // Compliant employees (0 errors in last 30 days)
    const activeStaffWithErrors = new Set(recordsInLast30Days.map(r => r.employeeName.trim()));
    const compliantCount = employees.filter(emp => !activeStaffWithErrors.has(emp.name.trim())).length;

    recordsInLast30Days.forEach(rec => {
      catCount[rec.category] = (catCount[rec.category] || 0) + 1;
      if (catCount[rec.category] > maxCat) {
        maxCat = catCount[rec.category];
        topCat = rec.category;
      }

      dayCount[rec.date] = (dayCount[rec.date] || 0) + 1;
      if (dayCount[rec.date] > maxDayCount) {
        maxDayCount = dayCount[rec.date];
        peakDay = rec.date;
      }
    });

    const formatPeakDay = peakDay !== "N/A" 
      ? new Date(peakDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "N/A";

    const catLabels: Record<string, string> = {
      [ErrorCategory.TECHNICIAN]: "Technician",
      [ErrorCategory.ADVISOR]: "Service Advisor",
      [ErrorCategory.DENIAL]: "Audit Denial"
    };

    return {
      total: totalDeviations,
      peakDay: formatPeakDay,
      peakDayCount: maxDayCount,
      topCategory: catLabels[topCat] || topCat,
      compliantCount,
      complianceRate: employees.length > 0 
        ? Math.round((compliantCount / employees.length) * 100) 
        : 100
    };
  }, [recordsInLast30Days, employees]);

  // Cell color resolver based on error count & highest severity
  const getCellClasses = (recsForDay: ErrorRecord[]) => {
    const count = recsForDay.length;
    if (count === 0) {
      return "bg-slate-950 border-slate-900/60 hover:bg-slate-900/80 hover:border-slate-800/80";
    }

    // Determine highest severity color among records on that day
    let hasRed = false;
    let hasYellow = false;
    recsForDay.forEach(r => {
      if (r.severityColor === SeverityColor.RED) hasRed = true;
      if (r.severityColor === SeverityColor.YELLOW) hasYellow = true;
    });

    if (hasRed) {
      if (count === 1) return "bg-red-950 text-red-400 border-red-500/20 hover:bg-red-900/90 hover:border-red-500/50";
      if (count === 2) return "bg-red-900/80 text-red-300 border-red-500/40 hover:bg-red-800 hover:border-red-500/60";
      return "bg-red-700 text-red-100 border-red-400/60 shadow-[0_0_8px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:border-red-400";
    }

    if (hasYellow) {
      if (count === 1) return "bg-slate-900 text-amber-400 border-amber-500/20 hover:bg-slate-800 hover:border-amber-500/50";
      if (count === 2) return "bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800 hover:border-amber-500/60";
      return "bg-amber-600 text-slate-950 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.4)] hover:bg-amber-500 hover:border-amber-300";
    }

    // Otherwise Green/Blue (Low severity)
    if (count === 1) return "bg-cyan-950/80 text-cyan-400 border-cyan-500/20 hover:bg-cyan-900 hover:border-cyan-500/50";
    if (count === 2) return "bg-cyan-900/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-800/80 hover:border-cyan-500/60";
    return "bg-cyan-600 text-cyan-950 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)] hover:bg-cyan-500 hover:border-cyan-300";
  };

  return (
    <div className="relative mt-8 bg-gradient-to-b from-slate-900/90 to-slate-950 rounded-2xl border border-slate-800/90 p-6 shadow-2xl backdrop-blur-md">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-5 border-b border-white/10">
        <div>
          <p className="font-space-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
            Telemetry Analytics // {dateRangeString}
          </p>
          <h2 className="font-cormorant text-3xl font-normal tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400 animate-pulse" />
            30-Day Compliance Heatmap
          </h2>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter staff by name/role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 placeholder-slate-600 transition-all font-mono"
            />
          </div>

          {/* Category Quick Filter Tabs */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            {[
              { id: "ALL", label: "ALL" },
              { id: ErrorCategory.TECHNICIAN, label: "Tech" },
              { id: ErrorCategory.ADVISOR, label: "Advisor" },
              { id: ErrorCategory.DENIAL, label: "Denial" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 text-[10px] font-mono font-bold tracking-wider rounded-lg uppercase cursor-pointer transition-all ${
                  categoryFilter === tab.id
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* METRICS GRID (KEY PERFORMANCES) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* TOTAL DEVIATIONS */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-red-950/50 border border-red-500/20 text-red-400 rounded-lg shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Total Deviations</div>
            <div className="text-xl font-extrabold text-slate-200 mt-0.5 font-mono">
              {stats.total}
            </div>
          </div>
        </div>

        {/* COMPLIANCE RATE */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Roster Compliance</div>
            <div className="text-xl font-extrabold text-slate-200 mt-0.5 font-mono">
              {stats.complianceRate}%
            </div>
          </div>
        </div>

        {/* MOST CRITICAL DAY */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Peak Incident Day</div>
            <div className="text-xl font-extrabold text-slate-200 mt-0.5 font-mono truncate max-w-[140px]">
              {stats.peakDay !== "N/A" ? `${stats.peakDay} (${stats.peakDayCount}x)` : "N/A"}
            </div>
          </div>
        </div>

        {/* TOP INCIDENT CATEGORY */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Primary Category</div>
            <div className="text-xl font-extrabold text-slate-200 mt-0.5 font-mono truncate max-w-[140px]">
              {stats.topCategory}
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP MAIN ZONE */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-inner">
        
        {/* SCROLLABLE INNER GRID */}
        <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="min-w-[760px] p-5">
            
            {/* GRID TABLE */}
            <div className="space-y-2">
              
              {/* Grid Rows */}
              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  No dealership personnel match the search parameters.
                </div>
              ) : (
                filteredEmployees.map((emp, eIdx) => {
                  return (
                    <div key={`heatmap-emp-${emp.id}-${eIdx}`} className="flex items-center gap-4 group">
                      
                      {/* Name Label Column (Sticky or fixed width) */}
                      <div className="w-[180px] shrink-0 flex flex-col justify-center min-w-0">
                        <span className="text-xs font-bold text-slate-300 font-mono truncate group-hover:text-cyan-400 transition-colors">
                          {emp.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono font-medium uppercase mt-0.5">
                          {emp.role.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>

                      {/* 30 Day Heat blocks */}
                      <div className="flex items-center gap-1.5">
                        {last30Days.map((dateString, dIdx) => {
                          const key = `${emp.name.trim()}_${dateString}`;
                          const recsForDay = employeeDateMap[key] || [];
                          const count = recsForDay.length;

                          return (
                            <button
                              key={`heatmap-date-${emp.id || eIdx}-${dateString}-${dIdx}`}
                              className={`w-[15px] h-[15px] sm:w-[17px] sm:h-[17px] rounded-[3px] border cursor-help transition-all duration-150 relative ${getCellClasses(recsForDay)}`}
                              onMouseEnter={() => {
                                let maxSev: SeverityLevel | undefined;
                                let maxSevCol: SeverityColor | undefined;
                                recsForDay.forEach(r => {
                                  if (r.severityColor === SeverityColor.RED) {
                                    maxSev = r.severity;
                                    maxSevCol = SeverityColor.RED;
                                  } else if (r.severityColor === SeverityColor.YELLOW && maxSevCol !== SeverityColor.RED) {
                                    maxSev = r.severity;
                                    maxSevCol = SeverityColor.YELLOW;
                                  } else if (!maxSevCol) {
                                    maxSev = r.severity;
                                    maxSevCol = r.severityColor;
                                  }
                                });

                                setHoveredCell({
                                  employeeId: emp.id,
                                  employeeName: emp.name,
                                  date: dateString,
                                  count,
                                  highestSeverity: maxSev,
                                  highestSeverityColor: maxSevCol,
                                  errorDetails: recsForDay.map(r => r.errorDescription)
                                });
                              }}
                              onMouseLeave={() => setHoveredCell(null)}
                            />
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}

            </div>

            {/* DATE TICK MARKS (At the bottom of the heatmap) */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-900/60 text-[9px] text-slate-500 font-mono">
              <div className="w-[180px] shrink-0 font-bold uppercase">Time progression</div>
              <div className="flex items-center justify-between w-[520px] sm:w-[570px] shrink-0">
                <span>30 Days Ago</span>
                <span>15 Days Ago</span>
                <span>Today</span>
              </div>
            </div>

          </div>
        </div>

        {/* LEGEND BAR */}
        <div className="bg-slate-950/40 border-t border-slate-900/60 px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-500" />
            <span>Hover over any active grid block to view full compliance telemetry.</span>
          </div>

          <div className="flex items-center gap-3 text-[9px] text-slate-400 font-mono">
            <span>Legend:</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-slate-950 border border-slate-900" />
                <span>0 Errors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[2px] bg-cyan-950/80 border border-cyan-500/20" />
                <span>🟢 Protected Revenue (Green)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[2px] bg-slate-900 border border-amber-500/20" />
                <span>🟡 Lost Revenue Opportunity (Yellow)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[2px] bg-red-950 border border-red-500/20" />
                <span>🔴 Compliance Risk (Red)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* HOVER TOOLTIP POPUP (PORTAL-LIKE ANCHORED TIP) */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div 
            key="hovered-cell-tooltip-motion"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <h4 className="text-xs font-mono font-extrabold text-slate-200">
                  Telemetry Detail: {hoveredCell.employeeName}
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({new Date(hoveredCell.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono font-semibold">
                  Status: 
                </span>
                {hoveredCell.count === 0 ? (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Compliant (0 Incidents)
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400 font-mono font-bold uppercase bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/20">
                    {hoveredCell.count} Deviation{hoveredCell.count > 1 ? "s" : ""} logged
                  </span>
                )}

                {hoveredCell.highestSeverity && (
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                    hoveredCell.highestSeverityColor === SeverityColor.RED 
                      ? "text-red-400 bg-red-950/40 border-red-500/20" 
                      : hoveredCell.highestSeverityColor === SeverityColor.YELLOW
                      ? "text-amber-400 bg-slate-900 border-amber-500/20"
                      : "text-cyan-400 bg-cyan-950/40 border-cyan-500/20"
                  }`}>
                    Highest: {hoveredCell.highestSeverity}
                  </span>
                )}
              </div>
            </div>

            {/* Error logs inside tooltips */}
            {hoveredCell.errorDetails.length > 0 && (
              <div className="w-full md:w-[480px] max-h-[80px] overflow-y-auto bg-slate-900/60 border border-slate-800/80 rounded-lg p-2 font-mono text-[10px] text-slate-300">
                <div className="text-[8px] text-slate-500 font-bold uppercase mb-1">Deviation Logs:</div>
                <ul className="list-disc list-inside space-y-1">
                  {hoveredCell.errorDetails.map((detail, idx) => (
                    <li key={`err-detail-${idx}-${detail.slice(0, 10)}`} className="truncate" title={detail}>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

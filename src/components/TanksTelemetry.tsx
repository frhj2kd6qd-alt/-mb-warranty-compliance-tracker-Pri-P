import React, { useState, useEffect } from "react";
import { TankLevel } from "../types";
import { Fuel, RefreshCw, AlertTriangle, CheckCircle, ArrowDown, ArrowUp } from "lucide-react";

export const TanksTelemetry: React.FC = () => {
  const [tanks, setTanks] = useState<TankLevel[]>([
    { lid: "LID-01", label: "Hydraulic Fluid Bay A", color: "#00FF66", level: 85 },
    { lid: "LID-02", label: "Coolant Reservoir Bay B", color: "#FFB300", level: 42 },
    { lid: "LID-03", label: "Synthetic Oil Tank C", color: "#FF3333", level: 15 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchTanks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tanks");
      if (res.ok) {
        const data = await res.json();
        if (data.tanks && Array.isArray(data.tanks)) {
          setTanks(data.tanks);
        }
      }
    } catch (e) {
      console.warn("Could not fetch /api/tanks, using local fallback", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTanks();
  }, []);

  const adjustLevel = async (lid: string, delta: number) => {
    const updated = tanks.map((t) => {
      if (t.lid === lid) {
        const nextLevel = Math.max(0, Math.min(100, t.level + delta));
        return { ...t, level: nextLevel };
      }
      return t;
    });
    setTanks(updated);

    try {
      const res = await fetch("/api/tanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanks: updated })
      });
      if (res.ok) {
        setSaveStatus("Telemetry synced");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (e) {
      console.warn("Failed to sync tank levels to server:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Fuel className="w-5 h-5 text-emerald-400" />
            Service Bay Fluid Tank Telemetry
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time level monitoring for workshop bulk fluid reservoirs, synthetic motor oil, and coolant dispensing systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
          <button
            id="btn-refresh-tanks"
            onClick={fetchTanks}
            disabled={isLoading}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-700/80 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Tank Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tanks.map((tank) => {
          const isCritical = tank.level <= 20;
          const isWarning = tank.level > 20 && tank.level <= 50;

          return (
            <div
              key={tank.lid}
              className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between space-y-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {tank.lid}
                  </span>
                  {isCritical ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Refill Required
                    </span>
                  ) : isWarning ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Moderate Level
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Normal
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-3">{tank.label}</h3>
              </div>

              {/* Cylindrical Tank Level Graphic */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-36 bg-zinc-950 rounded-xl border border-zinc-700/80 p-1 relative overflow-hidden flex flex-col justify-end shadow-inner">
                  {/* Fluid Fill */}
                  <div
                    className="w-full rounded-lg transition-all duration-700 relative overflow-hidden"
                    style={{
                      height: `${tank.level}%`,
                      backgroundColor: tank.color || "#00FF66",
                      opacity: 0.85
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                  </div>

                  {/* Level Tick Marks */}
                  <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-2 text-[8px] font-mono text-zinc-400 pointer-events-none">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      {tank.level}%
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Estimated Capacity: ~{(tank.level * 2.5).toFixed(0)} / 250 Gal
                    </p>
                  </div>

                  {/* Adjust buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => adjustLevel(tank.lid, -5)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-colors"
                      title="Dispense 5%"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => adjustLevel(tank.lid, 15)}
                      className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold text-xs border border-emerald-500/30 transition-colors flex items-center gap-1"
                      title="Top Off / Refill"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Refill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

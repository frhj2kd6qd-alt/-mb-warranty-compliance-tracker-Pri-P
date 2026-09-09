import React, { useEffect, useRef } from "react";

export interface FluidGaugeProps {
  value: number; // 0-100 for fill percentage
  displayValue?: string; // e.g. "$14,200" or "94%"
  label: string;
  sublabel?: string;
  color: "emerald" | "amber" | "rose" | "cyan" | "purple";
  icon?: React.ReactNode;
  height?: number;
}

export default function FluidGaugeVisualizer({ 
  value, 
  displayValue, 
  label, 
  sublabel,
  color = "emerald", 
  icon,
  height = 200
}: FluidGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentValueRef = useRef<number>(value || 0);

  // Color configurations
  const colorConfig = {
    emerald: {
      fill: "rgba(52, 211, 153, 0.85)",
      glow: "rgba(52, 211, 153, 0.4)",
      border: "rgb(52, 211, 153)",
      wave: "rgba(16, 185, 129, 0.7)",
      accentText: "#34d399",
      bgRgba: "rgba(6, 78, 59, 0.25)"
    },
    amber: {
      fill: "rgba(245, 158, 11, 0.85)",
      glow: "rgba(245, 158, 11, 0.4)",
      border: "rgb(245, 158, 11)",
      wave: "rgba(217, 119, 6, 0.7)",
      accentText: "#fbbf24",
      bgRgba: "rgba(120, 53, 15, 0.25)"
    },
    rose: {
      fill: "rgba(244, 63, 94, 0.85)",
      glow: "rgba(244, 63, 94, 0.4)",
      border: "rgb(244, 63, 94)",
      wave: "rgba(190, 24, 93, 0.7)",
      accentText: "#f43f5e",
      bgRgba: "rgba(136, 19, 55, 0.25)"
    },
    cyan: {
      fill: "rgba(34, 211, 238, 0.85)",
      glow: "rgba(34, 211, 238, 0.4)",
      border: "rgb(34, 211, 238)",
      wave: "rgba(6, 182, 212, 0.7)",
      accentText: "#22d3ee",
      bgRgba: "rgba(22, 78, 99, 0.25)"
    },
    purple: {
      fill: "rgba(168, 85, 247, 0.85)",
      glow: "rgba(168, 85, 247, 0.4)",
      border: "rgb(168, 85, 247)",
      wave: "rgba(147, 51, 234, 0.7)",
      accentText: "#c084fc",
      bgRgba: "rgba(88, 28, 135, 0.25)"
    }
  };

  const config = colorConfig[color] || colorConfig.emerald;

  // Draw liquid with wave effect
  const drawGauge = (ctx: CanvasRenderingContext2D, displayVal: number, time: number) => {
    const width = ctx.canvas.width;
    const heightPx = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = heightPx / 2 - 8;
    const radius = Math.min(width, heightPx) / 2 - 16;

    if (radius <= 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, heightPx);

    // Draw background circle container
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = config.bgRgba;
    ctx.fill();
    ctx.strokeStyle = "rgba(71, 85, 105, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Calculate clamped liquid level (0-100)
    const clamped = Math.max(0, Math.min(100, displayVal));
    const liquidLevel = (100 - clamped) / 100;
    // Map liquid level to Y coordinate across the circle
    const liquidY = centerY - radius + (radius * 2 * liquidLevel);

    // Clip to circle boundary
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw sinusoidal liquid waves
    const waveAmplitude = Math.min(7, radius * 0.12);
    const waveFrequency = 0.035;
    const wavePhase = time * 2.8;

    ctx.beginPath();
    ctx.moveTo(centerX - radius, liquidY + Math.sin(-radius * waveFrequency + wavePhase) * waveAmplitude);

    for (let x = centerX - radius; x <= centerX + radius; x += 2) {
      const relX = x - centerX;
      const waveY = liquidY + Math.sin(relX * waveFrequency + wavePhase) * waveAmplitude;
      ctx.lineTo(x, waveY);
    }

    ctx.lineTo(centerX + radius, centerY + radius + 10);
    ctx.lineTo(centerX - radius, centerY + radius + 10);
    ctx.closePath();

    // Fill with vibrant gradient
    const gradient = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
    gradient.addColorStop(0, config.wave);
    gradient.addColorStop(0.6, config.fill);
    gradient.addColorStop(1, "rgba(5, 8, 15, 0.85)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();

    // Outer circle border with soft glow
    ctx.save();
    ctx.shadowColor = config.glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = config.border;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Percentage or formatted value in center
    const textToShow = displayValue ? displayValue : `${Math.round(displayVal)}%`;
    ctx.fillStyle = "#ffffff";
    const fontSize = Math.max(13, Math.floor(radius * 0.44));
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', 'Space Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;
    ctx.fillText(textToShow, centerX, centerY);
    ctx.shadowColor = "transparent";
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationTime = 0;
    let lastTime = performance.now();

    const targetVal = Math.max(0, Math.min(100, value || 0));

    const animate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      animationTime += deltaTime;

      const diff = targetVal - currentValueRef.current;
      if (Math.abs(diff) > 0.1) {
        currentValueRef.current += diff * 0.12;
      } else {
        currentValueRef.current = targetVal;
      }

      drawGauge(ctx, currentValueRef.current, animationTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, displayValue, config]);

  // Set canvas size with High DPI pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width;
        const h = height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    updateSize();

    const handleResize = () => {
      updateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height]);

  return (
    <div className="w-full flex flex-col items-center justify-between relative select-none p-1">
      {icon && (
        <div className="absolute top-2 left-2 text-sm opacity-70 z-10">
          {icon}
        </div>
      )}
      <div className="w-full flex items-center justify-center relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>
      <div className="text-center mt-1 w-full px-2">
        <div className="text-xs font-mono font-bold text-slate-200 tracking-wider uppercase truncate">
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

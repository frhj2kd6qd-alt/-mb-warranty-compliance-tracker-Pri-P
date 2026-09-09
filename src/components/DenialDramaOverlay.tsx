import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertOctagon, Flame, ShieldAlert, Volume2, VolumeX } from "lucide-react";

interface DenialDramaOverlayProps {
  isActive: boolean;
  onClose: () => void;
  chargebackAmount?: number;
  roNumber?: string;
}

export default function DenialDramaOverlay({
  isActive,
  onClose,
  chargebackAmount = 0,
  roNumber = "RO-UNKNOWN",
}: DenialDramaOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);
  const soundNodesRef = useRef<any[]>([]);
  const [muted, setMuted] = useState(false);

  // Stop all synthesized sounds
  const stopSounds = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    soundNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
    });
    soundNodesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  // Sound generator
  const triggerSounds = () => {
    if (muted) return;
    try {
      stopSounds();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      // 1. Heavy Base Explosion/Rumble
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(10, now + 2.5);

      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);
      soundNodesRef.current.push(noiseSource);

      // Low frequency sub-rumble
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sawtooth";
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

      subGain.gain.setValueAtTime(0.9, now);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 1.8);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      soundNodesRef.current.push(subOsc);

      // 2. High-pitched Metal Screech (Hazard Sound)
      const screechOsc = ctx.createOscillator();
      const screechGain = ctx.createGain();
      screechOsc.type = "sawtooth";
      screechOsc.frequency.setValueAtTime(2000, now);
      screechOsc.frequency.exponentialRampToValueAtTime(100, now + 0.6);

      screechGain.gain.setValueAtTime(0.15, now);
      screechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      screechOsc.connect(screechGain);
      screechGain.connect(ctx.destination);
      screechOsc.start(now);
      soundNodesRef.current.push(screechOsc);

      // 3. Repeating Emergency Warning Klaxon Siren
      const playSirenBeep = (startTime: number) => {
        if (!ctx || ctx.state === "closed") return;

        const sirenOsc1 = ctx.createOscillator();
        const sirenOsc2 = ctx.createOscillator();
        const sirenGain = ctx.createGain();

        sirenOsc1.type = "sawtooth";
        sirenOsc2.type = "sine";

        sirenOsc1.frequency.setValueAtTime(220, startTime);
        sirenOsc1.frequency.linearRampToValueAtTime(580, startTime + 0.3);
        sirenOsc1.frequency.linearRampToValueAtTime(220, startTime + 0.6);

        sirenOsc2.frequency.setValueAtTime(440, startTime);
        sirenOsc2.frequency.linearRampToValueAtTime(880, startTime + 0.3);
        sirenOsc2.frequency.linearRampToValueAtTime(440, startTime + 0.6);

        sirenGain.gain.setValueAtTime(0, startTime);
        sirenGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        sirenGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.5);
        sirenGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        sirenOsc1.connect(sirenGain);
        sirenOsc2.connect(sirenGain);
        sirenGain.connect(ctx.destination);

        sirenOsc1.start(startTime);
        sirenOsc2.start(startTime);

        soundNodesRef.current.push(sirenOsc1, sirenOsc2);
      };

      // Play immediate first klaxon beep
      playSirenBeep(ctx.currentTime + 0.1);

      // Schedule periodic klaxon repeat
      let beepCounter = 1;
      alarmIntervalRef.current = setInterval(() => {
        if (ctx && ctx.state !== "closed") {
          playSirenBeep(ctx.currentTime);
          beepCounter++;
          if (beepCounter > 10) {
            clearInterval(alarmIntervalRef.current);
          }
        }
      }, 700);

    } catch (e) {
      console.warn("Audio Context creation failed or blocked by user guest policy", e);
    }
  };

  // Flame physics simulator canvas effect
  useEffect(() => {
    if (!isActive) {
      stopSounds();
      return;
    }

    triggerSounds();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle representation
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      colorType: "fire" | "smoke" | "spark";
      angle: number;
      spin: number;
    }

    let particles: Particle[] = [];

    // Trigger initial burst of sparks/fire on open
    const spawnInitialExplosion = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.75; // explode upwards from center-ish

      // Massive spark blast
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 4 + 2), // upward bias
          life: Math.random() * 60 + 30,
          maxLife: 90,
          size: Math.random() * 5 + 2,
          colorType: Math.random() > 0.3 ? "fire" : "spark",
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.2,
        });
      }

      // Massive smoke ring
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: Math.random() * 100 + 80,
          maxLife: 180,
          size: Math.random() * 40 + 20,
          colorType: "smoke",
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.05,
        });
      }
    };

    spawnInitialExplosion();

    // Constant flame generation stream from the bottom
    const updateAndRender = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle backdrop glow
      const radialGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height * 0.8,
        50,
        canvas.width / 2,
        canvas.height * 0.8,
        Math.max(canvas.width * 0.4, 400)
      );
      radialGlow.addColorStop(0, "rgba(220, 38, 38, 0.25)");
      radialGlow.addColorStop(0.4, "rgba(234, 88, 12, 0.12)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn ongoing continuous flames from the screen base
      const spawnCount = 6;
      for (let i = 0; i < spawnCount; i++) {
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.6),
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 7 - 4, // up!
          life: Math.random() * 40 + 20,
          maxLife: 60,
          size: Math.random() * 35 + 15,
          colorType: "fire",
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.1,
        });

        // Occasional golden spark floating up
        if (Math.random() > 0.7) {
          particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.8),
            y: canvas.height,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 10 - 5,
            life: Math.random() * 80 + 40,
            maxLife: 120,
            size: Math.random() * 3 + 1,
            colorType: "spark",
            angle: 0,
            spin: 0,
          });
        }
      }

      // Update particles
      particles = particles.filter((p) => {
        p.life--;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Apply rising air resistance / floatation
        p.vy -= 0.05; // accelerate up
        p.vx *= 0.98; // slow horizontal speed slightly

        const progress = 1 - p.life / p.maxLife;

        // Draw particle based on type
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.colorType === "fire") {
          // Glow style additive blend
          ctx.globalCompositeOperation = "screen";

          const pSize = p.size * (1 - progress * 0.6);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pSize);

          // Color transition: White-hot -> Yellow -> Orange -> Deep Red -> Transparent
          if (progress < 0.15) {
            grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            grad.addColorStop(0.3, "rgba(253, 224, 71, 0.85)");
            grad.addColorStop(1, "rgba(234, 88, 12, 0)");
          } else if (progress < 0.5) {
            grad.addColorStop(0, "rgba(253, 224, 71, 0.9)");
            grad.addColorStop(0.4, "rgba(234, 88, 12, 0.7)");
            grad.addColorStop(1, "rgba(220, 38, 38, 0)");
          } else {
            const alpha = Math.max(0, 1 - progress);
            grad.addColorStop(0, `rgba(234, 88, 12, ${alpha * 0.8})`);
            grad.addColorStop(0.5, `rgba(220, 38, 38, ${alpha * 0.4})`);
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.colorType === "smoke") {
          ctx.globalCompositeOperation = "source-over";
          const pSize = p.size * (1 + progress * 1.5); // expand smoke
          const alpha = Math.max(0, (1 - progress) * 0.22);

          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pSize);
          grad.addColorStop(0, `rgba(45, 45, 55, ${alpha})`);
          grad.addColorStop(0.6, `rgba(25, 25, 30, ${alpha * 0.5})`);
          grad.addColorStop(1, "rgba(10, 10, 12, 0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.colorType === "spark") {
          ctx.globalCompositeOperation = "screen";
          const alpha = Math.max(0, 1 - progress);
          ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
          ctx.beginPath();
          // Draw star-like spark or small circle
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      animationId = requestAnimationFrame(updateAndRender);
    };

    animationId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      stopSounds();
    };
  }, [isActive, muted]);

  return (
    <AnimatePresence>
      {isActive && (
        <div key="denial-drama-overlay-root" id="denial-drama-overlay-container" className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center pointer-events-auto">
          {/* Canvas for flames */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          />

          {/* Solid base container for absolute emergency vibes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md pointer-events-none"
            style={{ zIndex: 0 }}
          />

          {/* Flashing hazard light bars (rotating crimson radial gradients on sides) */}
          <div className="absolute inset-0 pointer-events-none animate-pulse duration-75 flex justify-between z-[2]">
            <div className="w-1/4 h-full bg-gradient-to-r from-red-600/35 to-transparent" />
            <div className="w-1/4 h-full bg-gradient-to-l from-red-600/35 to-transparent" />
          </div>

          {/* Main Warning Modal Card */}
          <motion.div
            initial={{ scale: 0.3, y: 150, rotate: -8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              rotate: 0, 
              opacity: 1,
              transition: { type: "spring", damping: 10, stiffness: 100 }
            }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            className="relative w-full max-w-lg mx-4 bg-slate-950 border-4 border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.7)] rounded-3xl p-8 text-center overflow-hidden z-10 select-none animate-[shake_0.4s_ease-in-out_infinite]"
            style={{ 
              animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
              zIndex: 3 
            }}
          >
            {/* Warning yellow and black stripes around card top and bottom */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-amber-500 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:30px_30px]" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-500 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:30px_30px]" />

            {/* Glowing red flashing lamp background */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 blur-3xl rounded-full animate-ping pointer-events-none" />

            {/* Content wrapper */}
            <div className="relative z-10 space-y-6 my-2">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Fire flames behind symbol */}
                  <div className="absolute -inset-4 bg-amber-500/30 blur-xl rounded-full animate-pulse" />
                  <div className="bg-red-600 p-4 rounded-full border-4 border-white animate-bounce shadow-[0_0_30px_rgba(220,38,38,1)]">
                    <AlertOctagon className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-red-500 font-black tracking-widest text-xs uppercase font-mono bg-red-950/60 border border-red-800 px-3 py-1.5 rounded-full inline-flex items-center gap-2 mx-auto shadow-inner animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-bounce" />
                  CRITICAL MBUSA AUDIT DISASTER
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter">
                  CHARGEBACK TRIGGERED!
                </h2>
                <p className="text-slate-400 text-xs md:text-sm max-w-sm mx-auto">
                  A massive warranty denial claims penalty has been authorized against the dealer's financial statement!
                </p>
              </div>

              {/* Holographic display box showing the actual damage */}
              <div className="bg-slate-900/90 border-2 border-red-500/50 rounded-2xl p-5 relative overflow-hidden shadow-inner">
                {/* Scanner line scanning */}
                <div className="absolute left-0 right-0 h-[2px] bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,1)] animate-[scan_2s_linear_infinite]" />
                
                <div className="grid grid-cols-2 gap-4 text-left font-mono">
                  <div className="border-r border-slate-800 pr-2">
                    <span className="text-[10px] text-slate-500 uppercase block">AUDIT EXPOSURE</span>
                    <span className="text-rose-500 font-bold text-sm tracking-wider">RO_CHARGEBACK_LOSS</span>
                  </div>
                  <div className="pl-2">
                    <span className="text-[10px] text-slate-500 uppercase block">TARGET REFERENCE</span>
                    <span className="text-white font-bold text-sm truncate block">{roNumber}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 font-mono block">ESTIMATED FINANCIAL DAMAGE</span>
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 tracking-tight mt-1">
                    ${chargebackAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Action and Sound controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMuted(!muted)}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {muted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-red-500 animate-pulse" />
                      UNMUTE SIRENS
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      MUTE SOUNDS
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-lg shadow-red-950 flex items-center justify-center gap-2 group border border-red-400/30"
                >
                  <ShieldAlert className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
                  DISMISS EXPOSURE SIRENS
                </button>
              </div>
            </div>
          </motion.div>

          {/* Inline keyframe animation additions */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0) rotate(0.5deg); }
              20%, 80% { transform: translate3d(2px, 0, 0) rotate(-0.5deg); }
              30%, 50%, 70% { transform: translate3d(-3px, 0, 0) rotate(1deg); }
              40%, 60% { transform: translate3d(3px, 0, 0) rotate(-1deg); }
            }
            @keyframes scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}} />
        </div>
      )}
    </AnimatePresence>
  );
}

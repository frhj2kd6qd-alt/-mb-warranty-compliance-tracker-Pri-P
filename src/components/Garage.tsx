import React, { useState, useRef, useEffect } from "react";
import { 
  RotateCcw, 
  ExternalLink, 
  Car, 
  CheckCircle2,
  Users
} from "lucide-react";
import cleanGaragePoster from "../assets/images/clean garage.png";
import { ErrorRecord } from "../types";

interface GarageProps {
  records?: ErrorRecord[];
  onNavigateToTab?: (tab: string, ro?: string) => void;
}

export default function Garage({ onNavigateToTab }: GarageProps) {
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const driveFileId = "1AzEf2eybpLqNhdAaOEjStW-7-3bZ5gUw";
  const driveViewUrl = "https://drive.google.com/file/d/1AzEf2eybpLqNhdAaOEjStW-7-3bZ5gUw/view?usp=sharing";
  const driveEmbedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
  const videoProxyUrl = `/api/garage-video`;

  // Autoplay once upon mounting the Garage component
  useEffect(() => {
    setIsEnded(false);
    setHasStarted(false);
    setUseIframeFallback(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true);
          })
          .catch((err) => {
            console.warn("HTML5 autoplay notification:", err);
          });
      }
    }
  }, [playerKey]);

  // Replay handler
  const handleReplay = () => {
    setIsEnded(false);
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.warn(e));
    } else {
      setPlayerKey(prev => prev + 1);
    }
  };

  // When video completes its run, hold strictly on the final frame
  const handleVideoEnded = () => {
    setIsEnded(true);
    if (videoRef.current) {
      // Pause at the final frame so it remains as a static still image
      videoRef.current.pause();
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 space-y-8 pb-16 animate-fade-in text-slate-100 select-none">
      
      {/* MINIMALIST GARAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/90 border border-slate-800/90 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wider text-white uppercase">
                ASP GARAGE & FLEET BAY
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                isEnded 
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" 
                  : "bg-red-950/80 text-red-400 border border-red-800/60 animate-pulse"
              }`}>
                {isEnded ? "STATIC IMAGE LOCKED" : "AUTOPLAY MOTION ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              {isEnded 
                ? "Auto-play sequence complete • Sticking on final frame as high-resolution still image" 
                : "Continuous motion graphic in progress"}
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end flex-wrap">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("directory")}
              className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Open Dealership Personnel Directory"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personnel Directory</span>
            </button>
          )}

          <button
            onClick={handleReplay}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Replay Motion Graphic from Start"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replay Graphic</span>
          </button>

          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-gradient-to-r from-red-600/90 to-slate-900 hover:from-red-500 hover:to-slate-800 border border-red-500/40 text-white rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-red-500/20"
            title="Open Video in Google Drive"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Drive</span>
          </a>
        </div>
      </div>

      {/* VIDEO ELEMENT CANVAS */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-black border border-slate-800/90 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        
        <div className="relative w-full aspect-video min-h-[380px] sm:min-h-[520px] lg:min-h-[620px] bg-black flex items-center justify-center">
          
          {!useIframeFallback ? (
            <video
              ref={videoRef}
              key={playerKey}
              poster={cleanGaragePoster}
              autoPlay
              muted
              playsInline
              onPlay={() => setHasStarted(true)}
              onEnded={handleVideoEnded}
              onError={() => {
                console.warn("Direct HTML5 playback issue, switching to embed");
                setUseIframeFallback(true);
              }}
              className="w-full h-full object-contain"
            >
              <source src={videoProxyUrl} type="video/mp4" />
              <source src={`https://drive.google.com/uc?export=download&id=${driveFileId}`} type="video/mp4" />
            </video>
          ) : (
            <iframe
              src={driveEmbedUrl}
              title="ASP Garage Motion Graphic"
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}

          {/* Still Frame Locked Indicator */}
          {isEnded && (
            <div className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-mono text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Static Final Frame Locked</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

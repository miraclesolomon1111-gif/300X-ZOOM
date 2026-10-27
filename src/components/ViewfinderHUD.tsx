import React, { useState } from "react";
import { Volume2, VolumeX, Zap, Grid, Sliders, Crosshair, Sparkles, AlertCircle } from "lucide-react";
import { SceneAnalysis } from "../types/camera";

interface Props {
  scene: SceneAnalysis;
  fps: number;
  zoom: number;
  sharpnessScore: number;
  isBlurry: boolean;
  focusPoint: { x: number; y: number };
  isFocusLocked: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onViewfinderTap: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  showSplitCompare: boolean;
  splitRatio: number;
  onSplitRatioChange: (ratio: number) => void;
  hasCameraError: boolean;
  isUploadedImage: boolean;
}

export const ViewfinderHUD: React.FC<Props> = ({
  scene,
  fps,
  zoom,
  sharpnessScore,
  isBlurry,
  focusPoint,
  isFocusLocked,
  isMuted,
  onToggleMute,
  showGrid,
  onToggleGrid,
  onViewfinderTap,
  showSplitCompare,
  splitRatio,
  onSplitRatioChange,
  hasCameraError,
  isUploadedImage,
}) => {
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!showSplitCompare) return;
    setIsDraggingSplit(true);
    updateSplit(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSplit || !showSplitCompare) return;
    updateSplit(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handlePointerUp = () => {
    setIsDraggingSplit(false);
  };

  const updateSplit = (clientX: number, rect: DOMRect) => {
    const relX = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0.05, Math.min(0.95, relX));
    onSplitRatioChange(clamped);
  };

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-auto flex flex-col justify-between overflow-hidden touch-none"
      onClick={onViewfinderTap}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Top Telemetry & Controls Bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        {/* Brand Optic Badge (MZ) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-black text-sm tracking-tighter shadow-md shadow-cyan-500/30">
            MZ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-hud font-bold text-xs tracking-wider text-white">CLEAR CAM</span>
              <span className="font-hud text-[10px] font-black px-1 rounded bg-red-600 text-white tracking-widest">
                300X
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono-hud text-cyan-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI ALWAYS ON</span>
              {isUploadedImage && <span className="text-amber-400">• PHOTO MODE</span>}
            </div>
          </div>
        </div>

        {/* Real-Time Telemetry HUD */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono-hud text-gray-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <div><span className="text-gray-400">F/</span>1.4</div>
          <div><span className="text-gray-400">SS</span> 1/250</div>
          <div><span className="text-gray-400">ISO</span> 100</div>
          <div><span className="text-cyan-400">{fps}</span> FPS</div>
        </div>

        {/* Quick Utility Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleGrid();
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              showGrid
                ? "bg-cyan-500 text-black border-cyan-400"
                : "bg-black/50 text-gray-400 border-white/10 hover:text-white"
            }`}
            title="Toggle Grid & Level"
            aria-label="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              isMuted
                ? "bg-black/50 text-red-400 border-red-500/30"
                : "bg-black/50 text-gray-300 border-white/10 hover:text-white"
            }`}
            title={isMuted ? "Unmute Shutter Sounds" : "Mute Shutter Sounds"}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewfinder Center Optics (Grid, Reticle, Horizon) */}
      <div className="relative flex-1 pointer-events-none flex items-center justify-center">
        {/* Rule-of-Thirds Grid */}
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-r border-b border-white/10" />
            <div className="border-b border-white/10" />
            <div className="border-r border-white/10" />
            <div className="border-r border-white/10" />
            <div />
          </div>
        )}

        {/* Optical Level Indicator (Center Artificial Horizon) */}
        {showGrid && (
          <div className="absolute flex items-center justify-center gap-12 opacity-60">
            <div className="w-12 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
            <div className="w-2 h-2 rounded-full border border-cyan-400" />
            <div className="w-12 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
          </div>
        )}

        {/* Interactive Focus Reticle */}
        <div
          className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none ${
            isFocusLocked ? "scale-90" : "scale-100"
          }`}
          style={{
            left: `${focusPoint.x * 100}%`,
            top: `${focusPoint.y * 100}%`,
          }}
        >
          {/* Reticle Brackets */}
          <div className="absolute inset-0">
            {/* Top-left */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors ${isFocusLocked ? 'border-emerald-400' : 'border-cyan-400'}`} />
            {/* Top-right */}
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors ${isFocusLocked ? 'border-emerald-400' : 'border-cyan-400'}`} />
            {/* Bottom-left */}
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors ${isFocusLocked ? 'border-emerald-400' : 'border-cyan-400'}`} />
            {/* Bottom-right */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors ${isFocusLocked ? 'border-emerald-400' : 'border-cyan-400'}`} />
            {/* Center dot */}
            <div className={`absolute inset-0 m-auto w-1.5 h-1.5 rounded-full transition-colors ${isFocusLocked ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          </div>

          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono-hud text-cyan-300 bg-black/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
            {isFocusLocked ? "AI LOCK" : "AF-C TRACK"}
          </div>
        </div>

        {/* Before / After Split Draggable Divider Overlay */}
        {showSplitCompare && (
          <div
            className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize select-none"
            style={{ left: `${splitRatio * 100}%` }}
          >
            <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 shadow-[0_0_12px_#00F2FE]" />
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold text-xs shadow-lg shadow-cyan-400/50">
              ◂ ▸
            </div>
          </div>
        )}
      </div>

      {/* Viewfinder Bottom Status Overlay */}
      <div className="px-4 pb-2 flex items-center justify-between text-[11px] font-mono-hud text-gray-400 pointer-events-none">
        {/* Sharpness & Blur Telemetry */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <span className="text-[10px] text-gray-400">SHARPNESS:</span>
          <span className={`font-bold ${sharpnessScore > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {sharpnessScore}%
          </span>
          <span className="text-gray-500">|</span>
          <span className={isBlurry ? 'text-amber-300 font-bold' : 'text-emerald-300'}>
            {isBlurry ? 'DEBLUR ON' : 'STABLE'}
          </span>
        </div>

        {/* Model Pipeline Tag */}
        <div className="hidden xs:flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px]">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>REAL-ESRGAN + GEMINI</span>
        </div>
      </div>
    </div>
  );
};

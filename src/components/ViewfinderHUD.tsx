import React, { useState } from "react";
import { Volume2, VolumeX, Grid } from "lucide-react";
import { SceneAnalysis } from "../types/camera";
import { ConnectivityBadge } from "./ConnectivityBadge";

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
  isBrowserOnline: boolean;
  isForcedOffline: boolean;
  effectiveOnline: boolean;
  onToggleForceOffline: () => void;
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
  isUploadedImage,
  isBrowserOnline,
  isForcedOffline,
  effectiveOnline,
  onToggleForceOffline,
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
      <div className="flex items-center justify-between px-3 pt-3 pb-1 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-auto">
        {/* Brand Optic Badge (MZ) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white font-black text-xs tracking-tighter border border-white/20">
            MZ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-hud font-bold text-xs tracking-wider text-white">CLEAR CAM</span>
              <span className="font-hud text-[10px] font-bold px-1 rounded bg-white/20 text-white tracking-wider">
                300X
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono-hud text-gray-300">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>REAL CAMERA FEED</span>
              {isUploadedImage && <span className="text-amber-400">• PHOTO MODE</span>}
            </div>
          </div>
        </div>

        {/* Real-Time Telemetry HUD */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono-hud text-gray-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <div><span className="text-gray-400">ZOOM</span> {zoom.toFixed(1)}x</div>
          <div><span className="text-gray-400">FPS</span> {fps}</div>
          <div>
            <span className="text-gray-400">SHARPNESS</span>{" "}
            <span className="text-emerald-400 font-semibold">{sharpnessScore}%</span>
          </div>
        </div>

        {/* Quick Utility Toggles */}
        <div className="flex items-center gap-1.5">
          <ConnectivityBadge
            isBrowserOnline={isBrowserOnline}
            isForcedOffline={isForcedOffline}
            effectiveOnline={effectiveOnline}
            onToggleForceOffline={onToggleForceOffline}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleGrid();
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              showGrid
                ? "bg-white text-black border-white"
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

      {/* Viewfinder Center Optics (Subtle Grid, Minimal Focus Ring on Tap) */}
      <div className="relative flex-1 pointer-events-none flex items-center justify-center">
        {/* Rule-of-Thirds Grid */}
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
          </div>
        )}

        {/* Minimal Focus Ring on Tap (fades out, NO neon blue box) */}
        {isFocusLocked && (
          <div
            className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 pointer-events-none transition-all duration-300 scale-90 animate-pulse"
            style={{
              left: `${focusPoint.x * 100}%`,
              top: `${focusPoint.y * 100}%`,
            }}
          >
            <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-white/80" />
          </div>
        )}

        {/* Before / After Split Draggable Divider Overlay (only active when user toggles compare) */}
        {showSplitCompare && (
          <div
            className="absolute top-0 bottom-0 pointer-events-auto cursor-ew-resize select-none"
            style={{ left: `${splitRatio * 100}%` }}
          >
            <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-sm" />
            <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] shadow-lg">
              ◂ ▸
            </div>
          </div>
        )}
      </div>

      {/* Viewfinder Bottom Status Overlay */}
      <div className="px-4 pb-2 flex items-center justify-between text-[11px] font-mono-hud text-gray-400 pointer-events-none">
        {/* Real Sharpness Telemetry */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <span className="text-[10px] text-gray-400">SHARPNESS:</span>
          <span className="text-white font-semibold">
            {sharpnessScore}%
          </span>
          <span className="text-gray-500">|</span>
          <span className={isBlurry ? "text-amber-300" : "text-emerald-400"}>
            {isBlurry ? "STABILIZING" : "OPTIMAL"}
          </span>
        </div>

        {/* Zoom indicator */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-gray-300">
          <span>ZOOM:</span>
          <span className="text-white font-bold">{zoom.toFixed(zoom < 10 ? 1 : 0)}x</span>
        </div>
      </div>
    </div>
  );
};

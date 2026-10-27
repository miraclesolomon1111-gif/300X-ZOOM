import React, { useState, useEffect } from "react";
import { CapturedPhoto } from "../types/camera";
import { Camera, RefreshCw, Upload, Image as ImageIcon, SlidersHorizontal, SplitSquareVertical } from "lucide-react";
import { playTimerBeep } from "../utils/audio";

interface Props {
  onCapture: () => void;
  isCapturing: boolean;
  zoom: number;
  lastPhoto: CapturedPhoto | null;
  photoCount: number;
  onOpenGallery: () => void;
  onFlipCamera: () => void;
  onOpenUpload: () => void;
  showSplitCompare: boolean;
  onToggleSplitCompare: () => void;
  isTimerActive: boolean;
  timerCount: number;
  onTriggerTimerCapture: () => void;
}

export const ShutterControls: React.FC<Props> = ({
  onCapture,
  isCapturing,
  zoom,
  lastPhoto,
  photoCount,
  onOpenGallery,
  onFlipCamera,
  onOpenUpload,
  showSplitCompare,
  onToggleSplitCompare,
  isTimerActive,
  timerCount,
  onTriggerTimerCapture,
}) => {
  const isExtremeZoom = zoom > 100;

  const handleShutterClick = () => {
    if (isCapturing || isTimerActive) return;

    if (isExtremeZoom) {
      // Auto 2s stabilizer countdown when zoom > 100x
      onTriggerTimerCapture();
    } else {
      onCapture();
    }
  };

  return (
    <div className="w-full flex items-center justify-around max-w-md px-6 py-4 relative select-none">
      {/* Left: Gallery Thumbnail / Quick View */}
      <button
        onClick={onOpenGallery}
        className="relative group flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900/90 border border-white/20 overflow-hidden shadow-lg transition-transform active:scale-95 hover:border-cyan-400"
        aria-label="Open photo gallery"
      >
        {lastPhoto ? (
          <img
            src={lastPhoto.dataUrl}
            alt="Last capture"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
        )}
        {photoCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-black font-hud text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-black shadow">
            {photoCount}
          </span>
        )}
      </button>

      {/* Secondary Left: Before/After Split Toggle */}
      <button
        onClick={onToggleSplitCompare}
        className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-95 ${
          showSplitCompare
            ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/40"
            : "bg-neutral-900/80 text-gray-400 border-white/15 hover:text-white"
        }`}
        title="Toggle Before / After Split Slider"
        aria-label="Toggle Before / After Split Slider"
      >
        <SplitSquareVertical className="w-4 h-4" />
      </button>

      {/* Center: Main High-Tech Shutter Button */}
      <div className="relative flex items-center justify-center">
        {/* Animated Timer Countdown Ring if active */}
        {isTimerActive && (
          <div className="absolute inset-0 -m-3 flex items-center justify-center pointer-events-none">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke={isExtremeZoom ? "#f59e0b" : "#00F2FE"}
                strokeWidth="4"
                fill="none"
                strokeDasharray="276"
                strokeDashoffset={276 * (timerCount / 2)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute font-hud text-2xl font-black text-amber-400 animate-pulse">
              {timerCount}
            </span>
          </div>
        )}

        <button
          onClick={handleShutterClick}
          disabled={isCapturing || isTimerActive}
          className={`relative group w-18 h-18 rounded-full p-1.5 transition-transform active:scale-90 flex items-center justify-center ${
            isExtremeZoom
              ? "bg-gradient-to-tr from-amber-500 to-amber-300 shadow-lg shadow-amber-500/40"
              : "bg-gradient-to-tr from-cyan-500 to-blue-400 shadow-lg shadow-cyan-500/40"
          }`}
          aria-label={isExtremeZoom ? "Take photo with 2s stabilization" : "Take photo"}
        >
          {/* Inner ring */}
          <div className="w-full h-full rounded-full bg-black/40 border-2 border-white/80 flex items-center justify-center p-1">
            <div
              className={`w-full h-full rounded-full transition-all duration-150 ${
                isCapturing
                  ? "bg-white scale-75 animate-ping"
                  : isExtremeZoom
                  ? "bg-amber-400 group-hover:bg-amber-300"
                  : "bg-cyan-400 group-hover:bg-cyan-300"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Secondary Right: Upload Image */}
      <button
        onClick={onOpenUpload}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/80 border border-white/15 text-gray-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-all active:scale-95"
        title="Upload any image to enhance"
        aria-label="Upload any image"
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Right: Camera Flip (Front/Rear) */}
      <button
        onClick={onFlipCamera}
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900/90 border border-white/20 text-gray-300 hover:text-white hover:border-cyan-400 transition-all active:scale-95 shadow-lg"
        aria-label="Switch camera lens"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
};

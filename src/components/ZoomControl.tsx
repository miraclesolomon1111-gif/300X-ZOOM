import React, { useRef } from "react";
import { ZoomPreset } from "../types/camera";
import { playZoomTick } from "../utils/audio";
import { ShieldAlert } from "lucide-react";

interface Props {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
}

const PRESETS: ZoomPreset[] = [1, 3, 10, 30, 100, 300];

export const ZoomControl: React.FC<Props> = ({ zoom, onZoomChange }) => {
  const lastTickTime = useRef(0);

  const triggerTick = () => {
    const now = Date.now();
    if (now - lastTickTime.current > 60) {
      playZoomTick();
      lastTickTime.current = now;
    }
  };

  // Convert linear slider position (0-100) to zoom scale (1-300x) via power curve
  const zoomToSlider = (z: number): number => {
    const minLog = Math.log10(1);
    const maxLog = Math.log10(300);
    const currLog = Math.log10(Math.max(1, Math.min(300, z)));
    return ((currLog - minLog) / (maxLog - minLog)) * 100;
  };

  const sliderToZoom = (s: number): number => {
    const minLog = Math.log10(1);
    const maxLog = Math.log10(300);
    const logVal = minLog + (s / 100) * (maxLog - minLog);
    const rawZ = Math.pow(10, logVal);
    if (rawZ < 10) return Math.round(rawZ * 10) / 10;
    if (rawZ < 100) return Math.round(rawZ);
    return Math.round(rawZ);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    const newZoom = sliderToZoom(sliderVal);
    triggerTick();
    onZoomChange(newZoom);
  };

  const getZoomModeLabel = () => {
    if (zoom <= 10) return { label: "CAMERA 1X - 10X", color: "text-white" };
    if (zoom <= 100) return { label: "CLEAR ZOOM 10X - 100X", color: "text-gray-300" };
    return { label: "MEGA ZOOM 100X - 300X", color: "text-amber-400" };
  };

  const mode = getZoomModeLabel();

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none px-4">
      {/* Zoom Mode Telemetry & Value Indicator */}
      <div className="flex items-center justify-between w-full max-w-md px-1 text-xs font-hud">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold tracking-wider ${mode.color}`}>
            {mode.label}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-hud text-white tracking-tight">
            {zoom.toFixed(zoom < 10 ? 1 : 0)}
          </span>
          <span className="text-sm font-semibold text-white/80">X</span>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex items-center justify-between w-full max-w-md gap-1.5 px-1">
        {PRESETS.map((p) => {
          const isSelected = Math.abs(zoom - p) < (p < 10 ? 0.2 : 2);
          const isExtreme = p >= 100;

          return (
            <button
              key={p}
              onClick={() => {
                triggerTick();
                onZoomChange(p);
              }}
              className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-hud font-bold transition-all ${
                isSelected
                  ? isExtreme
                    ? "bg-amber-400 text-black shadow-md scale-105"
                    : "bg-white text-black shadow-md scale-105"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              {p}x
            </button>
          );
        })}
      </div>

      {/* Continuous Range Slider */}
      <div className="w-full max-w-md relative flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={zoomToSlider(zoom)}
          onChange={handleSliderChange}
          className="zoom-slider w-full py-2 z-10"
          aria-label="1x to 300x Mega Zoom Slider"
        />
      </div>

      {/* Tripod Warning notification when zoom > 100x */}
      {zoom > 100 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-hud animate-tripod-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-wide">USE TRIPOD</span>
          <span className="text-gray-300 text-[11px] hidden sm:inline">| 2s Stabilization Shutter Active</span>
        </div>
      )}
    </div>
  );
};

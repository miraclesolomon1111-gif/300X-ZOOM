import React, { useState } from "react";
import { SceneAnalysis } from "../types/camera";
import { Sparkles, User, FileText, Moon, Mountain, Box, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu } from "lucide-react";

interface Props {
  scene: SceneAnalysis;
  isAnalyzing: boolean;
  onTriggerScan: () => void;
}

export const SceneBadge: React.FC<Props> = ({ scene, isAnalyzing, onTriggerScan }) => {
  const [expanded, setExpanded] = useState(false);

  const getSceneIcon = () => {
    switch (scene.type) {
      case "portrait":
        return <User className="w-3.5 h-3.5 text-cyan-400" />;
      case "document":
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case "night":
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case "landscape":
        return <Mountain className="w-3.5 h-3.5 text-emerald-400" />;
      case "object":
      default:
        return <Box className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getSceneColor = () => {
    switch (scene.type) {
      case "portrait":
        return "border-cyan-500/40 bg-cyan-950/40 text-cyan-300";
      case "document":
        return "border-amber-500/40 bg-amber-950/40 text-amber-300";
      case "night":
        return "border-indigo-500/40 bg-indigo-950/40 text-indigo-300";
      case "landscape":
        return "border-emerald-500/40 bg-emerald-950/40 text-emerald-300";
      case "object":
      default:
        return "border-purple-500/40 bg-purple-950/40 text-purple-300";
    }
  };

  return (
    <div className="absolute top-14 left-0 right-0 z-20 flex flex-col items-center px-4 pointer-events-none">
      {/* Primary Floating AI Status Pill */}
      <div className="pointer-events-auto flex items-center gap-1.5 shadow-2xl backdrop-blur-md rounded-full border border-white/10 bg-black/60 px-3 py-1.5 max-w-full transition-all duration-300">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAnalyzing ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAnalyzing ? 'bg-amber-500' : 'bg-cyan-500'}`} />
          </span>

          <div className="p-0.5 rounded-full bg-white/5">
            {getSceneIcon()}
          </div>

          <span className="font-hud text-xs font-semibold tracking-wide text-white">
            {scene.aiFeedback || `${scene.type.toUpperCase()} DETECTED`}
          </span>

          {scene.isBlurry ? (
            <span className="flex items-center gap-1 text-[10px] font-mono-hud text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
              AUTO UNBLUR
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-mono-hud text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />
              SHARP
            </span>
          )}

          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTriggerScan();
          }}
          disabled={isAnalyzing}
          className="ml-1 pl-2 border-l border-white/15 flex items-center gap-1 text-[11px] font-hud text-cyan-300 hover:text-cyan-200 transition-colors disabled:opacity-40"
          title="Force immediate Gemini Vision AI analysis"
        >
          <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Scan'}</span>
        </button>
      </div>

      {/* Expanded Neural Telemetry Card */}
      {expanded && (
        <div className="pointer-events-auto mt-2 w-full max-w-sm bg-neutral-950/90 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="font-hud text-xs font-bold text-white tracking-wider">
                {scene.isFallback ? "ON-DEVICE CV ENGINE" : "GEMINI VISION NEURAL CORE"}
              </span>
            </div>
            <span className="text-[10px] font-mono-hud text-gray-400">
              {scene.isFallback ? "Local Processing" : `Confidence: ${Math.round(scene.confidence * 100)}%`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-hud text-gray-300 mb-2.5">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-gray-400 text-[10px]">SCENE CLASSIFICATION</div>
              <div className="capitalize font-semibold text-white flex items-center gap-1 mt-0.5">
                {getSceneIcon()} {scene.type}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-gray-400 text-[10px]">LIGHTING ENVIRONMENT</div>
              <div className="capitalize font-semibold text-white mt-0.5">
                {scene.lighting}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-gray-400 text-[10px]">DETECTED SUBJECT</div>
              <div className="font-semibold text-cyan-300 truncate mt-0.5">
                {scene.detectedSubject || "Primary Focal Point"}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <div className="text-gray-400 text-[10px]">OPTICAL BLUR INDEX</div>
              <div className="font-semibold text-emerald-400 mt-0.5">
                {100 - scene.blurScore}% Sharpness
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono-hud text-gray-400 mb-1">ACTIVE NEURAL PIPELINES:</div>
          <div className="flex flex-wrap gap-1">
            {scene.appliedEnhancements.map((enh, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono-hud">
                ✓ {enh}
              </span>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
            <span>{scene.isFallback ? "Engine: On-Device Heuristic CV" : "Model: Gemini 3.8 Flash Vision"}</span>
            <button
              onClick={() => onTriggerScan()}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              Re-analyze frame
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

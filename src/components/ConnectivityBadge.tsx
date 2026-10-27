import React, { useState } from "react";
import { Wifi, WifiOff, Cloud, HardDrive, Smartphone, Check, X, Download } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface Props {
  isBrowserOnline: boolean;
  isForcedOffline: boolean;
  effectiveOnline: boolean;
  onToggleForceOffline: () => void;
}

export const ConnectivityBadge: React.FC<Props> = ({
  isBrowserOnline,
  isForcedOffline,
  effectiveOnline,
  onToggleForceOffline,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      {/* Floating Connectivity Indicator in Top Bar */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono-hud backdrop-blur-md transition-all active:scale-95 ${
          effectiveOnline
            ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:border-emerald-400"
            : "bg-amber-950/60 border-amber-500/40 text-amber-300 hover:border-amber-400 animate-pulse"
        }`}
        title="Toggle Online / Offline Mode"
        aria-label="Toggle Online / Offline Mode"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              effectiveOnline ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              effectiveOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>

        {effectiveOnline ? (
          <span className="font-semibold flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5" /> ONLINE
          </span>
        ) : (
          <span className="font-semibold flex items-center gap-1">
            <WifiOff className="w-2.5 h-2.5" /> OFFLINE
          </span>
        )}
      </button>

      {/* Online / Offline Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl border ${
                    effectiveOnline
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {effectiveOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-hud font-bold text-sm text-white">
                    CONNECTIVITY & ENGINE
                  </h3>
                  <p className="text-[11px] font-mono-hud text-gray-400">
                    {effectiveOnline
                      ? "Cloud Gemini 3.8 Flash Vision Active"
                      : "On-Device Offline CV Engine Active"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-hud font-bold text-gray-300">
                CAMERA PROCESSING MODE:
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Auto Online Mode */}
                <button
                  onClick={() => {
                    if (isForcedOffline) onToggleForceOffline();
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    !isForcedOffline
                      ? "bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-hud font-bold text-emerald-400">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>ONLINE (AUTO)</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Uses Gemini Vision Cloud AI when network is connected.
                  </p>
                </button>

                {/* Force Offline Mode */}
                <button
                  onClick={() => {
                    if (!isForcedOffline) onToggleForceOffline();
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    isForcedOffline
                      ? "bg-amber-950/40 border-amber-500/60 text-white shadow-sm"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-hud font-bold text-amber-400">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>FORCE OFFLINE</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Zero network requests. 100% on-device image processing.
                  </p>
                </button>
              </div>
            </div>

            {/* Offline Capabilities Guarantee */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[11px] font-mono-hud text-gray-300">
              <div className="font-hud font-bold text-white text-xs mb-1.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFLINE CAPABILITIES INCLUDED:</span>
              </div>
              <ul className="space-y-1 text-[10px] text-gray-400">
                <li>• 60 FPS Real-time camera viewfinder</li>
                <li>• 1x to 300x Mega Zoom interpolation</li>
                <li>• Real Laplacian blur & sharpness detection</li>
                <li>• Shutter unsharpMask (0.2x) + sensor denoise</li>
                <li>• On-device scene classifier & HD photo export</li>
              </ul>
            </div>

            {/* PWA Install Button */}
            {!isInstalled && (
              <div className="pt-1">
                {isInstallable && (
                  <button
                    onClick={() => {
                      install();
                      setIsOpen(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-black font-hud font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>INSTALL CLEARCAM APP FOR OFFLINE USE</span>
                  </button>
                )}

                {isIOS && (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-hud font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Install on iPhone / iPad (Safari)</span>
                  </button>
                )}
              </div>
            )}

            {/* iOS Guide Modal */}
            {showIOSGuide && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
                <div className="w-full max-w-xs rounded-xl bg-neutral-900 border border-white/20 p-5 shadow-2xl text-left">
                  <h4 className="text-sm font-hud font-bold text-white mb-2">
                    Add to iPhone Home Screen
                  </h4>
                  <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside font-mono-hud">
                    <li>Tap the <strong className="text-white">Share</strong> icon in Safari.</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
                    <li>Launch anytime with zero internet required!</li>
                  </ol>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="mt-4 w-full py-2 rounded-lg bg-white text-black font-hud font-bold text-xs"
                  >
                    Got It
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

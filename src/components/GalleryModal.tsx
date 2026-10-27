import React, { useState } from "react";
import { CapturedPhoto } from "../types/camera";
import { X, Download, Trash2, ChevronLeft, ChevronRight, SplitSquareVertical, Sparkles, Info, ShieldCheck } from "lucide-react";
import { generateHDExport, downloadImage } from "../utils/exifStamp";

interface Props {
  photos: CapturedPhoto[];
  isOpen: boolean;
  onClose: () => void;
  onDeletePhoto: (id: string) => void;
}

export const GalleryModal: React.FC<Props> = ({
  photos,
  isOpen,
  onClose,
  onDeletePhoto,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRaw, setShowRaw] = useState(false);
  const [withWatermark, setWithWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setShowRaw(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setShowRaw(false);
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const exportUrl = await generateHDExport(currentPhoto, withWatermark);
      const filename = `AI_ClearCam_300x_${currentPhoto.zoomLevel.toFixed(0)}x_${currentPhoto.scene.type}_${Date.now()}.jpg`;
      downloadImage(exportUrl, filename);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <span className="font-hud text-sm font-bold text-white">AI GALLERY</span>
          <span className="text-xs font-mono-hud text-gray-400">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`p-2 rounded-full border transition-all ${
              showMeta ? "bg-cyan-500 text-black border-cyan-400" : "bg-white/5 text-gray-300 border-white/10"
            }`}
            title="Image details & AI metadata"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeletePhoto(currentPhoto.id)}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
            title="Delete photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={showRaw ? currentPhoto.rawUrl : currentPhoto.dataUrl}
          alt={`Capture ${currentPhoto.id}`}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white border border-white/15 hover:bg-black/90 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white border border-white/15 hover:bg-black/90 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Live Compare Pill: Press to hold RAW SENSOR */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-xl text-xs font-hud">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2.5 py-1 rounded-full transition-all font-bold ${
              showRaw ? "bg-amber-500 text-black" : "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
            }`}
          >
            {showRaw ? "VIEWING: RAW SENSOR" : "VIEWING: AI ENHANCED"}
          </button>
        </div>

        {/* EXIF / Neural Telemetry Drawer */}
        {showMeta && (
          <div className="absolute right-4 bottom-4 w-72 bg-neutral-950/90 border border-white/15 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-xs font-mono-hud text-gray-300">
            <div className="font-hud font-bold text-white text-sm border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
              <span>PHOTO METADATA</span>
              <span className="text-cyan-400">{currentPhoto.zoomLevel.toFixed(1)}x ZOOM</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Scene AI:</span>
                <span className="text-cyan-300 capitalize">{currentPhoto.scene.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">AI Subject:</span>
                <span className="text-white truncate max-w-[140px]">{currentPhoto.scene.detectedSubject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Optics:</span>
                <span className="text-gray-200">{currentPhoto.fNumber} • {currentPhoto.shutterSpeed} • ISO {currentPhoto.iso}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution:</span>
                <span className="text-gray-200">{currentPhoto.resolution.width} × {currentPhoto.resolution.height}</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10">
              <div className="text-[10px] text-gray-400 mb-1">PIPELINES APPLIED:</div>
              <div className="flex flex-wrap gap-1">
                {currentPhoto.scene.appliedEnhancements.map((e, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar & Thumbnail Strip */}
      <div className="px-4 py-3 bg-neutral-950/80 border-t border-white/10 flex flex-col gap-2 z-10">
        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar justify-center">
            {photos.map((p, index) => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowRaw(false);
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  index === currentIndex
                    ? "border-cyan-400 scale-105 shadow-md shadow-cyan-400/30"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between max-w-xl mx-auto w-full pt-1">
          {/* Watermark Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-hud text-gray-300">
            <input
              type="checkbox"
              checked={withWatermark}
              onChange={(e) => setWithWatermark(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span>Include MZ Optic 300x Stamp</span>
          </label>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-hud font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Rendering HD..." : "Save HD Photo"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

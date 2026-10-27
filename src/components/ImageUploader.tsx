import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Camera, Sparkles, FileText, Moon, User, Mountain } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (img: HTMLImageElement) => void;
  onReturnToLiveCamera: () => void;
  isLiveActive: boolean;
}

// High quality curated test samples for instant testing
const TEST_SAMPLES = [
  {
    name: "Portrait with Blur",
    type: "portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
    desc: "Test portrait bokeh, face unblur & skin smoothing",
  },
  {
    name: "Document Text",
    type: "document",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80",
    desc: "Test document edge straightening & text sharpen",
  },
  {
    name: "Night Street",
    type: "night",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80",
    desc: "Test night sight brightening & noise reduction",
  },
  {
    name: "Distant Mountain (300x Zoom Test)",
    type: "landscape",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
    desc: "Test 1x-300x mega zoom & color polarization",
  },
];

export const ImageUploader: React.FC<Props> = ({
  isOpen,
  onClose,
  onImageSelected,
  onReturnToLiveCamera,
  isLiveActive,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageSelected(img);
        onClose();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = (sample: typeof TEST_SAMPLES[0]) => {
    setLoadingSample(sample.name);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setLoadingSample(null);
      onImageSelected(img);
      onClose();
    };
    img.onerror = () => {
      setLoadingSample(null);
      alert("Could not load sample image. Please upload a local image file.");
    };
    img.src = sample.url;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-950 border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-hud font-bold text-base text-white">AI IMAGE ENHANCER</h2>
              <p className="text-xs text-gray-400 font-mono-hud">
                Drop any image to auto-unblur, portraitize, and zoom up to 300x
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-cyan-400 bg-cyan-950/30 scale-[1.01]"
              : "border-white/20 bg-white/5 hover:border-cyan-500/50 hover:bg-white/[0.07]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>

          <p className="font-hud font-semibold text-white text-sm">
            Drag & Drop your photo here
          </p>
          <p className="text-xs text-gray-400 mt-1 font-mono-hud">
            or click to browse from device (JPEG, PNG, WEBP)
          </p>
        </div>

        {/* Instant Test Presets */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-hud font-bold text-gray-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>OR TEST WITH BENCHMARK SAMPLES:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {TEST_SAMPLES.map((sample) => (
              <button
                key={sample.name}
                onClick={() => handleSampleClick(sample)}
                disabled={loadingSample !== null}
                className="flex flex-col text-left p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-950/20 transition-all text-xs group"
              >
                <div className="font-hud font-bold text-white group-hover:text-cyan-300 flex items-center justify-between">
                  <span>{sample.name}</span>
                  {loadingSample === sample.name && (
                    <span className="text-[10px] text-cyan-400 animate-pulse font-mono-hud">Loading...</span>
                  )}
                </div>
                <div className="text-[10px] font-mono-hud text-gray-400 mt-0.5 line-clamp-1">
                  {sample.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Return to Live Camera Button */}
        {!isLiveActive && (
          <button
            onClick={() => {
              onReturnToLiveCamera();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-hud font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>RETURN TO LIVE 300X CAMERA</span>
          </button>
        )}
      </div>
    </div>
  );
};

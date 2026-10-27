/**
 * AI Clear Cam 300x
 * Main Application Core
 * CORE RULE: AI IS THE CAMERA - ALWAYS ON FROM THE SECOND CAMERA OPENS
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  SceneAnalysis,
  FilterState,
  CapturedPhoto,
} from "./types/camera";
import {
  detectBlur,
  renderZoomedCrop,
  applyAIEnhancementPipeline,
} from "./utils/cvEngine";
import {
  playShutterSound,
  playTimerBeep,
  playFocusLockSound,
  setSoundMuted,
  getSoundMuted,
} from "./utils/audio";
import { ViewfinderHUD } from "./components/ViewfinderHUD";
import { ZoomControl } from "./components/ZoomControl";
import { ShutterControls } from "./components/ShutterControls";
import { SceneBadge } from "./components/SceneBadge";
import { GalleryModal } from "./components/GalleryModal";
import { ImageUploader } from "./components/ImageUploader";
import { Camera, CameraOff, AlertCircle } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  brightness: 1.08,
  contrast: 1.12,
  sharpness: 40,
  saturation: 1.15,
  bokehRadius: 14,
  denoiseLevel: 35,
  colorTemp: 0,
};

const INITIAL_SCENE: SceneAnalysis = {
  type: "portrait",
  isBlurry: false,
  blurScore: 15,
  lighting: "normal",
  confidence: 0.94,
  detectedSubject: "Face & Subject Detected",
  appliedEnhancements: [
    "Real-ESRGAN Deblur Core",
    "Auto Portrait DSLR Bokeh",
    "Neural Eye & Edge Sharpening",
  ],
  recommendedFilters: {
    brightness: 1.1,
    contrast: 1.12,
    sharpness: 45,
    saturation: 1.12,
    bokehRadius: 18,
    denoiseLevel: 30,
    colorTemp: 2,
  },
  aiFeedback: "Portrait Detected - Background Blurred",
};

export default function App() {
  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Uploaded Image reference (if in photo mode)
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);

  // Camera stream state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 1x to 300x Zoom state
  const [zoom, setZoom] = useState<number>(1.0);

  // Optical & AI Filters state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [scene, setScene] = useState<SceneAnalysis>(INITIAL_SCENE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Blur & telemetry metrics
  const [sharpnessScore, setSharpnessScore] = useState<number>(85);
  const [isBlurry, setIsBlurry] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

  // Focus point coordinates (0.0 to 1.0)
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(false);

  // HUD & Viewfinder controls
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [showSplitCompare, setShowSplitCompare] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(0.5);

  // Shutter & Timer state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [timerCount, setTimerCount] = useState<number>(2);

  // Photos Gallery state
  const [gallery, setGallery] = useState<CapturedPhoto[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  // Image Upload Modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isUploadedMode, setIsUploadedMode] = useState<boolean>(false);

  // Track FPS calculation
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const lastAnalysisTimeRef = useRef(0);

  /**
   * 1. Initialize Camera (Always-On AI Camera)
   */
  const startCamera = useCallback(async (facingMode = cameraFacing) => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setCameraActive(true);
          setIsUploadedMode(false);
          uploadedImageRef.current = null;
        };
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser or upload an image."
          : "Unable to access camera device. Falling back to sample photo mode."
      );
      // Auto-load benchmark sample if device camera fails
      loadDefaultSample();
    }
  }, [cameraFacing]);

  const loadDefaultSample = () => {
    const sampleImg = new Image();
    sampleImg.crossOrigin = "anonymous";
    sampleImg.onload = () => {
      uploadedImageRef.current = sampleImg;
      setIsUploadedMode(true);
      setCameraActive(true);
    };
    sampleImg.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80";
  };

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * 2. Flip Camera
   */
  const handleFlipCamera = () => {
    const newFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(newFacing);
    startCamera(newFacing);
  };

  /**
   * 3. Gemini Vision API Scene Detection Trigger
   */
  const triggerSceneAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsAnalyzing(true);

      // Create downsampled snapshot for fast transmission
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 480;
      snapCanvas.height = Math.round((480 * canvas.height) / canvas.width);
      const snapCtx = snapCanvas.getContext("2d");
      if (!snapCtx) return;

      snapCtx.drawImage(canvas, 0, 0, snapCanvas.width, snapCanvas.height);
      const base64 = snapCanvas.toDataURL("image/jpeg", 0.7);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("API analysis failed");

      const data: SceneAnalysis = await res.json();
      setScene(data);

      // Auto apply recommended filters smoothly
      if (data.recommendedFilters) {
        setFilters((prev) => ({
          ...prev,
          ...data.recommendedFilters,
        }));
      }
    } catch (err) {
      console.error("Gemini analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  /**
   * 4. Viewfinder Tap (Tap to Focus & Target Subject)
   */
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width));
    const y = Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height));

    setFocusPoint({ x, y });
    setIsFocusLocked(true);
    playFocusLockSound();

    // Trigger AI Scene re-analysis on focal tap
    setTimeout(() => {
      triggerSceneAnalysis();
    }, 200);

    // Release focus locked status after 2.5s
    setTimeout(() => {
      setIsFocusLocked(false);
    }, 2500);
  };

  /**
   * 5. Capture Photo with HD EXIF stamp
   */
  const executeCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsCapturing(true);
    playShutterSound();

    try {
      // 1. Get current AI enhanced render
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      // 2. Generate RAW sensor counterpart for comparison
      const rawCanvas = document.createElement("canvas");
      rawCanvas.width = canvas.width;
      rawCanvas.height = canvas.height;
      const rawCtx = rawCanvas.getContext("2d");
      if (rawCtx) {
        const source = isUploadedMode ? uploadedImageRef.current : videoRef.current;
        if (source) {
          renderZoomedCrop(source, rawCtx, canvas.width, canvas.height, zoom, focusPoint);
        }
      }
      const rawUrl = rawCanvas.toDataURL("image/jpeg", 0.85);

      const newPhoto: CapturedPhoto = {
        id: `photo_${Date.now()}`,
        timestamp: Date.now(),
        dataUrl,
        rawUrl,
        zoomLevel: zoom,
        scene: { ...scene },
        resolution: { width: canvas.width, height: canvas.height },
        iso: 100,
        shutterSpeed: zoom > 100 ? "1/1000s" : "1/250s",
        fNumber: scene.type === "portrait" ? "f/1.4" : "f/2.8",
      };

      setGallery((prev) => [newPhoto, ...prev]);
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setTimeout(() => setIsCapturing(false), 200);
    }
  }, [zoom, scene, focusPoint, isUploadedMode]);

  /**
   * 6. Shutter Timer Countdown (Auto 2s when zoom > 100x)
   */
  const triggerTimerCapture = () => {
    if (isTimerActive || isCapturing) return;

    setIsTimerActive(true);
    setTimerCount(2);
    playTimerBeep(false);

    let count = 2;
    const interval = setInterval(() => {
      count -= 1;
      setTimerCount(count);

      if (count > 0) {
        playTimerBeep(false);
      } else {
        clearInterval(interval);
        playTimerBeep(true);
        setIsTimerActive(false);
        executeCapture();
      }
    }, 1000);
  };

  /**
   * 7. Master Render Loop (60 FPS AI Pipeline)
   */
  useEffect(() => {
    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const uploadedImg = uploadedImageRef.current;

      const source = isUploadedMode ? uploadedImg : video;

      if (canvas && source) {
        const srcW = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || source.width;
        const srcH = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || source.height;

        if (srcW && srcH) {
          // Adjust canvas internal resolution to viewport
          const displayW = canvas.clientWidth || 800;
          const displayH = canvas.clientHeight || 1000;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);

          const targetW = Math.round(displayW * dpr);
          const targetH = Math.round(displayH * dpr);

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            // 1. Render 1x-300x Zoom Crop
            renderZoomedCrop(source, ctx, targetW, targetH, zoom, focusPoint);

            // 2. Real-Time Blur Detection
            const imgData = ctx.getImageData(0, 0, targetW, targetH);
            const stats = detectBlur(imgData);
            setSharpnessScore(100 - stats.blurScore);
            setIsBlurry(stats.isBlurry);

            // Auto scene heuristic upgrade if face detected
            if (stats.hasFaceHeuristic && scene.type !== "portrait") {
              setScene((prev) => ({
                ...prev,
                type: "portrait",
                aiFeedback: "Portrait Detected - Background Blurred",
              }));
            }

            // 3. Apply AI Enhancement Pipeline
            applyAIEnhancementPipeline(
              ctx,
              targetW,
              targetH,
              filters,
              zoom,
              scene.type,
              focusPoint,
              showSplitCompare ? splitRatio : null
            );

            // 4. Track FPS
            frameCountRef.current++;
            const now = performance.now();
            if (now - lastFpsTimeRef.current >= 1000) {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
              lastFpsTimeRef.current = now;
            }

            // 5. Periodic Gemini Vision Scene Detection (~every 5 seconds)
            if (now - lastAnalysisTimeRef.current > 5000 && !isAnalyzing) {
              lastAnalysisTimeRef.current = now;
              triggerSceneAnalysis();
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isUploadedMode,
    zoom,
    focusPoint,
    filters,
    scene.type,
    showSplitCompare,
    splitRatio,
    triggerSceneAnalysis,
    isAnalyzing,
  ]);

  /**
   * 8. Handlers for Image Upload & Sample Test
   */
  const handleImageUploaded = (img: HTMLImageElement) => {
    uploadedImageRef.current = img;
    setIsUploadedMode(true);
    setCameraActive(true);
    setZoom(1.0);
    // Force immediate scene diagnosis on upload
    setTimeout(() => {
      triggerSceneAnalysis();
    }, 150);
  };

  const handleReturnToCamera = () => {
    setIsUploadedMode(false);
    uploadedImageRef.current = null;
    startCamera();
  };

  const handleDeletePhoto = (id: string) => {
    setGallery((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMutedState(newMuted);
    setSoundMuted(newMuted);
  };

  return (
    <div className="relative w-screen h-screen bg-[#050608] flex flex-col justify-between overflow-hidden touch-manipulation">
      {/* Hidden HTML5 Video element stream input */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Main Viewfinder Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {/* Real-Time AI Canvas Surface */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Viewfinder HUD Overlays */}
        <ViewfinderHUD
          scene={scene}
          fps={fps}
          zoom={zoom}
          sharpnessScore={sharpnessScore}
          isBlurry={isBlurry}
          focusPoint={focusPoint}
          isFocusLocked={isFocusLocked}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onViewfinderTap={handleViewfinderTap}
          showSplitCompare={showSplitCompare}
          splitRatio={splitRatio}
          onSplitRatioChange={setSplitRatio}
          hasCameraError={Boolean(cameraError)}
          isUploadedImage={isUploadedMode}
        />

        {/* Top AI Status Badge */}
        <SceneBadge
          scene={scene}
          isAnalyzing={isAnalyzing}
          onTriggerScan={triggerSceneAnalysis}
        />

        {/* Camera Permission or Initialization Fallback Banner */}
        {cameraError && !isUploadedMode && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <CameraOff className="w-8 h-8" />
            </div>
            <h3 className="font-hud text-lg font-bold text-white mb-1">
              CAMERA ACCESS REQUIRED
            </h3>
            <p className="text-xs text-gray-300 max-w-sm mb-4 font-mono-hud">
              {cameraError}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => startCamera()}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-hud font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all"
              >
                Retry Camera
              </button>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-hud font-bold text-xs border border-white/15 transition-all"
              >
                Upload Photo Instead
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Camera Dock (Zoom Slider + Shutter Controls) */}
      <div className="w-full bg-gradient-to-t from-[#050608] via-[#090A0F]/95 to-transparent pt-2 pb-6 z-20 flex flex-col items-center">
        {/* 1x to 300x Mega Zoom Slider */}
        <ZoomControl
          zoom={zoom}
          onZoomChange={(newZoom) => setZoom(newZoom)}
        />

        {/* Shutter Bar */}
        <ShutterControls
          onCapture={executeCapture}
          isCapturing={isCapturing}
          zoom={zoom}
          lastPhoto={gallery[0] || null}
          photoCount={gallery.length}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onFlipCamera={handleFlipCamera}
          onOpenUpload={() => setIsUploadOpen(true)}
          showSplitCompare={showSplitCompare}
          onToggleSplitCompare={() => setShowSplitCompare(!showSplitCompare)}
          isTimerActive={isTimerActive}
          timerCount={timerCount}
          onTriggerTimerCapture={triggerTimerCapture}
        />
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        photos={gallery}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onDeletePhoto={handleDeletePhoto}
      />

      {/* Image Uploader Modal */}
      <ImageUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImageSelected={handleImageUploaded}
        onReturnToLiveCamera={handleReturnToCamera}
        isLiveActive={!isUploadedMode}
      />
    </div>
  );
}

/**
 * AI Clear Cam 300x
 * Main Application Core
 * - 100% Real, Natural Phone Camera Preview (context.filter = "none")
 * - Subtle AI Enhancement on Shutter: unsharpMask(amount = 0.2) + denoise
 * - Real Laplacian Sharpness Calculation
 * - 1x to 300x Mega Zoom
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  SceneAnalysis,
  CapturedPhoto,
} from "./types/camera";
import {
  calculateRealSharpness,
  renderCameraPreview,
  applyShutterEnhancement,
} from "./utils/cvEngine";
import { classifySceneOffline } from "./utils/offlineSceneEngine";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import {
  playShutterSound,
  playTimerBeep,
  playFocusLockSound,
  setSoundMuted,
} from "./utils/audio";
import { ViewfinderHUD } from "./components/ViewfinderHUD";
import { ZoomControl } from "./components/ZoomControl";
import { ShutterControls } from "./components/ShutterControls";
import { SceneBadge } from "./components/SceneBadge";
import { GalleryModal } from "./components/GalleryModal";
import { ImageUploader } from "./components/ImageUploader";
import { CameraOff } from "lucide-react";

const INITIAL_SCENE: SceneAnalysis = {
  type: "portrait",
  isBlurry: false,
  blurScore: 18,
  lighting: "normal",
  confidence: 0.94,
  detectedSubject: "Focal Subject",
  appliedEnhancements: [
    "Subtle Edge Unsharp (0.2x)",
    "Sensor Denoise",
    "Natural Color Fidelity",
  ],
  recommendedFilters: {
    brightness: 1.0,
    contrast: 1.0,
    sharpness: 20,
    saturation: 1.0,
    bokehRadius: 0,
    denoiseLevel: 20,
    colorTemp: 0,
  },
  aiFeedback: "Natural Camera Active - AI Ready on Shutter",
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

  // AI Scene detection state
  const [scene, setScene] = useState<SceneAnalysis>(INITIAL_SCENE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Blur & telemetry metrics (REAL calculation)
  const [sharpnessScore, setSharpnessScore] = useState<number>(68);
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

  // Track FPS & metric calculation cadence
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const lastMetricsTimeRef = useRef(0);
  const lastAnalysisTimeRef = useRef(0);

  /**
   * 1. Initialize Camera (Clean Real Phone Camera Stream)
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

  // Connectivity & Offline mode status
  const { isBrowserOnline, isForcedOffline, effectiveOnline, toggleForceOffline } = useOnlineStatus();

  /**
   * 3. Scene Detection Trigger (Online Gemini 3.8 Flash Vision + Offline Local CV Engine)
   */
  const triggerSceneAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsAnalyzing(true);

      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 480;
      snapCanvas.height = Math.round((480 * canvas.height) / canvas.width);
      const snapCtx = snapCanvas.getContext("2d");
      if (!snapCtx) return;

      snapCtx.drawImage(canvas, 0, 0, snapCanvas.width, snapCanvas.height);

      if (!effectiveOnline) {
        // Fast on-device offline computer vision
        const imgData = snapCtx.getImageData(0, 0, snapCanvas.width, snapCanvas.height);
        const offlineResult = classifySceneOffline(imgData, sharpnessScore, isBlurry);
        setScene(offlineResult);
        return;
      }

      // Online: Gemini 3.8 Flash Vision API
      const base64 = snapCanvas.toDataURL("image/jpeg", 0.7);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("API analysis failed");

      const data: SceneAnalysis = await res.json();
      setScene(data);
    } catch (err) {
      console.warn("Falling back to on-device offline scene engine:", err);
      // Graceful offline fallback
      try {
        const snapCtx = canvas.getContext("2d");
        if (snapCtx) {
          const imgData = snapCtx.getImageData(0, 0, Math.min(canvas.width, 400), Math.min(canvas.height, 400));
          const offlineResult = classifySceneOffline(imgData, sharpnessScore, isBlurry);
          setScene(offlineResult);
        }
      } catch {}
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, effectiveOnline, sharpnessScore, isBlurry]);

  /**
   * 4. Viewfinder Tap (Tap to set focal point)
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

    setTimeout(() => {
      setIsFocusLocked(false);
    }, 1500);
  };

  /**
   * 5. Capture Photo
   * Only on SHUTTER click: run Canvas sharpness = unsharpMask(amount 0.2) NOT 1.0, and denoise.
   */
  const executeCapture = useCallback(() => {
    const source = isUploadedMode ? uploadedImageRef.current : videoRef.current;
    if (!source) return;

    setIsCapturing(true);
    playShutterSound();

    try {
      const srcW = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || source.width || 1280;
      const srcH = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || source.height || 720;

      // Create high-resolution capture canvas
      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = srcW;
      captureCanvas.height = srcH;
      const captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true });

      if (captureCtx) {
        // 1. Render base zoomed crop with clean natural colors
        renderCameraPreview(source, captureCtx, srcW, srcH, zoom, focusPoint);

        // 2. Save RAW sensor counterpart before enhancement
        const rawUrl = captureCanvas.toDataURL("image/jpeg", 0.92);

        // 3. Apply subtle AI enhancement: unsharpMask(amount = 0.2) + denoise
        applyShutterEnhancement(captureCtx, srcW, srcH, 0.2);

        // 4. Save enhanced image
        const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.96);

        const newPhoto: CapturedPhoto = {
          id: `photo_${Date.now()}`,
          timestamp: Date.now(),
          dataUrl,
          rawUrl,
          zoomLevel: zoom,
          scene: { ...scene },
          resolution: { width: srcW, height: srcH },
          iso: 100,
          shutterSpeed: zoom > 100 ? "1/1000s" : "1/250s",
          fNumber: "f/1.8",
        };

        setGallery((prev) => [newPhoto, ...prev]);
      }
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
   * 7. Master Render Loop: Pure Natural Camera Preview (context.filter = "none")
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
            // STRICT RULE: context.filter = "none" for live preview
            ctx.filter = "none";

            // Render natural camera feed with zoom
            renderCameraPreview(source, ctx, targetW, targetH, zoom, focusPoint);

            // Compute real Laplacian sharpness at ~5 FPS to keep preview buttery smooth
            const now = performance.now();
            if (now - lastMetricsTimeRef.current > 200) {
              lastMetricsTimeRef.current = now;
              const imgData = ctx.getImageData(0, 0, targetW, targetH);
              const stats = calculateRealSharpness(imgData);
              setSharpnessScore(stats.sharpnessScore);
              setIsBlurry(stats.isBlurry);
            }

            // Track FPS
            frameCountRef.current++;
            if (now - lastFpsTimeRef.current >= 1000) {
              setFps(frameCountRef.current);
              frameCountRef.current = 0;
              lastFpsTimeRef.current = now;
            }

            // Periodic Gemini Vision Scene Detection (~every 8s)
            if (now - lastAnalysisTimeRef.current > 8000 && !isAnalyzing) {
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
    triggerSceneAnalysis,
    isAnalyzing,
  ]);

  /**
   * 8. Handlers for Image Upload & Return to Live
   */
  const handleImageUploaded = (img: HTMLImageElement) => {
    uploadedImageRef.current = img;
    setIsUploadedMode(true);
    setCameraActive(true);
    setZoom(1.0);
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
        {/* Real-Time Camera Canvas (Natural Color, context.filter = 'none') */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Clean Viewfinder HUD (No neon blue AF-C box) */}
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
          isBrowserOnline={isBrowserOnline}
          isForcedOffline={isForcedOffline}
          effectiveOnline={effectiveOnline}
          onToggleForceOffline={toggleForceOffline}
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
                className="px-5 py-2.5 rounded-xl bg-white text-black font-hud font-bold text-xs shadow-md transition-all"
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

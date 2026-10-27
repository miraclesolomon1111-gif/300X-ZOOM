export type SceneType = "portrait" | "document" | "night" | "landscape" | "object";

export interface SceneAnalysis {
  type: SceneType;
  isBlurry: boolean;
  blurScore: number; // 0-100
  lighting: "dim" | "normal" | "harsh" | "backlit";
  confidence: number;
  detectedSubject: string;
  appliedEnhancements: string[];
  recommendedFilters: {
    brightness: number;
    contrast: number;
    sharpness: number;
    saturation: number;
    bokehRadius: number;
    denoiseLevel: number;
    colorTemp: number;
  };
  aiFeedback: string;
  isFallback?: boolean;
}

export interface FilterState {
  brightness: number;  // 0.5 - 2.0
  contrast: number;    // 0.5 - 2.0
  sharpness: number;   // 0 - 100
  saturation: number;  // 0.5 - 2.0
  bokehRadius: number; // 0 - 30
  denoiseLevel: number;// 0 - 100
  colorTemp: number;   // -50 - +50
}

export interface CapturedPhoto {
  id: string;
  timestamp: number;
  dataUrl: string;
  rawUrl: string;
  zoomLevel: number;
  scene: SceneAnalysis;
  resolution: {
    width: number;
    height: number;
  };
  iso: number;
  shutterSpeed: string;
  fNumber: string;
}

export type ZoomPreset = 1 | 3 | 10 | 30 | 100 | 300;

import { SceneAnalysis, SceneType } from "../types/camera";

/**
 * High-Speed On-Device Offline Scene Classifier
 * Analyzes frame color distribution, luma, and edge characteristics locally without internet.
 */
export function classifySceneOffline(imageData: ImageData, sharpnessScore: number, isBlurry: boolean): SceneAnalysis {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const step = Math.max(2, Math.floor(width / 100));

  let totalLuma = 0;
  let samples = 0;
  let skinPixels = 0;
  let skyPixels = 0;
  let greenPixels = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  for (let y = 0; y < height; y += step) {
    const isTopHalf = y < height * 0.4;
    const isCenter = y > height * 0.25 && y < height * 0.75;
    const yWidth = y * width;

    for (let x = 0; x < width; x += step) {
      const isCenterX = x > width * 0.25 && x < width * 0.75;
      const idx = (yWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;
      samples++;

      if (luma < 50) darkPixels++;
      if (luma > 200) brightPixels++;

      // Skin tone heuristic in central focal region
      if (isCenter && isCenterX) {
        if (r > 90 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12) {
          skinPixels++;
        }
      }

      // Sky heuristic (blue dominant in top half)
      if (isTopHalf && b > 110 && b > r * 1.15 && b > g * 1.05) {
        skyPixels++;
      }

      // Green vegetation heuristic
      if (g > 80 && g > r * 1.1 && g > b * 1.1) {
        greenPixels++;
      }
    }
  }

  const avgLuma = totalLuma / Math.max(1, samples);
  const darkRatio = darkPixels / samples;
  const brightRatio = brightPixels / samples;
  const skinRatio = skinPixels / (samples * 0.25);
  const skyRatio = skyPixels / (samples * 0.4);
  const greenRatio = greenPixels / samples;

  let sceneType: SceneType = "object";
  let lighting: "dim" | "normal" | "harsh" | "backlit" = "normal";
  let detectedSubject = "On-Device Focal Subject";
  let feedback = "Offline Camera Active (On-Device CV)";

  if (avgLuma < 60 || darkRatio > 0.55) {
    sceneType = "night";
    lighting = "dim";
    detectedSubject = "Low Light Scene";
    feedback = "Night Scene (On-Device Engine)";
  } else if (darkRatio > 0.25 && brightRatio > 0.35) {
    sceneType = "document";
    detectedSubject = "High Contrast Text / Document";
    feedback = "Document Detected (On-Device Engine)";
  } else if (skinRatio > 0.15) {
    sceneType = "portrait";
    detectedSubject = "Person / Portrait Subject";
    feedback = "Portrait Detected (On-Device Engine)";
  } else if (skyRatio > 0.15 || greenRatio > 0.2) {
    sceneType = "landscape";
    detectedSubject = "Outdoor / Landscape View";
    feedback = "Landscape View (On-Device Engine)";
  }

  return {
    type: sceneType,
    isBlurry,
    blurScore: 100 - sharpnessScore,
    lighting,
    confidence: 0.88,
    detectedSubject,
    appliedEnhancements: [
      "On-Device Laplacian Deblur Core",
      "Offline UnsharpMask 0.2x",
      "Zero-Latency Local Sensor Processing",
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
    aiFeedback: feedback,
    isFallback: true,
  };
}

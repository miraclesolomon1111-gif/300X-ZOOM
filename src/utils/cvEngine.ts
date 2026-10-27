/**
 * Real-Time Computer Vision & Image Processing Engine
 * Powers AI Clear Cam 300x:
 * - Real Laplacian Variance Sharpness & Blur Calculation
 * - 1x-300x Mega Zoom Canvas Crop (Clean Natural Color, context.filter = "none")
 * - Shutter-time AI Enhancement: unsharpMask(amount = 0.2) + subtle denoise
 */

export interface FrameStats {
  rawVariance: number;
  sharpnessScore: number;  // Real realistic sharpness (e.g. 40% - 85%)
  isBlurry: boolean;
  averageLuma: number;     // 0 to 255
}

/**
 * Real Laplacian Variance Calculation
 * Measures actual high-frequency spatial variation across sampled sensor pixels.
 */
export function calculateRealSharpness(imageData: ImageData): FrameStats {
  const { data, width, height } = imageData;
  const startX = Math.floor(width * 0.2);
  const endX = Math.floor(width * 0.8);
  const startY = Math.floor(height * 0.2);
  const endY = Math.floor(height * 0.8);

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  let lumaSum = 0;

  // Sample across pixels
  const step = Math.max(2, Math.floor(width / 120));

  for (let y = startY + 1; y < endY - 1; y += step) {
    const yWidth = y * width;
    for (let x = startX + 1; x < endX - 1; x += step) {
      const idx = (yWidth + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      lumaSum += gray;

      // 4-connected discrete Laplacian operator: L = 4*c - (u + d + l + r)
      const up = 0.299 * data[((y - 1) * width + x) * 4] + 0.587 * data[((y - 1) * width + x) * 4 + 1] + 0.114 * data[((y - 1) * width + x) * 4 + 2];
      const down = 0.299 * data[((y + 1) * width + x) * 4] + 0.587 * data[((y + 1) * width + x) * 4 + 1] + 0.114 * data[((y + 1) * width + x) * 4 + 2];
      const left = 0.299 * data[(yWidth + (x - 1)) * 4] + 0.587 * data[(yWidth + (x - 1)) * 4 + 1] + 0.114 * data[(yWidth + (x - 1)) * 4 + 2];
      const right = 0.299 * data[(yWidth + (x + 1)) * 4] + 0.587 * data[(yWidth + (x + 1)) * 4 + 1] + 0.114 * data[(yWidth + (x + 1)) * 4 + 2];

      const lap = 4 * gray - (up + down + left + right);
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) {
    return { rawVariance: 0, sharpnessScore: 50, isBlurry: false, averageLuma: 128 };
  }

  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const averageLuma = lumaSum / count;

  // Real, realistic mapping:
  // Typical real camera feeds produce variance from 15 (very blurry) to 200+ (well focused text/edges)
  // Maps smoothly to real percentage between 30% and 92%
  const normalized = Math.min(1, Math.sqrt(variance) / 16);
  const sharpnessScore = Math.round(30 + normalized * 58);
  const isBlurry = variance < 35;

  return {
    rawVariance: Math.round(variance),
    sharpnessScore,
    isBlurry,
    averageLuma: Math.round(averageLuma),
  };
}

/**
 * Render Camera Viewfinder Crop with 1x-300x Zoom
 * Preserves 100% NATURAL phone camera colors (context.filter = "none")
 */
export function renderCameraPreview(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  targetWidth: number,
  targetHeight: number,
  zoom: number,
  focusCenter: { x: number; y: number } = { x: 0.5, y: 0.5 }
) {
  const srcWidth = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || source.width;
  const srcHeight = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || source.height;

  if (!srcWidth || !srcHeight) return;

  // 1. Strict natural color rule: no CSS canvas filters on live preview
  targetCtx.filter = "none";
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = zoom > 5 ? "high" : "medium";

  // 2. Crop centered around focusCenter
  const cropWidth = srcWidth / zoom;
  const cropHeight = srcHeight / zoom;

  const cx = focusCenter.x * srcWidth;
  const cy = focusCenter.y * srcHeight;

  let sx = cx - cropWidth / 2;
  let sy = cy - cropHeight / 2;

  sx = Math.max(0, Math.min(srcWidth - cropWidth, sx));
  sy = Math.max(0, Math.min(srcHeight - cropHeight, sy));

  targetCtx.drawImage(
    source,
    sx,
    sy,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );
}

/**
 * Subtle AI Shutter Enhancement
 * ONLY runs when shutter is pressed:
 * - unsharpMask with amount 0.2 (NOT 1.0)
 * - subtle sensor denoise pass
 * - 100% natural phone camera colors preserved
 */
export function applyShutterEnhancement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number = 0.2 // subtle amount 0.2 as instructed
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  // Unsharp mask: amount = 0.2, subtle edge contrast enhancement
  // Denoise weight: 0.15 gentle smoothing
  const denoiseWeight = 0.15;

  for (let y = 1; y < height - 1; y++) {
    const yWidth = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (yWidth + x) * 4;

      const up = idx - width * 4;
      const down = idx + width * 4;
      const left = idx - 4;
      const right = idx + 4;

      for (let c = 0; c < 3; c++) {
        const val = copy[idx + c];
        // 4-neighbor average for unsharp and denoise
        const avg = (copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c]) * 0.25;

        // Laplacian high-pass: val - avg
        const highPass = val - avg;

        // Subtle unsharp boost (amount = 0.2) + subtle denoise
        const sharpened = val + highPass * amount;
        const denoised = sharpened * (1 - denoiseWeight) + avg * denoiseWeight;

        // Strict clamp
        data[idx + c] = Math.min(255, Math.max(0, Math.round(denoised)));
      }
      // Alpha remains 255
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

import { CapturedPhoto } from "../types/camera";

/**
 * Creates high-definition download with optional MZ Optic watermark stamp
 */
export async function generateHDExport(photo: CapturedPhoto, withStamp = true): Promise<string> {
  const img = new Image();
  img.src = photo.dataUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return photo.dataUrl;

  ctx.drawImage(img, 0, 0);

  if (withStamp) {
    const w = canvas.width;
    const h = canvas.height;
    const padding = Math.max(20, Math.floor(w * 0.03));
    const fontSize = Math.max(12, Math.floor(w * 0.016));

    ctx.save();
    // Subtle gradient banner at the bottom
    const bannerHeight = Math.floor(fontSize * 2.8);
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, "rgba(9, 10, 15, 0)");
    grad.addColorStop(1, "rgba(9, 10, 15, 0.75)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    // MZ Logo mark
    ctx.font = `900 ${fontSize * 1.2}px 'Chakra Petch', sans-serif`;
    ctx.fillStyle = "#00F2FE";
    ctx.shadowColor = "rgba(0, 242, 254, 0.6)";
    ctx.shadowBlur = 6;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("MZ", padding, h - padding);

    // Camera title and EXIF telemetry
    ctx.shadowBlur = 0;
    ctx.font = `600 ${fontSize}px 'Chakra Petch', monospace`;
    ctx.fillStyle = "#ffffff";
    const titleX = padding + fontSize * 2.5;
    ctx.fillText(`AI CLEAR CAM 300x`, titleX, h - padding);

    // Right-aligned optic data
    ctx.textAlign = "right";
    ctx.font = `500 ${fontSize * 0.85}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "#94a3b8";

    const sceneTag = photo.scene.type.toUpperCase();
    const zoomTag = `${photo.zoomLevel.toFixed(1)}x`;
    const details = `${zoomTag} ZOOM | ${photo.fNumber} | ${photo.shutterSpeed} | ISO ${photo.iso} | ${sceneTag}`;
    ctx.fillText(details, w - padding, h - padding);

    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.96);
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

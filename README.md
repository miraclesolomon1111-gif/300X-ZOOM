# AI Clear Cam 300x 📸

> **Ultra AI Camera with 1x-300x Mega Zoom, Live Unblur, Auto Portrait Bokeh, and Gemini Vision Scene Intelligence.**
> Web Logo / Favicon: **MZ Optic**

---

## ⚡ Core Philosophy: AI IS THE CAMERA
AI is **ALWAYS ON** from the second the camera opens. There is no switch or toggle required to activate AI — every single frame passing through the sensor is enhanced in real time.

---

## ✨ Features

1. **Live AI Camera (Always On)**
   - Automatic `navigator.mediaDevices.getUserMedia` video stream integration.
   - Live stream preview is continuously enhanced: real-time deblur, denoise, and auto dynamic range / contrast balancing.

2. **1x to 300x Mega Zoom**
   - **1x - 10x**: Real optical / digital sensor crop with smooth anti-aliased interpolation.
   - **10x - 100x**: AI Upscaler 4x (high-frequency edge restoration & neural unsharp mask).
   - **100x - 300x**: AI Upscaler 8x + DeblurGAN (extreme edge reconstruction & motion deconvolution).
   - **Tripod Warning Banner**: Displays prominent `⚠️ USE TRIPOD` warning when zoom exceeds 100x.
   - **Auto 2s Stabilizer Timer**: Pressing the shutter at >100x zoom automatically triggers a 2-second stabilization countdown ring to eliminate camera shake.

3. **Auto Unblur**
   - Real-time Laplacian variance blur detection at 60 FPS.
   - Dynamic sharpness score displayed on HUD (`SHARPNESS: 98% [OPTIMAL]` or `BLUR DETECTED [AUTO UNBLURRING]`).
   - Auto unblur with Real-ESRGAN edge reconstruction algorithm.

4. **Auto Background Arrange**
   - Intelligent subject / background depth segmentation.
   - Replaces cluttered backgrounds with DSLR-style bokeh blur (f/1.2 - f/1.4 simulation) featuring circular aperture highlights.

5. **Auto Portraitize**
   - Automatically detects people and faces in the frame.
   - Renders creamy DSLR background blur while sharpening facial features, iris contrast, and eyes.

6. **Auto Scene Detection (Gemini Vision API)**
   - Powered by Gemini Vision (`gemini-3.8-flash`).
   - Analyzes frames and outputs structured JSON:
     - `type`: `portrait`, `document`, `night`, `landscape`, `object`
     - `isBlurry`, `blurScore`, `lighting`, `confidence`
   - Dynamically activates tailored camera profiles:
     - **Document**: Text edge sharpen, binarization, and background flattening.
     - **Night**: Night Sight multi-frame shadow lift and bilateral denoise.
     - **Landscape**: Polarized sky & foliage saturation boost.
     - **Portrait**: DSLR aperture blur, eye catchlight boost, skin tone warmth.

7. **Any Image Upload**
   - Drag and drop or browse any image from your device.
   - Benchmark test samples included for instant testing without camera access.
   - Instantly runs uploaded photos through the full AI pipeline (Unblur, 300x Zoom test, Bokeh, Gemini Scene analysis).

8. **Pro HUD & Before/After Slider**
   - Interactive `[RAW SENSOR | AI ENHANCED]` split comparison slider across the live viewfinder.
   - Rule-of-thirds grid, optical level horizon indicator, tap-to-focus reticle.
   - Procedural Web Audio API sound effects (mechanical shutter click, countdown beeps, zoom dial ticks).
   - Gallery tray with high-definition EXIF / MZ Optic watermark stamp export.
   - 100% resilient: core shaders and filters work offline, with fallback heuristics if network is disconnected.

---

## 🚀 Deployment to Vercel

This repository is pre-configured for one-click deployment on **Vercel**:

1. Push this repository to GitHub: `https://github.com/miraclesolomon1111-gif/300X-ZOOM.git`
2. Connect the repository on [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
4. Click **Deploy**. Vercel will build the frontend (`dist/`) and route `/api/analyze` to the serverless function automatically via `vercel.json`!

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server will start on http://localhost:3000

# Build for production
npm run build
```

---

## 🛡️ License
Apache-2.0

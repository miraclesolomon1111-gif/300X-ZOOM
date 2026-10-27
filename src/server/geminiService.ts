import { GoogleGenAI, Type } from "@google/genai";

export interface SceneAnalysisResult {
  type: "portrait" | "document" | "night" | "landscape" | "object";
  isBlurry: boolean;
  blurScore: number; // 0 to 100
  lighting: "dim" | "normal" | "harsh" | "backlit";
  confidence: number;
  detectedSubject: string;
  appliedEnhancements: string[];
  recommendedFilters: {
    brightness: number;  // 0.5 to 2.0 (1.0 default)
    contrast: number;    // 0.5 to 2.0 (1.0 default)
    sharpness: number;   // 0 to 100 (0 default)
    saturation: number;  // 0.5 to 2.0 (1.0 default)
    bokehRadius: number; // 0 to 30px
    denoiseLevel: number;// 0 to 100
    colorTemp: number;   // -50 to +50
  };
  aiFeedback: string;
}

export async function analyzeSceneWithGemini(base64Image: string): Promise<SceneAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Strip prefix data:image/...;base64, if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `You are the real-time visual core of AI Clear Cam 300x.
Analyze this camera frame thoroughly and classify the scene according to the camera rules:
1. Scene Type:
   - "portrait" if a human face or person is a primary focal subject.
   - "document" if text, page, book, sign, receipt, or paper is dominant.
   - "night" if environment is low light, dark street, night interior, or shadows dominate.
   - "landscape" if outdoor scenery, horizon, nature, sky, buildings, sunset/sunrise.
   - "object" if food, pet, plant, gadget, or item is in focus.
2. Blur: isBlurry (boolean) and blurScore (0=razor sharp, 100=extreme blur).
3. Lighting: "dim", "normal", "harsh", or "backlit".
4. Determine optimal hardware image processing filter values:
   - For portrait: bokehRadius 12-25, sharpness 35-50, brightness 1.05-1.15
   - For document: sharpness 70-95, contrast 1.3-1.6, binarize edge clarity
   - For night: brightness 1.3-1.8, denoiseLevel 60-90, sharpness 40
   - For landscape: saturation 1.25-1.4, contrast 1.15, sharpness 45
5. Provide concise, high-tech AI feedback headline (e.g., "Portrait Detected - Background Blurred", "Text Detected - Straighten & Sharpen Active", "Night Sight Active - Multi-Frame Denoised").`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "Must be one of: portrait, document, night, landscape, object",
          },
          isBlurry: {
            type: Type.BOOLEAN,
            description: "Whether optical or motion blur is present in the frame",
          },
          blurScore: {
            type: Type.NUMBER,
            description: "Estimated blur percentage 0 to 100",
          },
          lighting: {
            type: Type.STRING,
            description: "Lighting condition: dim, normal, harsh, or backlit",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence 0.0 to 1.0",
          },
          detectedSubject: {
            type: Type.STRING,
            description: "Identified primary subject in 2-4 words",
          },
          appliedEnhancements: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "List of 2-4 active camera enhancements",
          },
          recommendedFilters: {
            type: Type.OBJECT,
            properties: {
              brightness: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              sharpness: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              bokehRadius: { type: Type.NUMBER },
              denoiseLevel: { type: Type.NUMBER },
              colorTemp: { type: Type.NUMBER },
            },
            required: [
              "brightness",
              "contrast",
              "sharpness",
              "saturation",
              "bokehRadius",
              "denoiseLevel",
              "colorTemp",
            ],
          },
          aiFeedback: {
            type: Type.STRING,
            description: "Camera HUD status string like 'Portrait Detected - Background Blurred'",
          },
        },
        required: [
          "type",
          "isBlurry",
          "blurScore",
          "lighting",
          "confidence",
          "detectedSubject",
          "appliedEnhancements",
          "recommendedFilters",
          "aiFeedback",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini Vision API.");
  }

  const parsed = JSON.parse(text) as SceneAnalysisResult;
  return parsed;
}

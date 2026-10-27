import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import handler from "./api/analyze.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  // Large payload support for base64 camera frames
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes
  app.post("/api/analyze", (req, res) => {
    return handler(req, res);
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "AI Clear Cam 300x",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Clear Cam 300x server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

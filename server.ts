import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import { DAILY_RO_RECONCILIATION_DATA } from "./src/data/defaultReconciliationData";

const app = express();
const PRIMARY_PORT = 3000;
const CLOUD_RUN_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory reconciliation state
let currentReconciliation = { ...DAILY_RO_RECONCILIATION_DATA };

// In-memory tanks fallback
const defaultTanks = [
  { lid: "LID-01", label: "Hydraulic Fluid Bay A", color: "#00FF66", level: 85 },
  { lid: "LID-02", label: "Coolant Reservoir Bay B", color: "#FFB300", level: 42 },
  { lid: "LID-03", label: "Synthetic Oil Tank C", color: "#FF3333", level: 15 }
];

// Lazy Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    primaryPort: PRIMARY_PORT,
    cloudRunPort: CLOUD_RUN_PORT,
    nodeEnv: process.env.NODE_ENV,
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Fluid Tanks Telemetry
app.get("/api/tanks", (req, res) => {
  try {
    const tanksPath = path.join(process.cwd(), "public", "tanks.json");
    if (fs.existsSync(tanksPath)) {
      const content = fs.readFileSync(tanksPath, "utf-8");
      const parsed = JSON.parse(content);
      return res.json(parsed);
    }
  } catch (err) {
    console.warn("Could not read tanks.json, returning default:", err);
  }
  res.json({ tanks: defaultTanks });
});

app.post("/api/tanks", (req, res) => {
  try {
    const { tanks } = req.body;
    if (Array.isArray(tanks)) {
      const tanksPath = path.join(process.cwd(), "public", "tanks.json");
      fs.writeFileSync(tanksPath, JSON.stringify({ tanks }, null, 2), "utf-8");
      return res.json({ success: true, tanks });
    }
    res.status(400).json({ error: "Invalid tanks payload" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update tanks" });
  }
});

// Reconciliation Data
app.get("/api/reconciliation", (req, res) => {
  res.json(currentReconciliation);
});

app.post("/api/reconciliation", (req, res) => {
  if (req.body && req.body.summary) {
    currentReconciliation = req.body;
    res.json({ success: true, message: "Reconciliation dataset updated" });
  } else {
    res.status(400).json({ error: "Invalid reconciliation payload" });
  }
});

// PDF Text Extraction
app.post("/api/pdf/extract-text", async (req, res) => {
  try {
    const { fileBase64, filename } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: "fileBase64 is required" });
    }

    const base64Data = fileBase64.includes(";base64,")
      ? fileBase64.split(";base64,")[1]
      : fileBase64;

    const buffer = Buffer.from(base64Data, "base64");
    const parser = new PDFParse({ data: buffer });
    const text = await parser.getText();

    res.json({
      success: true,
      filename: filename || "uploaded.pdf",
      text: text || "",
      numPages: 1
    });
  } catch (err: any) {
    console.error("PDF Extraction error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to parse PDF document"
    });
  }
});

// Smart AI Parsing for scanned / unstructured dealer documents
app.post("/api/pdf/smart-parse-report", async (req, res) => {
  try {
    const { fileBase64, filename, documentType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please check your settings."
      });
    }

    const base64Data = fileBase64.includes(";base64,")
      ? fileBase64.split(";base64,")[1]
      : fileBase64;

    const prompt = `You are a Mercedes-Benz Dealership Warranty Audit & Recovery Expert.
Extract all warranty claim lines, repair order numbers, technician names, operation codes, labor dollars, and remittance settlement lines from the provided document.
Output JSON only with keys:
- detectedType: "DMS_C_FILE" | "NETSTAR_REMITTANCE"
- dmsClaims: array of { roNumber, totalClaimed, technician, vin, operationCode, description }
- creditNotes: array of { creditNoteNumber, roNumber, paidNet, date }
- reportSummary: { totalClaimedDollars, totalPaidDollars, varianceTotal, dealershipName, documentDate }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      filename,
      ...parsedJson
    });
  } catch (err: any) {
    console.error("Smart parse error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "AI extraction failed"
    });
  }
});

// ----------------------------------------------------
// FRONTEND SERVING & DEV MIDDLEWARE
// ----------------------------------------------------
async function setupServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV !== "production" && !hasDist) {
    console.log("[ASP SERVER] Initializing Vite middleware in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("[ASP SERVER] Serving static frontend from dist...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to Primary Port 3000 (standard container ingress)
  const server = app.listen(PRIMARY_PORT, "0.0.0.0", () => {
    console.log(`[ASP SERVER] Primary listener running on http://0.0.0.0:${PRIMARY_PORT}`);
  });

  // Dual-port listening: If CLOUD_RUN_PORT is different from PRIMARY_PORT (e.g. 8080 without reverse proxy)
  if (CLOUD_RUN_PORT !== PRIMARY_PORT) {
    const secondaryServer = app.listen(CLOUD_RUN_PORT, "0.0.0.0", () => {
      console.log(`[ASP SERVER] Secondary listener running on http://0.0.0.0:${CLOUD_RUN_PORT}`);
    });

    secondaryServer.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.log(`[ASP SERVER] Port ${CLOUD_RUN_PORT} is in use (e.g., by Nginx reverse proxy). Relying on primary port ${PRIMARY_PORT}.`);
      } else {
        console.error(`[ASP SERVER] Secondary server error on port ${CLOUD_RUN_PORT}:`, err);
      }
    });
  }

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("[ASP SERVER] Gracefully shutting down...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

setupServer().catch((err) => {
  console.error("[ASP SERVER] Fatal startup error:", err);
  process.exit(1);
});

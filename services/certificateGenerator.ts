import sharp from "sharp";
import fs from "fs";
import path from "path";
import type { TemplateConfig } from "@/types";

// Maximum output certificate dimensions (keeps file size manageable while retaining quality)
// A4 landscape at 150 DPI = 1754 x 1240 — good for print and web
const MAX_OUTPUT_WIDTH = 2480;
const MAX_OUTPUT_HEIGHT = 1754;

// The reference canvas size used by the TemplateEditor for coordinate storage
const EDITOR_CANVAS_WIDTH = 1200;
const EDITOR_CANVAS_HEIGHT = 850;

/**
 * Configure fontconfig dynamically to search local public/fonts folder.
 * This is required on Vercel because serverless environments have no system fonts,
 * and librsvg's inline base64 @font-face is not supported or blocked by sandbox policies.
 */
function initFontconfig() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    const fontconfigDir = "/tmp/fontconfig";
    const cacheDir = "/tmp/fontconfig-cache";
    const confPath = path.join(fontconfigDir, "fonts.conf");

    if (!fs.existsSync(fontconfigDir)) {
      fs.mkdirSync(fontconfigDir, { recursive: true });
    }
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const confContent = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${cacheDir}</cachedir>
  <config></config>
</fontconfig>`;

    fs.writeFileSync(confPath, confContent);
    process.env.FONTCONFIG_PATH = fontconfigDir;
    console.log(`[fontconfig] Initialized successfully at ${fontconfigDir} pointing to ${fontsDir}`);
  } catch (err) {
    console.error("[fontconfig] Initialization failed:", err);
  }
}

// Run initialization once at module load
initFontconfig();

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveFontWeight(fontFile: string | undefined, defaultWeight = "400"): string {
  const f = (fontFile || "").toLowerCase();
  if (f.includes("bold") || f.includes("700")) return "bold";
  return defaultWeight === "700" ? "bold" : "normal";
}

function getFontFamilyName(fontFile: string | undefined): string {
  if (!fontFile) return "Poppins";
  const name = fontFile.trim().toLowerCase();
  if (name.includes("poppins")) return "Poppins";
  if (name.includes("inter")) return "Inter";
  if (name.includes("plusjakartasans") || name.includes("plus jakarta sans")) return "Plus Jakarta Sans";
  return "Poppins"; // Fallback to Poppins
}

export async function renderCertificateBuffer(
  templateImageUrl: string,
  studentName: string,
  rollNo: string,
  config: TemplateConfig
): Promise<Buffer> {
  // Step 1: Fetch the background template image as a buffer
  let bgBuffer: Buffer | null = null;

  if (templateImageUrl) {
    if (templateImageUrl.startsWith("http://") || templateImageUrl.startsWith("https://")) {
      try {
        const res = await fetch(templateImageUrl, {
          headers: { Accept: "image/*,*/*" },
          redirect: "follow",
        });
        if (res.ok) {
          // Use streaming chunk collection instead of arrayBuffer() to avoid
          // the SharedArrayBuffer restriction in Next.js API routes.
          const chunks: Uint8Array[] = [];
          const reader = res.body!.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          bgBuffer = Buffer.concat(chunks);
          console.log(`[cert] Template fetched: ${bgBuffer.length} bytes from ${templateImageUrl}`);
        } else {
          console.warn(`[cert] Template fetch failed: HTTP ${res.status} for ${templateImageUrl}`);
        }
      } catch (err) {
        console.warn("[cert] Failed to fetch template image URL:", err);
      }
    } else if (templateImageUrl.startsWith("data:image")) {
      const base64 = templateImageUrl.split(",")[1];
      if (base64) bgBuffer = Buffer.from(base64, "base64");
    } else {
      const cleanPath = templateImageUrl.startsWith("/") ? templateImageUrl.slice(1) : templateImageUrl;
      const localPath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(localPath)) bgBuffer = fs.readFileSync(localPath);
    }
  }

  // Step 2: Get template dimensions and decide on output canvas size
  let templateWidth = EDITOR_CANVAS_WIDTH;
  let templateHeight = EDITOR_CANVAS_HEIGHT;

  if (bgBuffer) {
    try {
      const meta = await sharp(bgBuffer).metadata();
      templateWidth = meta.width || EDITOR_CANVAS_WIDTH;
      templateHeight = meta.height || EDITOR_CANVAS_HEIGHT;
      console.log(`[cert] Template dimensions: ${templateWidth}x${templateHeight} (${meta.format})`);
    } catch (err) {
      console.warn("[cert] Could not read image metadata:", err);
      bgBuffer = null;
    }
  }

  // Step 3: Determine output canvas size — cap at MAX to avoid huge files
  // Preserve the template's aspect ratio while capping at MAX_OUTPUT dimensions
  let canvasWidth = templateWidth;
  let canvasHeight = templateHeight;

  if (canvasWidth > MAX_OUTPUT_WIDTH || canvasHeight > MAX_OUTPUT_HEIGHT) {
    const aspectRatio = templateWidth / templateHeight;
    if (templateWidth / MAX_OUTPUT_WIDTH > templateHeight / MAX_OUTPUT_HEIGHT) {
      canvasWidth = MAX_OUTPUT_WIDTH;
      canvasHeight = Math.round(MAX_OUTPUT_WIDTH / aspectRatio);
    } else {
      canvasHeight = MAX_OUTPUT_HEIGHT;
      canvasWidth = Math.round(MAX_OUTPUT_HEIGHT * aspectRatio);
    }
    console.log(`[cert] Resizing output to: ${canvasWidth}x${canvasHeight} (capped from ${templateWidth}x${templateHeight})`);
  }

  // Step 4: Scale the stored editor coordinates to the output canvas size
  // Editor stores coords against 1200x850; we scale to the output canvas
  const scaleX = canvasWidth / EDITOR_CANVAS_WIDTH;
  const scaleY = canvasHeight / EDITOR_CANVAS_HEIGHT;

  const nameCfg = config.name || { x: 600, y: 410, size: 52, color: "#000000", align: "center", font: "Poppins-Bold.ttf" };
  const rollCfg = config.rollNo || { x: 600, y: 480, size: 28, color: "#444444", align: "center", font: "Poppins-Regular.ttf" };

  const nameX = Math.round(nameCfg.x * scaleX);
  const nameY = Math.round(nameCfg.y * scaleY);
  const nameSize = Math.round(nameCfg.size * Math.min(scaleX, scaleY));
  const nameColor = nameCfg.color || "#000000";
  const nameFontWeight = resolveFontWeight(nameCfg.font, "700");
  const nameAnchor = nameCfg.align === "center" ? "middle" : nameCfg.align === "right" ? "end" : "start";

  const rollX = Math.round(rollCfg.x * scaleX);
  const rollY = Math.round(rollCfg.y * scaleY);
  const rollSize = Math.round(rollCfg.size * Math.min(scaleX, scaleY));
  const rollColor = rollCfg.color || "#444444";
  const rollFontWeight = resolveFontWeight(rollCfg.font, "400");
  const rollAnchor = rollCfg.align === "center" ? "middle" : rollCfg.align === "right" ? "end" : "start";

  const nameFontFamily = getFontFamilyName(nameCfg.font);
  const rollFontFamily = getFontFamilyName(rollCfg.font);

  // Debugging log requested in prompt
  console.log({
    studentName,
    rollNo,
    nameFontFamily,
    nameFontWeight,
    nameSize,
    namePos: { x: nameX, y: nameY },
    rollFontFamily,
    rollFontWeight,
    rollSize,
    rollPos: { x: rollX, y: rollY }
  });

  // Step 5: Create SVG text overlay at the output canvas size
  // Note: We use dy="0.35em" instead of dominant-baseline="middle"
  // because dominant-baseline has poor or inconsistent support in some versions of librsvg.
  const svgOverlayString = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${nameX}"
        y="${nameY}"
        font-family="sans-serif"
        font-size="${nameSize}"
        font-weight="${nameFontWeight}"
        fill="${nameColor}"
        text-anchor="${nameAnchor}"
        dy="0.35em"
      >${escapeXml(studentName)}</text>
      <text
        x="${rollX}"
        y="${rollY}"
        font-family="sans-serif"
        font-size="${rollSize}"
        font-weight="${rollFontWeight}"
        fill="${rollColor}"
        text-anchor="${rollAnchor}"
        dy="0.35em"
      >${escapeXml(rollNo)}</text>
    </svg>`;

  // Detailed SVG debugging requested in prompt
  console.log("========== SVG DEBUG ==========");
  console.log("Student:", studentName);
  console.log("Roll:", rollNo);
  console.log("SVG:");
  console.log(svgOverlayString);
  console.log("===============================");

  const svgOverlay = Buffer.from(svgOverlayString);

  // Render SVG text alone as PNG to isolate rendering issues
  const svgPng = await sharp(svgOverlay)
    .png()
    .toBuffer();

  console.log("[cert] SVG rendered successfully directly to PNG buffer:", svgPng.length, "bytes");
  return svgPng;

}

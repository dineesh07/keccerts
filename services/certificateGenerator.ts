import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { POPPINS_BOLD_BASE64, POPPINS_REGULAR_BASE64 } from "@/lib/embeddedFonts";
import type { TemplateConfig } from "@/types";

// Maximum output certificate dimensions (keeps file size manageable while retaining quality)
// A4 landscape at 150 DPI = 1754 x 1240 — good for print and web
const MAX_OUTPUT_WIDTH = 2480;
const MAX_OUTPUT_HEIGHT = 1754;

// The reference canvas size used by the TemplateEditor for coordinate storage
const EDITOR_CANVAS_WIDTH = 1200;
const EDITOR_CANVAS_HEIGHT = 850;

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

  // Step 5: Build standard SVG containing the text layout
  // We include a white background rect so we can see the text clearly (black text on transparent is invisible in browser image viewer)
  const svgOverlayString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <rect width="100%" height="100%" fill="white"/>
    <text
      x="${nameX}"
      y="${nameY}"
      font-family="Poppins"
      font-size="${nameSize}"
      font-weight="${nameFontWeight}"
      fill="${nameColor}"
      text-anchor="${nameAnchor}"
      dominant-baseline="central"
    >${escapeXml(studentName)}</text>
    <text
      x="${rollX}"
      y="${rollY}"
      font-family="Poppins"
      font-size="${rollSize}"
      font-weight="${rollFontWeight}"
      fill="${rollColor}"
      text-anchor="${rollAnchor}"
      dominant-baseline="central"
    >${escapeXml(rollNo)}</text>
  </svg>`;

  console.log("========== SVG RENDER ==========");
  console.log("Student:", studentName, "Roll:", rollNo);
  console.log("SVG overlay size:", canvasWidth, "x", canvasHeight);
  console.log("================================");

  // Step 6: Render SVG text layer to PNG using `@resvg/resvg-js`
  // We inject custom font buffers from embeddedFonts.ts directly into resvg.
  const resvg = new Resvg(svgOverlayString, {
    font: {
      fontBuffers: [
        Buffer.from(POPPINS_BOLD_BASE64, "base64"),
        Buffer.from(POPPINS_REGULAR_BASE64, "base64"),
      ],
      defaultFontFamily: "Poppins",
      loadSystemFonts: false,
    },
  } as any);

  const pngData = resvg.render();
  const textOverlayBuffer = pngData.asPng();

  return textOverlayBuffer;
}

/**
 * Server-side Certificate Generator Service
 * Uses `sharp` to composite SVG text over a background template image.
 * sharp is Vercel-compatible (official support) unlike @resvg/resvg-js which needs platform-specific binaries.
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import type { TemplateConfig } from "@/types";

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
  if (f.includes("bold") || f.includes("700")) return "700";
  return defaultWeight;
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
        const res = await fetch(templateImageUrl);
        if (res.ok) {
          bgBuffer = Buffer.from(await res.arrayBuffer());
        } else {
          console.warn("Failed to fetch template image, status:", res.status);
        }
      } catch (err) {
        console.warn("Failed to fetch template image URL:", err);
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

  // Step 2: Get actual image dimensions from background
  let canvasWidth = 1200;
  let canvasHeight = 850;

  if (bgBuffer) {
    try {
      const meta = await sharp(bgBuffer).metadata();
      canvasWidth = meta.width || 1200;
      canvasHeight = meta.height || 850;
    } catch (err) {
      console.warn("Could not read image metadata:", err);
    }
  }

  // Step 3: Read config and scale to actual image size
  // Config X/Y coords are stored against a 1200x850 canvas (as set by TemplateEditor)
  const scaleX = canvasWidth / 1200;
  const scaleY = canvasHeight / 850;

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

  // Step 4: Create SVG text overlay (transparent background, just text)
  const svgOverlay = Buffer.from(`
    <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${nameX}"
        y="${nameY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${nameSize}"
        font-weight="${nameFontWeight}"
        fill="${nameColor}"
        text-anchor="${nameAnchor}"
        dominant-baseline="middle"
      >${escapeXml(studentName)}</text>
      <text
        x="${rollX}"
        y="${rollY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${rollSize}"
        font-weight="${rollFontWeight}"
        fill="${rollColor}"
        text-anchor="${rollAnchor}"
        dominant-baseline="middle"
      >${escapeXml(rollNo)}</text>
    </svg>
  `);

  // Step 5: Composite SVG text over background using sharp
  let base: ReturnType<typeof sharp>;

  if (bgBuffer) {
    base = sharp(bgBuffer).png();
  } else {
    // No background: create a white canvas
    base = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png();
  }

  const outputBuffer = await base
    .composite([
      {
        input: svgOverlay,
        top: 0,
        left: 0,
      },
    ])
    .png({ compressionLevel: 6 })
    .toBuffer();

  return outputBuffer;
}

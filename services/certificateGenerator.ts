/**
 * Server-side Certificate Generator Service
 * Renders student Name & Roll Number dynamically on top of a template image
 * using SVG + Resvg, generating a real PNG image buffer.
 */

import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import type { TemplateConfig } from "@/types";

interface ResolvedFont {
  fontCss: string;
  fontFamily: string;
  fontWeight: string;
}

const fontCache = new Map<string, ResolvedFont>();

function resolveFont(fontVal: string | undefined, defaultWeight = "400"): ResolvedFont {
  const rawFont = (fontVal || "").trim();
  const fontLower = rawFont.toLowerCase();

  let familyName = "Poppins";
  let weight = defaultWeight;

  if (fontLower.includes("inter")) {
    familyName = "Inter";
    if (fontLower.includes("bold")) weight = "700";
  } else if (fontLower.includes("plus jakarta") || fontLower.includes("plusjakartasans")) {
    familyName = "Plus Jakarta Sans";
    if (fontLower.includes("bold")) weight = "700";
  } else if (fontLower.includes("roboto")) {
    familyName = "Roboto";
    if (fontLower.includes("bold")) weight = "700";
  } else {
    familyName = "Poppins";
    if (fontLower.includes("bold")) weight = "700";
  }

  return {
    fontCss: "",
    fontFamily: familyName,
    fontWeight: weight,
  };
}

import { getEmbeddedFontBuffers } from "@/lib/embeddedFonts";

function loadAllFontBuffers(): Buffer[] {
  const buffers: Buffer[] = getEmbeddedFontBuffers();
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  if (fs.existsSync(fontsDir)) {
    try {
      const files = fs.readdirSync(fontsDir);
      for (const f of files) {
        if (f.endsWith(".ttf") || f.endsWith(".otf")) {
          try {
            buffers.push(fs.readFileSync(path.join(fontsDir, f)));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return buffers;
}

export async function renderCertificateBuffer(
  templateImageUrl: string,
  studentName: string,
  rollNo: string,
  config: TemplateConfig
): Promise<Buffer> {
  const scale = 2; // 2x Ultra-HD Resolution multiplier
  const width = 1200 * scale;  // 2400px
  const height = 850 * scale;  // 1700px

  const rawNameCfg = config.name || { x: 600, y: 410, size: 52, color: "#000000", align: "center", font: "Poppins-Bold.ttf" };
  const rawRollCfg = config.rollNo || { x: 600, y: 480, size: 28, color: "#444444", align: "center", font: "Poppins-Regular.ttf" };

  const nameCfg = {
    x: rawNameCfg.x * scale,
    y: rawNameCfg.y * scale,
    size: rawNameCfg.size * scale,
    color: rawNameCfg.color || "#000000",
    align: rawNameCfg.align,
    font: rawNameCfg.font,
  };

  const rollCfg = {
    x: rawRollCfg.x * scale,
    y: rawRollCfg.y * scale,
    size: rawRollCfg.size * scale,
    color: rawRollCfg.color || "#444444",
    align: rawRollCfg.align,
    font: rawRollCfg.font,
  };

  const nameAnchor = nameCfg.align === "center" ? "middle" : nameCfg.align === "right" ? "end" : "start";
  const rollAnchor = rollCfg.align === "center" ? "middle" : rollCfg.align === "right" ? "end" : "start";

  // Resolve TTF font family names and weights
  const nameFont = resolveFont(nameCfg.font, "700");
  const rollFont = resolveFont(rollCfg.font, "400");

  let backgroundHref = "";

  if (templateImageUrl) {
    if (templateImageUrl.startsWith("http://") || templateImageUrl.startsWith("https://")) {
      try {
        const res = await fetch(templateImageUrl);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString("base64");
          const contentType = res.headers.get("content-type") || "image/png";
          backgroundHref = `data:${contentType};base64,${base64}`;
        }
      } catch (err) {
        console.warn("Could not fetch background template image from URL:", templateImageUrl, err);
      }
    } else if (templateImageUrl.startsWith("data:image")) {
      backgroundHref = templateImageUrl;
    } else {
      try {
        const cleanPath = templateImageUrl.startsWith("/") ? templateImageUrl.slice(1) : templateImageUrl;
        const localPath = path.join(process.cwd(), "public", cleanPath);
        if (fs.existsSync(localPath)) {
          const buf = fs.readFileSync(localPath);
          const ext = path.extname(localPath).replace(".", "") || "png";
          backgroundHref = `data:image/${ext};base64,${buf.toString("base64")}`;
        }
      } catch (err) {
        console.warn("Could not read local background template image:", templateImageUrl, err);
      }
    }
  }

  // Create clean SVG string with SVG text elements scaled for 2400x1700 Ultra-HD resolution
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${
        backgroundHref
          ? `<image href="${backgroundHref}" width="${width}" height="${height}" preserveAspectRatio="none"/>`
          : `<rect width="${width}" height="${height}" fill="#ffffff" stroke="#cbd5e1" stroke-width="8"/>`
      }
      <text x="${nameCfg.x}" y="${nameCfg.y}" font-family="${nameFont.fontFamily}" font-size="${nameCfg.size}" font-weight="${nameFont.fontWeight}" fill="${nameCfg.color}" text-anchor="${nameAnchor}" dominant-baseline="middle">${escapeXml(studentName)}</text>
      <text x="${rollCfg.x}" y="${rollCfg.y}" font-family="${rollFont.fontFamily}" font-size="${rollCfg.size}" font-weight="${rollFont.fontWeight}" fill="${rollCfg.color}" text-anchor="${rollAnchor}" dominant-baseline="middle">${escapeXml(rollNo)}</text>
    </svg>
  `;

  const fontBuffers = loadAllFontBuffers();

  const resvg = new Resvg(svg, {
    font: {
      fontBuffers,
      defaultFontFamily: "Poppins",
      loadSystemFonts: false,
    } as any,
    fitTo: {
      mode: "width",
      value: width,
    },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

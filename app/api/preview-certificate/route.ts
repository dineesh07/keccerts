import { NextResponse } from "next/server";
import sharp from "sharp";
import { renderCertificateBuffer } from "@/services/certificateGenerator";
import { getTemplateByEventId } from "@/services/templateService";

// Debug endpoint: renders a certificate and returns it directly as PNG
// Usage: GET /api/preview-certificate?eventId=<id>&name=Joel&roll=CS001&mode=full|svg|direct
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "";
    const name = searchParams.get("name") || "Test Student";
    const roll = searchParams.get("roll") || "TEST001";
    const mode = searchParams.get("mode") || "full"; // full, svg, direct

    // MODE: svg — just render SVG text on white, no template
    if (mode === "svg") {
      const svgBuf = Buffer.from(`<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="400" fill="white"/>
        <text x="600" y="150" font-family="Arial,sans-serif" font-size="60" font-weight="700" fill="black" text-anchor="middle" dominant-baseline="middle">SVG TEXT TEST</text>
        <text x="600" y="250" font-family="Arial,sans-serif" font-size="40" font-weight="400" fill="#333333" text-anchor="middle" dominant-baseline="middle">${name} | ${roll}</text>
        <text x="600" y="350" font-family="Arial,sans-serif" font-size="24" fill="green" text-anchor="middle">sharp SVG render test in Next.js</text>
      </svg>`);
      const out = await sharp(svgBuf).png().toBuffer();
      return new NextResponse(out, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // MODE: direct — composite SVG on white canvas (no template)
    if (mode === "direct") {
      const svgBuf = Buffer.from(`<svg width="1200" height="850" xmlns="http://www.w3.org/2000/svg">
        <text x="600" y="425" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#000000" text-anchor="middle" dominant-baseline="middle">${name}</text>
        <text x="600" y="510" font-family="Arial,sans-serif" font-size="28" font-weight="400" fill="#444444" text-anchor="middle" dominant-baseline="middle">${roll}</text>
      </svg>`);
      const out = await sharp({
        create: { width: 1200, height: 850, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      })
        .composite([{ input: svgBuf, top: 0, left: 0 }])
        .png()
        .toBuffer();
      return new NextResponse(out, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // MODE: full — full pipeline with real template
    const template = await getTemplateByEventId(eventId);
    const config = template?.config || {
      name: { x: 600, y: 410, font: "Poppins-Bold.ttf", size: 52, color: "#000000", align: "center" },
      rollNo: { x: 600, y: 480, font: "Poppins-Regular.ttf", size: 28, color: "#444444", align: "center" },
    };
    const templateUrl = template?.templateUrl || "";

    console.log(`[preview] eventId=${eventId}, name=${name}, roll=${roll}`);
    console.log(`[preview] templateUrl=${templateUrl}`);

    const buffer = await renderCertificateBuffer(templateUrl, name, roll, config);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[preview] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

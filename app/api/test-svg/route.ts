import { NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

export async function GET() {
  const poppinsBold = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Poppins-Bold.ttf"));
  
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500">
    <rect width="100%" height="100%" fill="white"/>
    <text
      x="500"
      y="250"
      font-size="80"
      text-anchor="middle"
      fill="black"
      font-family="Poppins"
    >
      Hello World Poppins
    </text>
  </svg>`;

  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: [new Uint8Array(poppinsBold)],
      defaultFontFamily: "Poppins",
      loadSystemFonts: false,
    }
  } as any);

  const png = resvg.render().asPng();

  return new NextResponse(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    }
  });
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const processCwd = process.cwd();
  const publicFontsDir = path.join(processCwd, "public", "fonts");
  
  const filesInCwd = fs.existsSync(processCwd) ? fs.readdirSync(processCwd) : [];
  const filesInFonts = fs.existsSync(publicFontsDir) ? fs.readdirSync(publicFontsDir) : [];
  
  const fontPathsToCheck = [
    path.join(processCwd, "public", "fonts", "Poppins-Bold.ttf"),
    path.join(processCwd, "public", "fonts", "Poppins-Regular.ttf"),
    path.join(processCwd, ".next", "server", "public", "fonts", "Poppins-Bold.ttf"),
  ];
  
  const pathResults = fontPathsToCheck.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    size: fs.existsSync(p) ? fs.statSync(p).size : 0
  }));

  return NextResponse.json({
    processCwd,
    filesInCwd,
    filesInFonts,
    pathResults,
  });
}

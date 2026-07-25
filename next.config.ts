import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp and resvg must be treated as external packages so Vercel uses their pre-built Linux binaries
  serverExternalPackages: ["sharp", "@resvg/resvg-js"],

  // Ensure native .node binaries and assets are included in Vercel's output file tracing.
  outputFileTracingIncludes: {
    "/api/generate-certificates": ["./node_modules/sharp/**/*", "./node_modules/@resvg/resvg-js/**/*", "./public/fonts/**/*"],
    "/api/preview-certificate": ["./node_modules/sharp/**/*", "./node_modules/@resvg/resvg-js/**/*", "./public/fonts/**/*"],
  },
};

export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp must be treated as an external package so Vercel uses its pre-built Linux binary
  serverExternalPackages: ["sharp"],

  // Ensure sharp's native .node binaries are included in Vercel's output file tracing.
  // Without this, sharp fails silently on Vercel even though it works on Windows locally.
  outputFileTracingIncludes: {
    "/api/generate-certificates": ["./node_modules/sharp/**/*"],
    "/api/preview-certificate": ["./node_modules/sharp/**/*"],
  },
};

export default nextConfig;


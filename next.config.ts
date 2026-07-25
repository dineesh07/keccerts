import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp must be treated as an external package so Vercel uses its pre-built Linux binary
  serverExternalPackages: ["sharp"],

  // Ensure sharp's native .node binaries and custom fonts are included in Vercel's output file tracing.
  // Without this, sharp fails silently on Vercel and local fonts are missing during serverless execution.
  outputFileTracingIncludes: {
    "/api/generate-certificates": ["./node_modules/sharp/**/*", "./public/fonts/**/*"],
    "/api/preview-certificate": ["./node_modules/sharp/**/*", "./public/fonts/**/*"],
  },
};

export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo prototype — no special server config needed. AI calls are BYOK and
  // proxied per-request through the nodejs route handler at /api/generate.
  // Pin the workspace root to this dir so file tracing ignores the parent repo's
  // lockfile (this project deploys standalone on Vercel).
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

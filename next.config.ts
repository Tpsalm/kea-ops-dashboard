import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output creates a self-contained server bundle,
  // ideal for one-click deployment on Vercel, Netlify, Railway, etc.
  output: "standalone",
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

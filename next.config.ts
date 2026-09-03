import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel runs Next in its own optimized runtime — no standalone bundle
  // needed (standalone output caused failures in the Vercel build pipeline).
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

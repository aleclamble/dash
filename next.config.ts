import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during production builds on Vercel. Local dev still shows lint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

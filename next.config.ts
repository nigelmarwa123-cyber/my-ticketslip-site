import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['192.168.18.4'],
  },
};

export default nextConfig;

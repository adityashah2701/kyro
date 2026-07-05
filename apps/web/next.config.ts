import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyro/database", "@kyro/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;

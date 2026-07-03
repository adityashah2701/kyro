import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyro/database", "@kyro/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyro/database", "@kyro/shared"],
};

export default nextConfig;

import type { FrameworkDefinition } from "../types";

export const nextjs: FrameworkDefinition = {
  id: "nextjs",
  name: "Next.js",
  detectFiles: ["next.config.js", "next.config.mjs", "next.config.ts"],
  defaultInstallCommand: "npm install",
  defaultBuildCommand: "npm run build",
  defaultStartCommand: "npm start",
  defaultOutputDirectory: ".next",
  defaultPackageManager: "npm",
  runtime: "node",
};

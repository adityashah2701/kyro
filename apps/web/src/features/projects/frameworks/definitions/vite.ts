import type { FrameworkDefinition } from "../types";

export const vite: FrameworkDefinition = {
  id: "vite",
  name: "Vite (React/Vue/Svelte)",
  detectFiles: ["vite.config.js", "vite.config.ts", "vite.config.mjs"],
  defaultInstallCommand: "npm install",
  defaultBuildCommand: "vite build",
  defaultStartCommand: "npm run preview",
  defaultOutputDirectory: "dist",
  defaultPackageManager: "npm",
  runtime: "static",
};

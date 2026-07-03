import type { FrameworkDefinition } from "../types";

export const vite: FrameworkDefinition = {
  id: "vite",
  name: "Vite (React/Vue/Svelte)",
  detectFiles: ["vite.config.js", "vite.config.ts", "vite.config.mjs"],
  defaultInstallCommand: "npm install",
  defaultBuildCommand: "vite build",
  // Vite emits a static bundle — it's served directly from storage, not run.
  // (`vite preview` is a dev-only server and must not be used as a prod start command.)
  defaultStartCommand: "",
  defaultOutputDirectory: "dist",
  defaultPackageManager: "npm",
  runtime: "static",
};

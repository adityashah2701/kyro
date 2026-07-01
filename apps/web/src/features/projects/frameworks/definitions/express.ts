import type { FrameworkDefinition } from "../types";

export const express: FrameworkDefinition = {
  id: "express",
  name: "Express.js",
  detectFiles: ["package.json", "server.js", "app.js"],
  defaultInstallCommand: "npm install",
  defaultBuildCommand: "npm run build",
  defaultStartCommand: "npm start",
  defaultOutputDirectory: "dist",
  defaultPackageManager: "npm",
  runtime: "node",
};

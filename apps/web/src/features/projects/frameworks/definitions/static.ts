import type { FrameworkDefinition } from "../types";

export const staticHtml: FrameworkDefinition = {
  id: "static",
  name: "Static HTML",
  detectFiles: ["index.html"],
  defaultInstallCommand: "",
  defaultBuildCommand: "",
  defaultStartCommand: "",
  defaultOutputDirectory: ".",
  defaultPackageManager: "none",
  runtime: "static",
};

import type { FrameworkDefinition } from "../types";

export const docker: FrameworkDefinition = {
  id: "docker",
  name: "Dockerfile",
  detectFiles: ["Dockerfile", "docker-compose.yml"],
  defaultInstallCommand: "",
  defaultBuildCommand: "docker build -t app .",
  defaultStartCommand: "docker run -p 3000:3000 app",
  defaultOutputDirectory: "",
  defaultPackageManager: "none",
  runtime: "docker",
};

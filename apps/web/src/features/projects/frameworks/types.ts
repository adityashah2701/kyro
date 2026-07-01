import { type ReactNode } from "react";

export type RuntimeType =
  "node" | "static" | "docker" | "python" | "go" | "rust" | "php" | "other";
export type PackageManager = "npm" | "yarn" | "pnpm" | "bun" | "none";

export interface FrameworkDefinition {
  id: string;
  name: string;
  icon?: string | ReactNode;

  // Detection logic
  detectFiles: string[];

  // Default configurations
  defaultInstallCommand: string;
  defaultBuildCommand: string;
  defaultStartCommand: string;
  defaultOutputDirectory: string;
  defaultPackageManager: PackageManager;
  runtime: RuntimeType;
}

import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";

export interface DetectionResult {
  framework: string;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  nodeVersion: string; // e.g. "18", "20", "22"
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
}

export class DetectorService {
  /**
   * Detects project configuration (framework, package manager, node version).
   */
  public static async detect(workspacePath: string): Promise<DetectionResult> {
    const packageJsonPath = path.join(workspacePath, "package.json");
    let packageJson: any = {};

    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      packageJson = JSON.parse(content);
    } catch (e) {
      logger.warn(
        { workspacePath },
        "No package.json found or failed to parse, treating as static site",
      );
    }

    const packageManager = await this.detectPackageManager(workspacePath);
    const nodeVersion = await this.detectNodeVersion(
      workspacePath,
      packageJson,
    );
    const { framework, outputDirectory } = await this.detectFramework(
      workspacePath,
      packageJson,
    );

    return {
      framework,
      packageManager,
      nodeVersion,
      installCommand: this.getInstallCommand(packageManager, packageJson),
      buildCommand: this.getBuildCommand(packageManager, packageJson),
      outputDirectory,
    };
  }

  private static async detectPackageManager(
    workspacePath: string,
  ): Promise<"npm" | "yarn" | "pnpm" | "bun"> {
    const checkExists = async (filename: string) => {
      try {
        await fs.access(path.join(workspacePath, filename));
        return true;
      } catch {
        return false;
      }
    };

    if (await checkExists("yarn.lock")) return "yarn";
    if (await checkExists("pnpm-lock.yaml")) return "pnpm";
    if (await checkExists("bun.lockb")) return "bun";
    if (await checkExists("package-lock.json")) return "npm";

    // Default to npm if no lockfile found
    return "npm";
  }

  private static async detectNodeVersion(
    workspacePath: string,
    packageJson: any,
  ): Promise<string> {
    // 1. Check .nvmrc
    try {
      const nvmrc = await fs.readFile(
        path.join(workspacePath, ".nvmrc"),
        "utf-8",
      );
      const version = nvmrc.trim();
      if (version.startsWith("18")) return "18";
      if (version.startsWith("20")) return "20";
      if (version.startsWith("22")) return "22";
      if (version.startsWith("v")) {
        const major = version.slice(1).split(".")[0];
        if (["18", "20", "22"].includes(major)) return major;
      }
    } catch (e) {
      // Ignored
    }

    // 2. Check package.json engines
    if (packageJson.engines && packageJson.engines.node) {
      const engine = packageJson.engines.node as string;
      if (engine.includes("18")) return "18";
      if (engine.includes("20")) return "20";
      if (engine.includes("22")) return "22";
    }

    // Default to 20
    return "20";
  }

  private static async detectFramework(
    workspacePath: string,
    packageJson: any,
  ): Promise<{ framework: string; outputDirectory: string }> {
    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    const checkExists = async (filename: string) => {
      try {
        await fs.access(path.join(workspacePath, filename));
        return true;
      } catch {
        return false;
      }
    };

    if (deps["next"]) {
      return { framework: "Next.js", outputDirectory: ".next" };
    }
    if (deps["nuxt"]) {
      return { framework: "Nuxt", outputDirectory: ".output" };
    }
    if (deps["@sveltejs/kit"]) {
      return { framework: "SvelteKit", outputDirectory: "build" };
    }
    if (deps["astro"]) {
      return { framework: "Astro", outputDirectory: "dist" };
    }
    if (deps["@remix-run/react"]) {
      return { framework: "Remix", outputDirectory: "build" };
    }
    if (deps["vue"]) {
      return { framework: "Vue", outputDirectory: "dist" };
    }
    if (deps["react-scripts"]) {
      return { framework: "React (CRA)", outputDirectory: "build" };
    }
    if (deps["vite"]) {
      if (deps["react"])
        return { framework: "React (Vite)", outputDirectory: "dist" };
      return { framework: "Vite", outputDirectory: "dist" };
    }
    if (deps["@angular/core"]) {
      return { framework: "Angular", outputDirectory: "dist" };
    }

    // Fallback static HTML check
    if (await checkExists("index.html")) {
      return { framework: "Static HTML", outputDirectory: "." };
    }

    return { framework: "Other", outputDirectory: "dist" };
  }

  private static getInstallCommand(
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
    packageJson: any,
  ): string {
    if (Object.keys(packageJson).length === 0) {
      return "echo 'Skipping install, no package.json found'";
    }
    switch (packageManager) {
      case "npm":
        return "npm install --no-fund --no-audit --loglevel=error";
      case "yarn":
        return "yarn install";
      case "pnpm":
        return "pnpm install"; // Assume pnpm is available via corepack or base image
      case "bun":
        return "bun install";
    }
  }

  private static getBuildCommand(
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
    packageJson: any,
  ): string {
    if (!packageJson.scripts || !packageJson.scripts.build) {
      return "echo 'No build script found'";
    }

    switch (packageManager) {
      case "npm":
        return "npm run build";
      case "yarn":
        return "yarn build";
      case "pnpm":
        return "pnpm run build";
      case "bun":
        return "bun run build";
    }
  }
}

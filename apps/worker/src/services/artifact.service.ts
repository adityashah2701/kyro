import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { logger } from "../logger";
import { DetectionResult } from "./detector.service";
import { MinioStorageProvider } from "@kyro/storage";
import crypto from "crypto";

/** Canonical object key (relative to the artifact prefix) for a server bundle. */
export const SERVER_BUNDLE_NAME = "__server_bundle.tgz";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Runs a command, resolving on exit 0 and rejecting otherwise. */
function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited with ${code}: ${stderr.trim()}`)),
    );
  });
}

const storage = new MinioStorageProvider(
  {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "kyro_admin",
    secretKey: process.env.MINIO_SECRET_KEY || "kyro_password",
  },
  process.env.MINIO_BUCKET || "kyro-deployments",
);

// Initialize bucket
storage.initialize().catch((err) => {
  logger.error({ err }, "Failed to initialize storage provider");
});

export class ArtifactService {
  /**
   * Calculates the size of a directory recursively in bytes.
   */
  private static async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
    } catch (e) {
      logger.warn({ dirPath, err: e }, "Failed to calculate directory size");
    }
    return size;
  }

  /**
   * Collects build artifacts and metadata.
   */
  public static async collect(
    workspacePath: string,
    detection: DetectionResult,
  ): Promise<{
    buildSize: number;
    hash: string;
    checksum: string;
    artifactLocation: string;
    storageProvider: string;
    serveMode: "static" | "server";
    metadata: any;
  }> {
    let buildFolderPath = path.join(workspacePath, detection.outputDirectory);
    if (
      detection.framework === "Next.js" &&
      detection.outputDirectory === ".next"
    ) {
      buildFolderPath = workspacePath;
    }

    // Calculate the size of the build folder
    const buildSize = await this.getDirectorySize(buildFolderPath);

    // Ensure the output directory exists
    try {
      const stats = await fs.stat(buildFolderPath);
      if (!stats.isDirectory()) {
        throw new Error();
      }
    } catch {
      logger.error(
        { buildFolderPath },
        "Output directory does not exist or is not a directory",
      );
      throw new Error(
        `Output directory '${detection.outputDirectory}' was not produced by the build.`,
      );
    }

    // 4. Generate unique preview URL hash and checksum
    const hash = crypto.randomBytes(4).toString("hex");
    const checksum = crypto.randomBytes(16).toString("hex"); // In a real app, hash the actual folder contents

    const prefix = `deployments/${workspacePath.split("/").pop()}`;

    // 5. Decide serve mode from the actual build output — framework-agnostic.
    // A build that emits a root index.html is a static site: upload its files
    // individually so the proxy can stream them directly (fast, no runtime).
    // Anything else is a server app (Next.js SSR, Nuxt, Remix, Express, ...):
    // pack the whole workspace (source + node_modules + build output) into a
    // single gzipped tarball so it can be pulled and run in one shot at serve
    // time, instead of downloading tens of thousands of individual objects.
    const isStatic = await fileExists(path.join(buildFolderPath, "index.html"));

    if (isStatic) {
      logger.info(
        { buildFolderPath, prefix },
        "Uploading static artifacts to storage",
      );
      await storage.uploadDirectory(buildFolderPath, prefix);
    } else {
      logger.info(
        { workspacePath, prefix },
        "Packaging server bundle for storage",
      );
      const bundlePath = path.join(
        os.tmpdir(),
        `kyro-bundle-${crypto.randomBytes(6).toString("hex")}.tgz`,
      );
      // Exclude VCS metadata; keep everything else (node_modules, build output).
      await run("tar", [
        "-czf",
        bundlePath,
        "-C",
        workspacePath,
        "--exclude=./.git",
        ".",
      ]);
      await storage.uploadFile(
        bundlePath,
        path.posix.join(prefix, SERVER_BUNDLE_NAME),
      );
      await fs.rm(bundlePath, { force: true }).catch(() => {});
    }

    const serveMode = isStatic ? "static" : "server";

    return {
      buildSize,
      hash,
      checksum,
      artifactLocation: prefix,
      storageProvider: "minio",
      serveMode,
      metadata: {
        framework: detection.framework,
        nodeVersion: detection.nodeVersion,
        packageManager: detection.packageManager,
        outputDirectory: detection.outputDirectory,
        serveMode,
        logFile: "build.log", // Stored in workspace for now
      },
    };
  }
}

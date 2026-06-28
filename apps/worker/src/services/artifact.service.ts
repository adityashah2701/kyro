import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";
import { DetectionResult } from "./detector.service";
import { MinioStorageProvider } from "@kyro/storage";
import crypto from "crypto";

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
    metadata: any;
  }> {
    const buildFolderPath = path.join(workspacePath, detection.outputDirectory);

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

    // 5. Upload to MinIO
    logger.info({ buildFolderPath, prefix }, "Uploading artifacts to storage");
    await storage.uploadDirectory(buildFolderPath, prefix);

    return {
      buildSize,
      hash,
      checksum,
      artifactLocation: prefix,
      storageProvider: "minio",
      metadata: {
        framework: detection.framework,
        nodeVersion: detection.nodeVersion,
        packageManager: detection.packageManager,
        outputDirectory: detection.outputDirectory,
        logFile: "build.log", // Stored in workspace for now
      },
    };
  }
}

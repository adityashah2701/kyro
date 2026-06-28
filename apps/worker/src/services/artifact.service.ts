import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";
import { DetectionResult } from "./detector.service";

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
  ): Promise<{ buildSize: number; metadata: any }> {
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

    // In a future feature, we might compress and upload `buildFolderPath` to MinIO or S3.
    // For now, it stays in the workspace until cleanup.

    return {
      buildSize,
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

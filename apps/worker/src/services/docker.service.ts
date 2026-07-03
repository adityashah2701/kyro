import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../logger";
import { DetectionResult } from "./detector.service";
import fs from "fs/promises";
import path from "path";
import { redisClient } from "../redis";

const execFileAsync = promisify(execFile);

export class DockerService {
  /**
   * Checks available disk space on the filesystem containing `dir`.
   * Logs a warning if free space is below MIN_DISK_MB (default 2048 MB).
   *
   * WHY: On a ~20 GB EBS volume, builds can fail mid-way with an opaque ENOSPC
   * error deep inside the Docker build container. A pre-flight check surfaces
   * the problem as an actionable warning *before* the container starts, giving
   * the operator time to run `docker-cleanup.sh` or `docker system prune -af`
   * instead of chasing a mysterious exit code.
   *
   * This is a warning-only check (never throws) so a build can still be
   * attempted when disk is tight — the admin decides the trade-off.
   */
  private static async checkDiskSpace(dir: string): Promise<void> {
    const minDiskMb = parseInt(process.env.MIN_DISK_MB || "2048", 10);
    try {
      // `df -k <path>` outputs available KiB in column 4 of the second line.
      const { stdout } = await execFileAsync("df", ["-k", dir]);
      const lines = stdout.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].trim().split(/\s+/);
        const availableKb = parseInt(parts[3], 10);
        const availableMb = Math.floor(availableKb / 1024);
        if (availableMb < minDiskMb) {
          logger.warn(
            { availableMb, minDiskMb, dir },
            `⚠️  Low disk space before build: ${availableMb} MB available, ` +
              `${minDiskMb} MB recommended. ` +
              `Run 'bash scripts/free-tier/docker-cleanup.sh' to reclaim space.`,
          );
        } else {
          logger.info(
            { availableMb, dir },
            `Disk pre-check: ${availableMb} MB available`,
          );
        }
      }
    } catch (err) {
      // Non-fatal — df may not be available in all environments.
      logger.debug({ err }, "Disk space pre-check skipped (df unavailable)");
    }
  }

  /**
   * Executes the build inside an isolated Docker container.
   */
  public static async executeBuild(
    deploymentId: string,
    workspacePath: string,
    detection: DetectionResult,
    logFilePath: string,
  ): Promise<void> {
    const maxMemory = process.env.MAX_MEMORY || "1g";
    const maxCpu = process.env.MAX_CPU || "1.0";
    // Hard RAM+swap ceiling for the build container. On a 1 GB host set this
    // above MAX_MEMORY (e.g. MAX_MEMORY=768m, MAX_MEMORY_SWAP=3g) so a heavy
    // `next build` can spill into the host swap file instead of being OOM-killed.
    const maxMemorySwap = process.env.MAX_MEMORY_SWAP;
    // Caps the JS heap of install/build tools so Node doesn't try to grow past
    // what the tiny instance has. Recommended "--max-old-space-size=512" on free tier.
    const buildNodeOptions = process.env.BUILD_NODE_OPTIONS;

    // Pre-flight: warn if available disk is below the recommended threshold.
    // On a ~20 GB EBS volume this surfaces ENOSPC before it kills a build.
    await DockerService.checkDiskSpace(workspacePath);

    // Choose base image based on detected node version
    const baseImage = `node:${detection.nodeVersion}-alpine`;

    logger.info(
      { deploymentId, baseImage, maxMemory, maxCpu },
      "Preparing to spawn Docker container for build",
    );

    // Create a shell script to run the commands sequentially
    const buildScriptPath = path.join(workspacePath, ".kyro-build.sh");

    // Some package managers like pnpm/bun might not be on the node alpine image by default.
    // Corepack can enable yarn/pnpm if needed.
    //
    // NOTE: We work directly in /workspace (the mounted volume) instead of copying files
    // to /app. The previous copy approach (cp -a /workspace/. /app/) was failing on macOS
    // Docker Desktop, leaving /app empty and causing ENOENT errors when npm tried to read
    // package.json. The volume mount itself is reliable; the cp was the problem.
    const scriptContent = `#!/bin/sh
set -e

timestamp() {
  date +"%H:%M:%S"
}

echo "\\n[$(timestamp)] 🚀 Setup Environment..."
cd /workspace

# Sanity check: ensure workspace files are accessible
if [ ! -f "/workspace/package.json" ]; then
  echo "⚠️  No package.json found in /workspace. Listing workspace contents:"
  ls -la /workspace || true
fi

corepack enable || true

if [ "${detection.packageManager}" = "bun" ]; then
  npm install -g bun
fi

echo "\\n[$(timestamp)] 📦 Installing Dependencies..."
${detection.installCommand}

echo "\\n[$(timestamp)] 🔨 Building Application..."
${detection.buildCommand}

echo "\\n[$(timestamp)] ✨ Build Finished successfully!\\n"
`;

    await fs.writeFile(buildScriptPath, scriptContent, { mode: 0o755 });

    const dockerArgs = [
      "run",
      "--rm",
      `--memory=${maxMemory}`,
      ...(maxMemorySwap ? [`--memory-swap=${maxMemorySwap}`] : []),
      `--cpus=${maxCpu}`,
      ...(buildNodeOptions ? ["-e", `NODE_OPTIONS=${buildNodeOptions}`] : []),
      "--network=bridge",
      "-v",
      `${workspacePath}:/workspace`,
      "-w",
      "/workspace",
      baseImage,
      "sh",
      "./.kyro-build.sh",
    ];

    return new Promise((resolve, reject) => {
      const dockerProcess = spawn("docker", dockerArgs);

      let buildOutput = "";

      dockerProcess.stdout.on("data", (data) => {
        const str = data.toString();
        buildOutput += str;
        logger.info({ deploymentId }, `[BUILD] ${str.trim()}`);
        redisClient.publish(`deployments:${deploymentId}:logs`, str);
      });

      dockerProcess.stderr.on("data", (data) => {
        const str = data.toString();
        buildOutput += str;
        logger.info({ deploymentId }, `[BUILD] ${str.trim()}`);
        redisClient.publish(`deployments:${deploymentId}:logs`, str);
      });

      dockerProcess.on("close", async (code) => {
        // Save logs to a file in the workspace
        await fs.appendFile(logFilePath, buildOutput);

        if (code === 0) {
          logger.info({ deploymentId }, "Docker container exited successfully");
          resolve();
        } else {
          logger.error(
            { deploymentId, code },
            "Docker container exited with error",
          );
          reject(new Error(`Docker build failed with code ${code}`));
        }
      });
    });
  }
}

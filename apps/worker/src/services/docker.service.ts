import { spawn } from "child_process";
import { logger } from "../logger";
import { DetectionResult } from "./detector.service";
import fs from "fs/promises";
import path from "path";
import { redisClient } from "../redis";

export class DockerService {
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

    return new Promise((resolve, reject) => {
      const dockerProcess = spawn("docker", [
        "run",
        "--rm",
        `--memory=${maxMemory}`,
        `--cpus=${maxCpu}`,
        "--network=bridge",
        "-v",
        `${workspacePath}:/workspace`,
        "-w",
        "/workspace",
        baseImage,
        "sh",
        "./.kyro-build.sh",
      ]);

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

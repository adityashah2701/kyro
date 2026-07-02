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
    const scriptContent = `#!/bin/sh
set -e

timestamp() {
  date +"%H:%M:%S"
}

echo "\\n[$(timestamp)] 🚀 Setup Environment..."
# Copy files to an internal directory to avoid Docker Desktop macOS volume mount issues during npm install
mkdir -p /app
cp -a /workspace/. /app/
cd /app

corepack enable || true

if [ "${detection.packageManager}" = "bun" ]; then
  npm install -g bun
fi

echo "\\n[$(timestamp)] 📦 Installing Dependencies..."
${detection.installCommand}

echo "\\n[$(timestamp)] 🔨 Building Application..."
${detection.buildCommand}

echo "\\n[$(timestamp)] 📂 Extracting Output..."
# Copy the built output back to the mounted workspace
if [ "${detection.outputDirectory}" = "." ] || [ "${detection.outputDirectory}" = "" ]; then
  cp -a /app/. /workspace/
else
  if [ -e "/app/${detection.outputDirectory}" ]; then
    cp -a /app/${detection.outputDirectory} /workspace/
  else
    echo "⚠️  Warning: Output directory '${detection.outputDirectory}' not found. Proceeding with existing files."
  fi
  # Always copy node_modules back so the runtime has the installed dependencies
  if [ -d "/app/node_modules" ]; then
    cp -a /app/node_modules /workspace/
  fi
fi
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

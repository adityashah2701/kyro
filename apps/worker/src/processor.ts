import { Job } from "bullmq";
import { logger } from "./logger";
import { db, schema, eq } from "@kyro/database";
import type { QueueJobData, DeploymentStatus } from "@kyro/shared";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const updateStatus = async (
  deploymentId: string,
  status: DeploymentStatus,
  extra?: any,
) => {
  logger.info({ deploymentId, status }, "Updating deployment status");
  await db
    .update(schema.deployment)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(eq(schema.deployment.id, deploymentId));
};

const runDockerContainer = (
  deploymentId: string,
  workspacePath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // For Feature 06, we just spawn a mock container to prove the worker foundation works.
    // Memory and CPU limits would be passed here via env vars.
    const maxMemory = process.env.MAX_MEMORY || "512m";
    const maxCpu = process.env.MAX_CPU || "1.0";

    logger.info({ deploymentId, workspacePath }, "Spawning Docker container");

    const dockerProcess = spawn("docker", [
      "run",
      "--rm",
      `--memory=${maxMemory}`,
      `--cpus=${maxCpu}`,
      "-v",
      `${workspacePath}:/workspace`,
      "alpine",
      "sh",
      "-c",
      "echo 'Initializing Workspace...' && sleep 1 && echo 'Cloning Repository...' && sleep 1 && echo 'Building Application...' && sleep 1 && echo 'Build Finished!'",
    ]);

    dockerProcess.stdout.on("data", (data) => {
      logger.info({ deploymentId }, `[DOCKER] ${data.toString().trim()}`);
    });

    dockerProcess.stderr.on("data", (data) => {
      logger.error({ deploymentId }, `[DOCKER ERR] ${data.toString().trim()}`);
    });

    dockerProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Docker container exited with code ${code}`));
      }
    });
  });
};

export const processDeploymentJob = async (job: Job<QueueJobData>) => {
  const { deploymentId } = job.data;
  const startTime = Date.now();

  const workspacePath = path.join(
    process.env.TEMP_DIRECTORY || "/tmp/deployments",
    deploymentId,
  );

  try {
    // 1. Initializing
    await updateStatus(deploymentId, "initializing", { startedAt: new Date() });

    // Create workspace
    await fs.mkdir(workspacePath, { recursive: true });
    logger.info(
      { deploymentId, workspacePath },
      "Created deployment workspace",
    );

    // 2. Mocking the lifecycle visually for the DB (as actual clone/build is excluded in Feature 06)
    // We update statuses artificially here, while the docker container echoes them.
    await updateStatus(deploymentId, "cloning");
    await new Promise((res) => setTimeout(res, 1000));

    await updateStatus(deploymentId, "installing");
    await new Promise((res) => setTimeout(res, 1000));

    await updateStatus(deploymentId, "building");

    // Spawn container for "Build" phase
    await runDockerContainer(deploymentId, workspacePath);

    await updateStatus(deploymentId, "uploading");
    await new Promise((res) => setTimeout(res, 1000));

    await updateStatus(deploymentId, "deploying");
    await new Promise((res) => setTimeout(res, 1000));

    // 3. Success
    const buildDuration = Date.now() - startTime;
    await updateStatus(deploymentId, "success", {
      completedAt: new Date(),
      buildDuration,
    });

    logger.info(
      { deploymentId, duration: buildDuration },
      "Deployment completed successfully",
    );
  } catch (error: any) {
    logger.error({ deploymentId, err: error }, "Deployment failed");
    await updateStatus(deploymentId, "failed", { completedAt: new Date() });
    throw error; // Let BullMQ handle retries/failures
  } finally {
    // 4. Cleanup
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
      logger.info(
        { deploymentId, workspacePath },
        "Cleaned up deployment workspace",
      );
    } catch (cleanupError) {
      logger.error(
        { deploymentId, err: cleanupError },
        "Failed to clean up workspace",
      );
    }
  }
};

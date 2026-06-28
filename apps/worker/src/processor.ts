import { Job } from "bullmq";
import { logger } from "./logger";
import { db, schema, eq } from "@kyro/database";
import type { QueueJobData, DeploymentStatus } from "@kyro/shared";
import fs from "fs/promises";
import path from "path";

// Services
import { GitService } from "./services/git.service";
import { DetectorService } from "./services/detector.service";
import { DockerService } from "./services/docker.service";
import { ArtifactService } from "./services/artifact.service";

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

    // Fetch Deployment Data
    const deploymentRecord = await db.query.deployment.findFirst({
      where: eq(schema.deployment.id, deploymentId),
    });

    if (!deploymentRecord) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const repoRecord = await db.query.projectRepository.findFirst({
      where: eq(schema.projectRepository.projectId, deploymentRecord.projectId),
    });

    if (!repoRecord) {
      throw new Error(
        `Repository not found for project ${deploymentRecord.projectId}`,
      );
    }

    const githubAcc = await db.query.githubAccount.findFirst({
      where: eq(schema.githubAccount.userId, deploymentRecord.userId),
    });

    await fs.mkdir(workspacePath, { recursive: true });
    logger.info(
      { deploymentId, workspacePath },
      "Created deployment workspace",
    );

    // 2. Cloning
    await updateStatus(deploymentId, "cloning");
    const { commitSha, commitMessage } = await GitService.cloneRepository(
      repoRecord.cloneUrl,
      deploymentRecord.branch,
      workspacePath,
      repoRecord.isPrivate,
      githubAcc?.installationId,
    );

    // Save commit info
    await db
      .update(schema.deployment)
      .set({ commitSha, commitMessage })
      .where(eq(schema.deployment.id, deploymentId));

    // 3. Detecting Framework
    const detection = await DetectorService.detect(workspacePath);
    logger.info({ deploymentId, detection }, "Detected project configuration");

    // Update the project framework in the database if it changed
    await db
      .update(schema.project)
      .set({ framework: detection.framework })
      .where(eq(schema.project.id, deploymentRecord.projectId));

    // 4. Installing Dependencies
    await updateStatus(deploymentId, "installing");
    // (Installation is handled inside the Docker execution to keep it isolated)

    // 5. Building (Docker Execution handles both install and build)
    await updateStatus(deploymentId, "building");
    await DockerService.executeBuild(deploymentId, workspacePath, detection);

    // 6. Collecting Artifacts
    await updateStatus(deploymentId, "uploading");
    const { buildSize, metadata } = await ArtifactService.collect(
      workspacePath,
      detection,
    );

    // 7. Success
    const buildDuration = Date.now() - startTime;
    await updateStatus(deploymentId, "success", {
      completedAt: new Date(),
      buildDuration,
      metadata,
    });

    logger.info(
      { deploymentId, buildDuration, buildSize },
      "Deployment completed successfully",
    );
  } catch (error: any) {
    logger.error({ deploymentId, err: error }, "Deployment failed");
    await updateStatus(deploymentId, "failed", { completedAt: new Date() });
    throw error;
  } finally {
    // 8. Cleanup
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

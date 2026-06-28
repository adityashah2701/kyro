import { db } from "@/db";
import { deployment, projectRepository } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { deploymentQueue } from "../queue/client";

export async function createDeployment(
  projectId: string,
  userId: string,
  triggerType: string = "manual"
) {
  // 1. Get project repository info
  const repo = await db.query.projectRepository.findFirst({
    where: eq(projectRepository.projectId, projectId),
  });

  if (!repo) {
    throw new Error("Project repository not found or not linked.");
  }

  // 2. Count existing deployments to get deploymentNumber
  // For simplicity, we just count current deployments for this project + 1.
  // In a highly concurrent system, this might need a transaction with locking.
  const existingDeployments = await db.query.deployment.findMany({
    where: eq(deployment.projectId, projectId),
  });
  const deploymentNumber = existingDeployments.length + 1;

  // 3. Create the deployment record
  const [newDeployment] = await db
    .insert(deployment)
    .values({
      projectId,
      userId,
      branch: repo.selectedBranch,
      status: "queued",
      triggerType,
      deploymentNumber,
    })
    .returning();

  return newDeployment;
}

export async function queueDeployment(deploymentId: string) {
  // Add job to BullMQ
  // The worker will pick this up and handle the build process
  const job = await deploymentQueue.add("deploy", {
    deploymentId,
  });

  return job;
}

export async function cancelDeployment(deploymentId: string, userId: string) {
  const existing = await db.query.deployment.findFirst({
    where: and(eq(deployment.id, deploymentId), eq(deployment.userId, userId)),
  });

  if (!existing) {
    throw new Error("Deployment not found or unauthorized.");
  }

  if (["success", "failed", "cancelled"].includes(existing.status)) {
    throw new Error("Cannot cancel a completed deployment.");
  }

  // Update status in DB
  const [updated] = await db
    .update(deployment)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
      completedAt: new Date(),
    })
    .where(eq(deployment.id, deploymentId))
    .returning();

  // Optionally, try to remove from queue if it hasn't started
  // await deploymentQueue.remove(deploymentId);
  // Note: removing from queue requires a specific job id approach.

  return updated;
}

export async function retryDeployment(deploymentId: string, userId: string) {
  const existing = await db.query.deployment.findFirst({
    where: and(eq(deployment.id, deploymentId), eq(deployment.userId, userId)),
  });

  if (!existing) {
    throw new Error("Deployment not found or unauthorized.");
  }

  if (existing.status !== "failed" && existing.status !== "cancelled") {
    throw new Error("Can only retry failed or cancelled deployments.");
  }

  // Set status back to queued
  const [updated] = await db
    .update(deployment)
    .set({
      status: "queued",
      updatedAt: new Date(),
      queuedAt: new Date(),
      startedAt: null,
      completedAt: null,
      buildDuration: null,
    })
    .where(eq(deployment.id, deploymentId))
    .returning();

  await queueDeployment(deploymentId);

  return updated;
}

export async function getProjectDeployments(projectId: string) {
  return await db.query.deployment.findMany({
    where: eq(deployment.projectId, projectId),
    orderBy: [desc(deployment.createdAt)],
  });
}

export async function getDeploymentDetails(
  deploymentId: string,
  userId: string
) {
  const existing = await db.query.deployment.findFirst({
    where: and(eq(deployment.id, deploymentId), eq(deployment.userId, userId)),
  });
  return existing;
}

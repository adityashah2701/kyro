import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./logger";
import { processDeploymentJob } from "./processor";
import type { QueueJobData } from "@kyro/shared";

import { redisConfig } from "./redis";

logger.info("Starting Docker Build Worker...");

const worker = new Worker<QueueJobData>(
  "deployments",
  async (job: Job<QueueJobData>) => {
    logger.info(
      { jobId: job.id, deploymentId: job.data.deploymentId },
      "Picked up deployment job",
    );
    await processDeploymentJob(job);
  },
  {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "1", 10),
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed successfully");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Job failed");
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./logger";
import { processDeploymentJob } from "./processor";
import type { QueueJobData, PurgeJobData } from "@kyro/shared";
import { RetentionService } from "./services/retention.service";

import { redisConfig } from "./redis";

logger.info("Starting Docker Build Worker...");

const worker = new Worker<QueueJobData | PurgeJobData>(
  "deployments",
  async (job: Job<QueueJobData | PurgeJobData>) => {
    if (job.name === "purge-artifacts") {
      await RetentionService.purge((job.data as PurgeJobData).prefixes);
      return;
    }
    const data = job.data as QueueJobData;
    logger.info(
      { jobId: job.id, deploymentId: data.deploymentId },
      "Picked up deployment job",
    );
    await processDeploymentJob(job as Job<QueueJobData>);
  },
  {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "1", 10),
    // Deployment jobs are long-running (docker install + build + upload can take
    // minutes). Give the lock a generous duration so a slow build is never
    // mistaken for a dead worker, and tolerate a couple of stalls so a dev
    // restart (tsx watch) or a brief hiccup retries instead of failing outright.
    lockDuration: 300_000, // 5 min before an unrenewed lock is considered dead
    stalledInterval: 60_000, // how often to scan for stalled jobs
    maxStalledCount: 3, // allow retries after transient stalls
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

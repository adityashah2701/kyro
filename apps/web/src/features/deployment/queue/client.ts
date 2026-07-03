import { Queue, QueueOptions } from "bullmq";

// Reuse existing Redis config
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

const queueOptions: QueueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    // Bound Redis memory/disk: drop completed jobs, and keep only the most
    // recent failures instead of retaining them forever (important on Free Tier).
    removeOnComplete: true,
    removeOnFail: { count: 50 },
  },
};

export const deploymentQueue = new Queue("deployments", queueOptions);

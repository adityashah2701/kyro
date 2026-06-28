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
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const deploymentQueue = new Queue("deployments", queueOptions);

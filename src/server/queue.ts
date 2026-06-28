import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";

const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const deploymentQueue = new Queue("deployments", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: connection as any,
});

// We'll initialize workers here later when implementing the deployment engine

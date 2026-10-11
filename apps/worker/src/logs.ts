import { redisClient } from "./redis";

/**
 * Live build logs. Every chunk is (1) appended to a Redis list so a viewer who
 * opens the page late can replay what they missed, and (2) published on the
 * channel with a sequence number so the web route can join history and live
 * messages without gaps or duplicates.
 */
// shortcut: history is capped at 20k chunks and a 2h TTL (Redis here is 64 MB,
// noeviction); chunks past the cap are live-only. Raise both if builds are huge.
const HISTORY_CAP = 20_000;
const TTL_SECONDS = 2 * 60 * 60;

const keys = (deploymentId: string) => ({
  channel: `deployments:${deploymentId}:logs`,
  history: `deployments:${deploymentId}:logs:history`,
  seq: `deployments:${deploymentId}:logs:seq`,
});

// Serialised so sequence numbers reach subscribers in order.
let chain: Promise<unknown> = Promise.resolve();
const enqueue = (job: () => Promise<unknown>) =>
  (chain = chain.then(job).catch(() => {}));

export function publishLog(deploymentId: string, message: string) {
  const k = keys(deploymentId);
  return enqueue(async () => {
    const seq = await redisClient.incr(k.seq);
    if (seq <= HISTORY_CAP) await redisClient.rpush(k.history, message);
    if (seq === 1) {
      await redisClient.expire(k.seq, TTL_SECONDS);
      await redisClient.expire(k.history, TTL_SECONDS);
    }
    await redisClient.publish(k.channel, JSON.stringify({ seq, message }));
  });
}

/** Drops replay data once the logs are saved on the deployment row. */
export function clearLogHistory(deploymentId: string) {
  const k = keys(deploymentId);
  return enqueue(() => redisClient.del(k.history, k.seq));
}

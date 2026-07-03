/**
 * PM2 process definitions for running Kyro's three Node processes on a host
 * that already has Docker + the infra containers (Postgres/Redis/MinIO) up.
 *
 * Tuned for a 1 GB Free-Tier box:
 *  - single instance each (fork mode), no clustering
 *  - max_memory_restart as a safety net against leaks / runaway builds
 *  - NODE_OPTIONS caps the JS heap so a process can't try to grow past the box
 *  - kill_timeout gives each process 10 s to flush in-flight work before SIGKILL
 *  - merge_logs + log_date_format make log lines easy to grep and timestamp
 *
 * On a larger instance, raise the memory numbers (or remove the caps) — the
 * shape stays identical, so the upgrade path is just editing these values.
 *
 * Usage:
 *   npm run build -w @kyro/web      # build the dashboard once
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup
 *
 * Log management (run periodically or add to cron):
 *   pm2 flush                        # truncate all current log files
 *   sudo bash scripts/free-tier/install-logrotate.sh  # daily logrotate setup
 */
module.exports = {
  apps: [
    {
      // Next.js dashboard + API (heaviest Node process). `next start` on :3000.
      name: "kyro-web",
      cwd: "apps/web",
      script: "npm",
      args: "run start",
      interpreter: "none",
      autorestart: true,
      restart_delay: 3000,
      // 10 s graceful shutdown window — lets Next.js finish in-flight SSR
      // requests and close the DB pool before PM2 sends SIGKILL.
      kill_timeout: 10000,
      max_memory_restart: "500M",
      // Combine stdout + stderr into one file; halves open file-handle count.
      merge_logs: true,
      // ISO-style timestamps on every log line — essential for debugging on a
      // single-server box where multiple processes share the same journal.
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_OPTIONS: "--max-old-space-size=400",
      },
    },
    {
      // BullMQ build worker. Blocks on Redis when idle (no busy polling), so it
      // costs almost nothing until a job arrives; the build itself runs in a
      // separate Docker container, not in this process.
      name: "kyro-worker",
      cwd: "apps/worker",
      script: "npx",
      args: "tsx -r dotenv/config src/index.ts",
      interpreter: "none",
      autorestart: true,
      restart_delay: 3000,
      // 10 s lets the worker finish ACKing the current job state to Redis/PG
      // before shutdown, avoiding stalled-job re-queues on restart.
      kill_timeout: 10000,
      max_memory_restart: "300M",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        DOTENV_CONFIG_PATH: "../../.env",
        NODE_OPTIONS: "--max-old-space-size=256",
        WORKER_CONCURRENCY: "1", // one build at a time on Free Tier (see docs)
      },
    },
    {
      // Reverse proxy that serves static artifacts from MinIO and runs SSR
      // deployments in per-deployment containers (capped + reaped by RunnerService).
      name: "kyro-proxy",
      cwd: "apps/proxy",
      script: "npx",
      args: "tsx -r dotenv/config src/index.ts",
      interpreter: "none",
      autorestart: true,
      restart_delay: 3000,
      // 10 s lets the proxy drain active HTTP streams to MinIO before shutdown.
      kill_timeout: 10000,
      max_memory_restart: "250M",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        DOTENV_CONFIG_PATH: "../../.env",
        NODE_OPTIONS: "--max-old-space-size=200",
      },
    },
  ],
};

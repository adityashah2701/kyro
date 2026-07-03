# Deploying Kyro on AWS Free Tier (1 GB RAM)

This guide makes Kyro run **reliably on a `t2.micro` / `t3.micro` (1 vCPU, 1 GB RAM) Free-Tier instance** for development, demos, and personal use — while keeping the exact same production architecture (Next.js dashboard + Worker + Proxy + Postgres + Redis + MinIO + Docker-based deployments). Nothing is redesigned; everything below is either a config value, a script, or a small guardrail, so upgrading to a bigger instance later is just changing numbers back.

> **TL;DR of the tiers**
>
> |                   | AWS Free Tier                           | Production                                  |
> | ----------------- | --------------------------------------- | ------------------------------------------- |
> | Instance          | `t2.micro` / `t3.micro` (1 GB)          | `t3.large`+ (8 GB+)                         |
> | Use case          | dev, demos, personal, 1 build at a time | real multi-user traffic + concurrent builds |
> | Swap              | **required** (4 GB)                     | optional                                    |
> | Concurrent builds | **1** (enforced)                        | several (`WORKER_CONCURRENCY` > 1)          |
> | Warm SSR apps     | capped (`RUNNER_MAX_INSTANCES=3`)       | many                                        |
> | Disk              | ~20 GB + nightly prune + logrotate      | 40–60 GB+                                   |

---

## 1. Analysis — where the RAM actually goes

Approximate **resident** memory on an idle-but-running box, then the spike during a build:

| Component                              |                   Idle RAM | Notes                                             |
| -------------------------------------- | -------------------------: | ------------------------------------------------- |
| **Build container** (`next build`)     | **400 MB – 1 GB+** (spike) | The #1 OOM cause. Only exists during a deploy.    |
| **MinIO**                              |                ~120–180 MB | Heavier than you'd expect for object storage.     |
| **Next.js dashboard** (`next start`)   |                ~120–160 MB | Largest _persistent_ Node process.                |
| **PostgreSQL**                         |                 ~40–120 MB | Grows with `shared_buffers` / connections.        |
| **Docker daemon** (dockerd+containerd) |                 ~80–120 MB | Fixed overhead; needed for builds + SSR.          |
| **Worker** (tsx + BullMQ)              |                 ~60–100 MB | Idle-cheap; build runs in a _separate_ container. |
| **Proxy** (tsx + Express)              |                  ~50–80 MB | Plus one container per warm SSR deployment.       |
| **Each warm SSR deployment**           |                 ~80–150 MB | Accumulates unless capped/reaped.                 |

**The math:** idle baseline is already ~500–700 MB. A single `next build` easily pushes total demand past 1 GB → the kernel OOM-kills something. So the strategy is:

1. **Absorb the build spike with swap** (Requirement #2) instead of trying to fit it in RAM.
2. **Cap the JS heap** of build + runtime Node processes (Requirement #3) so they don't over-allocate.
3. **Serialize builds** — never run two at once (Requirement #4).
4. **Bound the persistent stuff** — one dashboard, capped warm SSR containers with an idle reaper (Requirement #5/#8), trimmed infra footprints (Requirement #1).
5. **Keep the disk from filling** with automated Docker/artifact cleanup and log rotation (Requirements #6/#7).

### Trade-offs you accept on a micro instance

- **Builds are slower.** Swap is disk-backed; a build that spills into swap can take noticeably longer. Acceptable for one-at-a-time personal use.
- **Cold starts on SSR sites.** With `RUNNER_MAX_INSTANCES=3` and a 15-min idle reaper, an infrequently-visited SSR project will cold-start (a few seconds) after being evicted/reaped. Static sites are unaffected (served straight from MinIO).
- **Low concurrency.** One build at a time; a second deploy waits in the queue. Fine for demos, wrong for a busy team → that's the production tier.
- **Headroom is thin.** If you also run heavy `psql` queries during a build you can still stall. Swap prevents _crashes_, not slowness.

Every change below maps to one of these points and is **off by default / overridable via env**, so a bigger instance simply doesn't set the Free-Tier values.

---

## 2. Swap (REQUIRED) — 4 GB swap file

Free-Tier RAM (~1 GB) cannot hold a real build spike. Swap is the pressure-relief valve that lets a transient spike complete instead of being OOM-killed. **Do this first, before your first deploy.**

Automated via [`scripts/free-tier/setup-swap.sh`](../scripts/free-tier/setup-swap.sh):

```bash
sudo bash scripts/free-tier/setup-swap.sh      # defaults to 4 GB
```

What it does (and you can do manually):

```bash
sudo fallocate -l 4G /swapfile          # create
sudo chmod 600 /swapfile
sudo mkswap /swapfile                    # format as swap
sudo swapon /swapfile                    # enable now
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # persist across reboots
sudo sysctl -w vm.swappiness=10          # only swap under real pressure
sudo sysctl -w vm.vfs_cache_pressure=50  # retain inode/dentry cache a bit longer
```

**Verify:**

```bash
swapon --show     # should list /swapfile, 4G
free -h           # "Swap:" row shows 4.0Gi total
```

`vm.swappiness=10` keeps hot pages in RAM and uses swap only when genuinely pressured — you want swap as a _safety net_, not primary memory.

---

## 3. Node memory limits — `--max-old-space-size`

Node will happily try to grow its heap toward what it _thinks_ is available and trigger OOM. Capping the old-space heap makes each process fail gracefully / GC harder instead of ballooning.

Which processes and why:

| Process                                                             | Cap                        | Why                                                                                   |
| ------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| **Build tools** (`npm install` / `next build` inside the container) | `--max-old-space-size=512` | The build is the spike; cap it so it leans on swap predictably rather than exploding. |
| **Dashboard** (`kyro-web`)                                          | `--max-old-space-size=400` | Largest persistent Node process.                                                      |
| **Worker** (`kyro-worker`)                                          | `--max-old-space-size=256` | Only orchestrates; heavy work is in the build container.                              |
| **Proxy** (`kyro-proxy`)                                            | `--max-old-space-size=200` | Thin; mostly streams bytes / spawns docker.                                           |

- Runtime processes get their caps from [`ecosystem.config.js`](../ecosystem.config.js) (`NODE_OPTIONS`).
- The **build** gets its cap by setting `BUILD_NODE_OPTIONS` in `.env` — the worker forwards it into the build container ([`docker.service.ts`](../apps/worker/src/services/docker.service.ts)):

  ```bash
  BUILD_NODE_OPTIONS="--max-old-space-size=512"
  ```

---

## 4. Build strategy — one build at a time

Two concurrent `next build` containers on 1 GB is an instant OOM. The worker already enforces serialization, and it's now explicit:

- `WORKER_CONCURRENCY=1` (default in code, and pinned in [`ecosystem.config.js`](../ecosystem.config.js)) → BullMQ processes exactly one job at a time. A second deploy simply waits in the queue.
- Build container caps in `.env`:

  ```bash
  MAX_MEMORY=768m          # hard RAM ceiling for the build container
  MAX_MEMORY_SWAP=3g       # allow it to spill into swap (RAM+swap total)
  MAX_CPU=1.0
  ```

  `MAX_MEMORY_SWAP` > `MAX_MEMORY` is what lets the build use the swap file you created in step 2 ([`docker.service.ts`](../apps/worker/src/services/docker.service.ts) adds `--memory-swap` only when set).

Retries are bounded too: failed jobs are capped at the last 50 instead of being kept forever ([`queue/client.ts`](../apps/web/src/features/deployment/queue/client.ts)), so Redis can't grow unbounded on repeated failures.

---

## 5. Worker efficiency

Good news: the worker is already efficient by design, and now documented/pinned.

- **Idles for free.** BullMQ uses Redis **blocking** reads (`BRPOPLPUSH`/`BZPOPMIN`), so an idle worker is parked on a socket — **no busy polling, near-zero CPU/RAM** until a job is enqueued.
- **Heavy work is out-of-process.** Install/build run in a throwaway Docker container, not in the worker's heap, so the worker's own footprint stays flat (~60–100 MB) regardless of project size.
- **Bounded memory.** `NODE_OPTIONS=--max-old-space-size=256` + `max_memory_restart: 300M` in PM2 → a leak or a pathological job restarts the worker instead of taking down the box.
- **Cleans up after itself.** Each job removes its workspace and log file in a `finally` block, so `/tmp/deployments` doesn't grow.

No polling loop existed to remove — the design is already event-driven. The change here is making the limits explicit rather than implicit.

---

## 6. Docker cleanup — automated

Build layers and cache grow unbounded; stopped containers linger. Automated via [`scripts/free-tier/docker-cleanup.sh`](../scripts/free-tier/docker-cleanup.sh):

```bash
docker container prune -f                        # stopped containers
docker image   prune -af --filter "until=24h"    # unused images >24h old
docker builder prune -af --filter "until=24h"    # build cache (usually the biggest)
docker network prune -f
```

- **`image prune`** – reclaims disk from old base images; the `until=24h` filter keeps recent `node:*-alpine` so back-to-back deploys don't re-pull.
- **`builder prune`** – the build cache is typically the single largest consumer; trim it regularly.
- **`system prune`** – only for a manual disk emergency, and **never with `--volumes`** (that would delete Postgres/MinIO data).

**When to run:** nightly cron (recommended) + optionally before a large build.

```bash
# crontab -e  → daily at 04:17
17 4 * * * /bin/bash /home/ubuntu/kyro/scripts/free-tier/docker-cleanup.sh >> /var/log/kyro-docker-cleanup.log 2>&1
```

---

## 7. Storage optimization (target ~20 GB EBS)

| Consumer                                  | Risk                                                                    | Policy                                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Docker images / build cache**           | Largest grower                                                          | Nightly `docker-cleanup.sh` (step 6).                                                                                                       |
| **MinIO artifacts**                       | Grows per deploy; **server bundles include `node_modules`** and are big | Keep only the **active + last N** deployments per project; delete artifacts of superseded deployments (see below).                          |
| **Temp workspaces** (`/tmp/deployments`)  | Cloned repo + node_modules per build                                    | Already auto-removed in the worker's `finally`; a stale one only survives a hard crash. `sudo rm -rf /tmp/deployments/*` is safe when idle. |
| **Runner workdirs** (`/tmp/kyro-runners`) | Extracted SSR bundles                                                   | Removed when an instance is stopped/reaped (step 8). Safe to clear when idle.                                                               |
| **Logs**                                  | pm2 + cleanup logs                                                      | See **Section 10: Log Management** — logrotate handles this automatically.                                                                  |

**Artifact retention (recommended):** because each _server_ deployment stores a full `node_modules` bundle, old deployments dominate MinIO. Prune artifacts of inactive deployments — e.g. keep the active one plus the 2 most recent per project — on a schedule (a small script deleting `deployments/<id>/` prefixes for superseded rows). Static artifacts are smaller but the same policy applies.

Watch usage with `df -h /` and `docker system df`.

---

## 8. PM2 configuration ([`ecosystem.config.js`](../ecosystem.config.js))

Purpose-built for a low-memory server:

- **Fork mode, 1 instance each** — no clustering (clustering would multiply memory for zero benefit here).
- **`max_memory_restart`** per app (web 500M / worker 300M / proxy 250M) — PM2 restarts a process that exceeds its ceiling, turning a slow leak or a runaway request into a blip instead of an OOM cascade.
- **`kill_timeout: 10000`** — gives each process 10 seconds to complete in-flight work (SSR requests, job ACKs, stream drains) before PM2 sends SIGKILL. Without this, a hard kill can leave BullMQ jobs in the `active` state requiring manual recovery.
- **`merge_logs: true` + `log_date_format`** — combines stdout/stderr into one file per process (halves file-handle count) and timestamps every line, making it easy to correlate events across the three processes.
- **`NODE_OPTIONS` heap caps** baked in per process (step 3).
- **`autorestart` + `restart_delay: 3000`** — crash-resilient without hot-restart loops.
- **Runtime via `tsx`** for worker/proxy — they import `@kyro/*` packages as raw TypeScript, so `tsx` (not a compiled `dist/`) is the correct, dependency-resolving way to run them.

```bash
npm run build -w @kyro/web        # build the dashboard once
pm2 start ecosystem.config.js
pm2 save
pm2 startup                       # run the printed command → survives reboot
pm2 status                        # web / worker / proxy all "online"
```

**Runner guardrails (proxy, [`runner.service.ts`](../apps/proxy/src/services/runner.service.ts)):** SSR deployments run in containers that are now capped and bounded:

```bash
RUNNER_MEMORY=384m               # per-SSR-container RAM cap
RUNNER_MEMORY_SWAP=768m          # allow modest swap for the container
RUNNER_MAX_INSTANCES=3           # at most 3 warm SSR apps; LRU-evict beyond that
RUNNER_IDLE_TIMEOUT_MS=900000    # reap a warm app after 15 min idle
```

Without these, every visited SSR project stays resident forever and eventually OOMs the box. With them, RAM used by warm apps is bounded and predictable.

---

## 9. Full Free-Tier setup (start to finish)

```bash
# 0) On a fresh Ubuntu 22.04/24.04 t3.micro with an Elastic IP + SG (22/you, 80+443/all)

# 1) Swap FIRST
sudo bash scripts/free-tier/setup-swap.sh
free -h

# 2) Docker + Node 20 + pm2
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER          # re-login after this
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm i -g pm2

# 3) Clone + install
git clone <your-repo-url> kyro && cd kyro
npm install

# 4) Create root .env (see the Free-Tier block below), then infra with the overlay
docker compose -f docker-compose.yml -f docker-compose.freetier.yml up -d

# 5) Migrate DB
cd apps/web && npx dotenv-cli -e ../../.env -- npx drizzle-kit push && cd ../..

# 6) Build dashboard + start everything
npm run build -w @kyro/web
pm2 start ecosystem.config.js && pm2 save && pm2 startup

# 7) Schedule nightly Docker cleanup
( crontab -l 2>/dev/null; echo "17 4 * * * /bin/bash $(pwd)/scripts/free-tier/docker-cleanup.sh >> /var/log/kyro-docker-cleanup.log 2>&1" ) | crontab -

# 8) Install logrotate (prevents PM2 logs filling the disk)
sudo bash scripts/free-tier/install-logrotate.sh
```

### Free-Tier `.env` additions

On top of the standard vars (DB/Redis/MinIO/Auth/GitHub/`ENCRYPTION_KEY`/`BASE_DOMAIN` — see `.env.example`), add:

```bash
# --- Free-Tier tuning ---
WORKER_CONCURRENCY=1
MAX_MEMORY=768m
MAX_MEMORY_SWAP=3g
MAX_CPU=1.0
BUILD_NODE_OPTIONS=--max-old-space-size=512

RUNNER_MEMORY=384m
RUNNER_MEMORY_SWAP=768m
RUNNER_MAX_INSTANCES=3
RUNNER_IDLE_TIMEOUT_MS=900000
```

> HTTPS + wildcard subdomains (Caddy/Route 53) is identical to the production guide — see `docs/deploy-aws-ec2.md` (or the HTTPS section you set up). The only Free-Tier difference is the tuning above; the domain/TLS setup is the same.

---

## 10. Log management

PM2 writes a log file per process with no built-in size limit. On a 20 GB disk with active deploys, logs can consume several GB within days. Two complementary tools address this:

### Immediate flush

```bash
pm2 flush          # truncates all current log files to zero bytes right now
```

Run this any time logs are getting large, or add to a weekly cron.

### Daily logrotate (recommended)

[`scripts/free-tier/logrotate-kyro.conf`](../scripts/free-tier/logrotate-kyro.conf) configures daily rotation with:

- **7-day retention** for PM2 logs (compressed after 1 day)
- **14-day retention** for the Docker cleanup log
- **`copytruncate`** — safe for PM2 (no signal needed; the process keeps writing to the truncated original)

Install it once:

```bash
sudo bash scripts/free-tier/install-logrotate.sh
```

Verify / force-rotate:

```bash
sudo logrotate -d /etc/logrotate.d/kyro    # dry-run (shows what would happen)
sudo logrotate -f /etc/logrotate.d/kyro    # force immediate rotation
```

---

## 11. Upgrade path to Production

Nothing structural changes — you raise numbers and remove caps:

| Setting                          | Free Tier                  | Production                      |
| -------------------------------- | -------------------------- | ------------------------------- |
| Instance                         | t3.micro (1 GB)            | t3.large+ (8 GB+)               |
| Swap                             | 4 GB required              | optional                        |
| `WORKER_CONCURRENCY`             | `1`                        | `2`–`4` (per RAM)               |
| `MAX_MEMORY` / `MAX_MEMORY_SWAP` | `768m` / `3g`              | `2g`+ / unset                   |
| `BUILD_NODE_OPTIONS`             | `--max-old-space-size=512` | raise or unset                  |
| `RUNNER_MAX_INSTANCES`           | `3`                        | `10`+ or unset-large            |
| `RUNNER_MEMORY`                  | `384m`                     | raise or unset                  |
| PM2 `max_memory_restart`         | 250–500M                   | raise / remove                  |
| PM2 `kill_timeout`               | 10 000 ms                  | keep (good practice regardless) |
| EBS                              | ~20 GB + nightly prune     | 40–60 GB+                       |
| logrotate                        | daily, 7-day retention     | adjust retention                |

Because every Free-Tier optimization is env-driven and off-by-default in code, a production box just omits the tuning block and provisions more resources. Same architecture, same images, same processes — only the dials move.

---

### Summary of what changed in the repo

| File                                                                                                      | Change                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/worker/src/services/docker.service.ts`](../apps/worker/src/services/docker.service.ts)             | Build container honors `MAX_MEMORY_SWAP` (swap spill) and `BUILD_NODE_OPTIONS` (heap cap). Added disk-space pre-check (`checkDiskSpace`) that warns when available disk falls below `MIN_DISK_MB` (default 2 GB) before a build starts.                                                                                                                 |
| [`apps/proxy/src/services/runner.service.ts`](../apps/proxy/src/services/runner.service.ts)               | Per-SSR-container memory cap, instance limit with LRU eviction, and idle reaper.                                                                                                                                                                                                                                                                        |
| [`apps/web/src/features/deployment/queue/client.ts`](../apps/web/src/features/deployment/queue/client.ts) | Bounded failed-job retention (last 50) so Redis stays small.                                                                                                                                                                                                                                                                                            |
| [`ecosystem.config.js`](../ecosystem.config.js)                                                           | PM2 defs with heap caps, `max_memory_restart`, `kill_timeout: 10000`, `merge_logs`, `log_date_format`, single-instance, pinned `WORKER_CONCURRENCY=1`.                                                                                                                                                                                                  |
| [`docker-compose.freetier.yml`](../docker-compose.freetier.yml)                                           | **Fixed Redis `maxmemory-policy` from `noeviction` → `allkeys-lru`** (bug: `noeviction` causes Redis to error on writes when full, breaking BullMQ). Added `restart: unless-stopped` to all three services (containers now survive reboots). Fixed `--save ""` quoting. Memory-capped + tuned Postgres/Redis/MinIO overlay; infra bound to `127.0.0.1`. |
| [`.env.example`](../.env.example)                                                                         | Added `ENCRYPTION_KEY`, `BASE_DOMAIN`, and a full **Free-Tier tuning block** with all 9 free-tier env vars, each documented with a rationale and recommended value.                                                                                                                                                                                     |
| [`scripts/free-tier/setup-swap.sh`](../scripts/free-tier/setup-swap.sh)                                   | Create/enable/persist 4 GB swap + swappiness tuning.                                                                                                                                                                                                                                                                                                    |
| [`scripts/free-tier/docker-cleanup.sh`](../scripts/free-tier/docker-cleanup.sh)                           | Safe (volume-preserving) prune of containers/images/build cache.                                                                                                                                                                                                                                                                                        |
| [`scripts/free-tier/logrotate-kyro.conf`](../scripts/free-tier/logrotate-kyro.conf)                       | **[NEW]** Daily logrotate config for PM2 logs (7-day) and cleanup log (14-day). `copytruncate` so running processes need no signal.                                                                                                                                                                                                                     |
| [`scripts/free-tier/install-logrotate.sh`](../scripts/free-tier/install-logrotate.sh)                     | **[NEW]** One-command installer: copies config → `/etc/logrotate.d/kyro`, verifies with a dry-run.                                                                                                                                                                                                                                                      |

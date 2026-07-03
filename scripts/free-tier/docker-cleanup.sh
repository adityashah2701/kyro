#!/usr/bin/env bash
#
# Reclaim disk + a little RAM by pruning Docker leftovers.
#
# WHY: every build pulls/creates layers and the build cache grows unbounded;
# stopped runner containers and dangling images pile up. On a ~20 GB disk this
# fills the volume within days of active use and then builds fail with ENOSPC.
#
# SAFETY: this NEVER touches volumes, so Postgres / Redis / MinIO data is safe.
# It only removes stopped containers, unused images, and old build cache.
#
# WHEN TO RUN:
#   - as a nightly cron (recommended), and/or
#   - right before a big build if disk is tight.
#
# Cron example (run daily at 04:17):
#   17 4 * * * /bin/bash /path/to/kyro/scripts/free-tier/docker-cleanup.sh >> /var/log/kyro-docker-cleanup.log 2>&1
set -euo pipefail

echo "🧹 [$(date -u +%FT%TZ)] Docker cleanup starting..."
echo "Disk before:"; df -h / | tail -1

# 1. Remove stopped containers (Kyro build/runner containers use --rm, but a
#    crash can still leave some behind). Running containers are untouched.
docker container prune -f

# 2. Remove images not used by any container and older than 24h. Keeps images
#    from the last day so back-to-back deploys don't re-pull node:*-alpine.
docker image prune -af --filter "until=24h"

# 3. Trim the build cache older than 24h (this is usually the biggest hog).
docker builder prune -af --filter "until=24h"

# 4. Networks that are no longer referenced. (Volumes are intentionally excluded.)
docker network prune -f

echo "Disk after:"; df -h / | tail -1
echo "✅ [$(date -u +%FT%TZ)] Docker cleanup done."

# NOTE: For a full manual reset (e.g. disk emergency) you can run
#   docker system prune -af --filter "until=24h"
# but do NOT add --volumes: that would delete your database and object storage.

#!/usr/bin/env bash
#
# Create and enable a 4 GB swap file, and persist it across reboots.
#
# WHY: A Free-Tier instance has ~1 GB RAM. Postgres + Redis + MinIO + the three
# Node processes + the Docker daemon already sit close to that ceiling. A real
# `next build` inside the build container spikes to several hundred MB more.
# Without swap the Linux OOM killer terminates whatever it decides is largest
# (often the build container OR postgres), and the deploy fails randomly.
# Swap gives the kernel a pressure-relief valve: slow, disk-backed memory that
# lets a transient build spike complete instead of being killed.
#
# Run once, as root (or with sudo):  sudo bash scripts/free-tier/setup-swap.sh
set -euo pipefail

SWAPFILE="/swapfile"
SIZE_GB="${1:-4}"

if swapon --show | grep -q "$SWAPFILE"; then
  echo "✅ Swap already active:"
  swapon --show
  exit 0
fi

echo "📦 Creating ${SIZE_GB}G swap file at ${SWAPFILE}..."
# fallocate is fast; fall back to dd if the filesystem doesn't support it.
if ! fallocate -l "${SIZE_GB}G" "$SWAPFILE" 2>/dev/null; then
  dd if=/dev/zero of="$SWAPFILE" bs=1M count=$((SIZE_GB * 1024)) status=progress
fi

chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"

# Persist across reboots.
if ! grep -q "^${SWAPFILE} " /etc/fstab; then
  echo "${SWAPFILE} none swap sw 0 0" >> /etc/fstab
  echo "🔁 Added ${SWAPFILE} to /etc/fstab"
fi

# Tuning for a swap-as-safety-net (not swap-as-primary) box:
#  - swappiness=10  : only swap under real pressure, keep hot pages in RAM
#  - vfs_cache_pressure=50 : retain inode/dentry cache a bit longer
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50
grep -q "vm.swappiness" /etc/sysctl.conf || echo "vm.swappiness=10" >> /etc/sysctl.conf
grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf || echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf

echo ""
echo "✅ Done. Verify with:"
echo "   swapon --show   |   free -h"
swapon --show
free -h

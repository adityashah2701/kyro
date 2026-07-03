#!/usr/bin/env bash
#
# Install the Kyro logrotate configuration so PM2 and cleanup logs are
# automatically rotated daily, preventing the 20 GB EBS disk from filling up.
#
# Run once, as root (or with sudo):  sudo bash scripts/free-tier/install-logrotate.sh
#
# What it does:
#   1. Copies logrotate-kyro.conf → /etc/logrotate.d/kyro
#   2. Verifies the config syntax with a logrotate dry-run
#   3. Ensures logrotate itself is installed (usually pre-installed on Ubuntu)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="${SCRIPT_DIR}/logrotate-kyro.conf"
CONF_DST="/etc/logrotate.d/kyro"

# ── Preflight ──────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "❌  This script must be run as root or with sudo."
  exit 1
fi

if [[ ! -f "$CONF_SRC" ]]; then
  echo "❌  Source config not found: $CONF_SRC"
  exit 1
fi

# ── Install logrotate if missing ───────────────────────────────────────────
if ! command -v logrotate &>/dev/null; then
  echo "📦 Installing logrotate..."
  apt-get update -qq && apt-get install -y logrotate
fi

# ── Create PM2 log dir if it doesn't exist yet ────────────────────────────
PM2_LOG_DIR="/home/ubuntu/.pm2/logs"
if [[ ! -d "$PM2_LOG_DIR" ]]; then
  echo "ℹ️  PM2 log directory not yet created (PM2 hasn't started). Skipping mkdir."
  echo "   logrotate will create it on first rotation once PM2 has written logs."
fi

# ── Install the config ─────────────────────────────────────────────────────
cp "$CONF_SRC" "$CONF_DST"
chmod 644 "$CONF_DST"
echo "✅  Installed: $CONF_DST"

# ── Verify syntax ──────────────────────────────────────────────────────────
echo ""
echo "🔍 Verifying logrotate config (dry-run)..."
logrotate -d "$CONF_DST" 2>&1 | head -30
echo ""
echo "✅  Logrotate config installed and verified."
echo ""
echo "   Useful commands:"
echo "   sudo logrotate -d $CONF_DST   # dry-run (no changes)"
echo "   sudo logrotate -f $CONF_DST   # force immediate rotation"
echo "   pm2 flush                      # truncate all PM2 log files right now"

#!/bin/bash
# ==============================================================================
# Kyro Enterprise EC2 Deployment Script (Repeatable Releases)
# ==============================================================================
set -Eeuo pipefail

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
DASHBOARD_DOMAIN="${DASHBOARD_DOMAIN:-dashboard.kyro.app}"
PROXY_PORT="${PROXY_PORT:-8000}"
DASHBOARD_PORT="${DASHBOARD_PORT:-3000}"
COMPOSE_FILES="${COMPOSE_FILES:--f docker-compose.yml -f docker-compose.freetier.yml}"
PM2_CONFIG="${PM2_CONFIG:-ecosystem.config.js}"
DB_CONTAINER="${DB_CONTAINER:-kyro-postgres-1}"
REDIS_CONTAINER="${REDIS_CONTAINER:-kyro-redis-1}"
MINIO_CONTAINER="${MINIO_CONTAINER:-kyro-minio-1}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"
START_TIME=$(date +%s)

NC='\033[0m'
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'

# ------------------------------------------------------------------------------
# Logging & Error Handling
# ------------------------------------------------------------------------------
log_ts() { date +"%Y-%m-%d %H:%M:%S"; }
info() { echo -e "${CYAN}[$(log_ts)] [INFO]${NC} $1"; }
success() { echo -e "${GREEN}[$(log_ts)] [SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[$(log_ts)] [WARNING]${NC} $1"; }
error() { echo -e "${RED}[$(log_ts)] [ERROR]${NC} $1" >&2; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}────────────────────────────────────\n$1\n────────────────────────────────────${NC}"; }

error_handler() {
    local line=$1 cmd=$2 code=$3 func=${FUNCNAME[1]:-main}
    echo -e "\n${RED}────────────────────────────────────${NC}"
    echo -e "${RED}[FATAL ERROR]${NC} Deployment failed!"
    echo -e "  Function : ${BOLD}$func${NC}"
    echo -e "  Command  : ${BOLD}$cmd${NC}"
    echo -e "  Line     : ${BOLD}$line${NC}"
    echo -e "  Exit Code: ${BOLD}$code${NC}"
    echo -e "${RED}────────────────────────────────────${NC}\n"
}
trap 'error_handler ${LINENO} "$BASH_COMMAND" $?' ERR

command_exists() { command -v "$1" >/dev/null 2>&1; }

# ------------------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------------------
step "Pre-flight Validation"

info "Verifying dependencies..."
for cmd in node npm docker pm2 caddy; do
    if ! command_exists "$cmd"; then
        error "$cmd is not installed. Did you run setup.sh first?"
    fi
done
success "All dependencies verified."

info "Verifying repository..."
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    error "Missing required repository files. Execute this from the repository root."
fi
success "Repository root verified."

info "Validating environment variables..."
if [ ! -f ".env" ]; then
    error "Missing .env file. Run setup.sh or create it manually."
fi
missing=()
required_vars=("DATABASE_URL" "BETTER_AUTH_SECRET" "REDIS_HOST" "MINIO_ACCESS_KEY" "MINIO_SECRET_KEY" "MINIO_ENDPOINT" "GITHUB_APP_ID" "GITHUB_APP_PRIVATE_KEY" "ENCRYPTION_KEY" "BASE_DOMAIN")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing+=("$var")
    fi
done
if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${RED}Missing required variables in .env:${NC}"
    for m in "${missing[@]}"; do echo "  - $m"; done
    error "Environment validation failed."
fi
success "Environment validated."

# Optional Pull
if [[ "${1:-}" == "--pull" ]]; then
    step "Source Control Update"
    info "Pulling latest code from origin..."
    git pull origin main
    success "Source code updated."
fi

step "Dependencies Installation"
if [ -f "package-lock.json" ]; then
    info "Running npm ci --no-audit --no-fund..."
    npm ci --no-audit --no-fund > /dev/null
else
    info "Running npm install..."
    npm install > /dev/null
fi
success "Dependencies installed."

step "Infrastructure Setup"
info "Starting containers..."
# shellcheck disable=SC2086
sudo docker compose $COMPOSE_FILES up -d > /dev/null

info "Waiting for PostgreSQL..."
pg_ready=false
for _ in $(seq 1 "$HEALTH_TIMEOUT"); do
    if sudo docker exec "$DB_CONTAINER" pg_isready -U kyro > /dev/null 2>&1; then
        pg_ready=true
        break
    fi
    sleep "$RETRY_INTERVAL"
done
[ "$pg_ready" = true ] || { sudo docker logs "$DB_CONTAINER" --tail 20; error "PostgreSQL failed to boot."; }
success "PostgreSQL is healthy."

info "Waiting for Redis..."
redis_ready=false
for _ in $(seq 1 "$HEALTH_TIMEOUT"); do
    if sudo docker exec "$REDIS_CONTAINER" redis-cli ping > /dev/null 2>&1; then
        redis_ready=true
        break
    fi
    sleep "$RETRY_INTERVAL"
done
[ "$redis_ready" = true ] || { sudo docker logs "$REDIS_CONTAINER" --tail 20; error "Redis failed to boot."; }
success "Redis is healthy."

info "Waiting for MinIO..."
minio_ready=false
for _ in $(seq 1 "$HEALTH_TIMEOUT"); do
    if curl -sSf http://127.0.0.1:9000/minio/health/live > /dev/null 2>&1; then
        minio_ready=true
        break
    fi
    sleep "$RETRY_INTERVAL"
done
[ "$minio_ready" = true ] || { sudo docker logs "$MINIO_CONTAINER" --tail 20; error "MinIO failed to boot."; }
success "MinIO is healthy."

step "Database Migration"
info "Pushing Drizzle schema..."
cd packages/database
npx dotenv-cli -e ../../.env -- npx drizzle-kit push > /dev/null
cd ../..
success "Database is up to date."

step "Build Process"
info "Building the Kyro Monorepo..."
if [ -f "node_modules/.bin/turbo" ] || command_exists turbo; then
    npx turbo run build
else
    npm run build --workspaces --if-present
fi
success "Build completed."

step "Deployment"
info "Deploying via PM2..."
apps=("kyro-web" "kyro-worker" "kyro-proxy")
existing_apps=$(pm2 jlist | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || true)

is_running=false
for app in "${apps[@]}"; do
    if echo "$existing_apps" | grep -q "^${app}$"; then
        is_running=true
        break
    fi
done

if [ "$is_running" = true ]; then
    info "Reloading existing ecosystem seamlessly..."
    pm2 reload "$PM2_CONFIG" --update-env > /dev/null
else
    info "Starting fresh ecosystem..."
    pm2 start "$PM2_CONFIG" > /dev/null
fi
pm2 save > /dev/null
success "PM2 apps deployed."

step "Caddy Routing"
CADDYFILE="/etc/caddy/Caddyfile"
BACKUP_FILE="/etc/caddy/Caddyfile.$(date +%Y%m%d%H%M%S).bak"
TMP_FILE="/tmp/Caddyfile.tmp"

info "Generating and validating new Caddy configuration..."
cat <<EOF > "$TMP_FILE"
{
    on_demand_tls {
        ask http://127.0.0.1:${PROXY_PORT}/api/check-domain
    }
}

$DASHBOARD_DOMAIN {
    reverse_proxy 127.0.0.1:${DASHBOARD_PORT}
}

https:// {
    tls {
        on_demand
    }
    reverse_proxy 127.0.0.1:${PROXY_PORT}
}
EOF

if sudo caddy validate --config "$TMP_FILE" > /dev/null 2>&1; then
    if ! cmp -s "$TMP_FILE" "$CADDYFILE"; then
        info "Configuration changed. Applying..."
        sudo cp "$CADDYFILE" "$BACKUP_FILE"
        sudo mv "$TMP_FILE" "$CADDYFILE"
        sudo chown root:root "$CADDYFILE"
        if ! sudo systemctl reload caddy > /dev/null 2>&1; then
            error "Reload failed. Reverting..."
            sudo cp "$BACKUP_FILE" "$CADDYFILE"
            sudo systemctl reload caddy || true
            exit 1
        fi
        success "Caddy reloaded with new configuration."
    else
        rm -f "$TMP_FILE"
        success "Caddy configuration has not changed. Skipping reload."
    fi
else
    rm -f "$TMP_FILE"
    error "Generated Caddy config was invalid. Routing left untouched."
fi

step "Final Verification"
failed=0
printf "%-30s %-15s\n" "SERVICE/CHECK" "STATUS"
printf "%-45s\n" "─────────────────────────────────────────────"

for p in "PostgreSQL|$DB_CONTAINER|pg_isready -U kyro" \
         "Redis|$REDIS_CONTAINER|redis-cli ping"; do
    name=$(echo "$p" | cut -d'|' -f1)
    cont=$(echo "$p" | cut -d'|' -f2)
    cmd=$(echo "$p" | cut -d'|' -f3)
    if sudo docker exec "$cont" $cmd > /dev/null 2>&1; then
        printf "%-30s ${GREEN}%-15s${NC}\n" "$name" "PASS"
    else
        printf "%-30s ${RED}%-15s${NC}\n" "$name" "FAIL"
        failed=1
    fi
done

if curl -sSf http://127.0.0.1:9000/minio/health/live > /dev/null 2>&1; then
    printf "%-30s ${GREEN}%-15s${NC}\n" "MinIO" "PASS"
else
    printf "%-30s ${RED}%-15s${NC}\n" "MinIO" "FAIL"
    failed=1
fi

for app in "${apps[@]}"; do
    if pm2 jlist | grep -q "\"name\":\"${app}\".*\"status\":\"online\""; then
        printf "%-30s ${GREEN}%-15s${NC}\n" "PM2: $app" "PASS"
    else
        printf "%-30s ${RED}%-15s${NC}\n" "PM2: $app" "FAIL"
        failed=1
    fi
done

if sudo systemctl is-active --quiet caddy; then
    printf "%-30s ${GREEN}%-15s${NC}\n" "Caddy Service" "PASS"
else
    printf "%-30s ${RED}%-15s${NC}\n" "Caddy Service" "FAIL"
    failed=1
fi

sleep 3
if curl -sSf "http://127.0.0.1:${DASHBOARD_PORT}" > /dev/null 2>&1; then
    printf "%-30s ${GREEN}%-15s${NC}\n" "Dashboard HTTP" "PASS"
else
    printf "%-30s ${RED}%-15s${NC}\n" "Dashboard HTTP" "FAIL"
    failed=1
fi

if [ "$failed" -eq 1 ]; then
    error "Verification failed. The deployment might be unstable."
fi
success "All systems verified."

step "Deployment Report"
END_TIME=$(date +%s)
echo -e "Status             : ${GREEN}SUCCESS${NC}"
echo -e "Dashboard URL      : ${CYAN}https://$DASHBOARD_DOMAIN${NC}"
echo -e "Execution Time     : ${BOLD}$((END_TIME - START_TIME)) seconds${NC}"
echo -e "────────────────────────────────────\n"

#!/bin/bash
# ==============================================================================
# Kyro Enterprise EC2 Setup Script (One-Time Provisioning)
# ==============================================================================
set -Eeuo pipefail

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
DASHBOARD_DOMAIN="${DASHBOARD_DOMAIN:-dashboard.kyro.app}"
PROXY_PORT="${PROXY_PORT:-8000}"
DASHBOARD_PORT="${DASHBOARD_PORT:-3000}"
RUNNER_DIR="${RUNNER_DIR:-/home/ubuntu/kyro-runners}"
SWAP_SIZE="${SWAP_SIZE:-4G}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"
REQUIRED_NODE_VERSION="${REQUIRED_NODE_VERSION:-20}"

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
    echo -e "${RED}[FATAL ERROR]${NC} Setup failed!"
    echo -e "  Function : ${BOLD}$func${NC}"
    echo -e "  Command  : ${BOLD}$cmd${NC}"
    echo -e "  Line     : ${BOLD}$line${NC}"
    echo -e "  Exit Code: ${BOLD}$code${NC}"
    echo -e "${RED}────────────────────────────────────${NC}\n"
}
trap 'error_handler ${LINENO} "$BASH_COMMAND" $?' ERR

command_exists() { command -v "$1" >/dev/null 2>&1; }
get_node_version() { command_exists node && node -v | cut -d'v' -f2 | cut -d'.' -f1 || echo "0"; }

# ------------------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------------------
step "Starting EC2 Server Provisioning"

# 1. Environment file
info "Configuring Environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        success "Created .env from .env.example. Please populate it with your secrets!"
    else
        warning "No .env.example found. You must manually create .env."
    fi
else
    success ".env file already exists."
fi

# 2. Base Utilities
info "Installing Base Utilities..."
sudo apt-get update -y > /dev/null
for pkg in git curl netcat-openbsd; do
    if ! command_exists "$pkg"; then
        sudo apt-get install -y "$pkg" > /dev/null
        success "$pkg installed."
    else
        success "$pkg is already installed."
    fi
done

# 3. Swapfile
info "Configuring Swap..."
if sudo swapon --show | grep -q "$SWAP_FILE"; then
    success "Swap is already active."
elif [ -f "$SWAP_FILE" ]; then
    sudo chmod 600 "$SWAP_FILE"
    sudo swapon "$SWAP_FILE"
    success "Existing swapfile activated."
else
    sudo fallocate -l "$SWAP_SIZE" "$SWAP_FILE"
    sudo chmod 600 "$SWAP_FILE"
    sudo mkswap "$SWAP_FILE" > /dev/null
    sudo swapon "$SWAP_FILE"
    if ! grep -q "$SWAP_FILE" /etc/fstab; then
        echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab > /dev/null
    fi
    success "Created and activated $SWAP_SIZE swapfile."
fi

# 4. Node.js
info "Checking Node.js..."
current_version=$(get_node_version)
if [ "$current_version" -lt "$REQUIRED_NODE_VERSION" ]; then
    curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x" | sudo -E bash - > /dev/null
    sudo apt-get install -y nodejs > /dev/null
    success "Node.js $(node -v) installed."
else
    success "Node.js $(node -v) is already installed."
fi

# 5. Docker
info "Checking Docker..."
if ! command_exists docker; then
    sudo apt-get install -y docker.io docker-compose-v2 > /dev/null
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER" || true
    success "Docker installed."
else
    success "Docker is already installed ($(sudo docker -v))."
fi

if ! sudo docker info >/dev/null 2>&1; then
    sudo systemctl start docker
    sudo docker info >/dev/null 2>&1 || error "Failed to start Docker daemon."
fi

# 6. PM2
info "Checking PM2..."
if ! command_exists pm2; then
    sudo npm install -g pm2 > /dev/null
    success "PM2 installed."
else
    success "PM2 is already installed ($(pm2 -v))."
fi

info "Configuring PM2 startup hook..."
sudo env PATH="$PATH:/usr/bin" "$(npm root -g)/pm2/bin/pm2" startup systemd -u "$USER" --hp "$HOME" > /dev/null 2>&1 || true

# 7. Caddy
info "Checking Caddy..."
if ! command_exists caddy; then
    sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https > /dev/null
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
    sudo apt-get update -y > /dev/null
    sudo apt-get install -y caddy > /dev/null
    success "Caddy installed."
else
    success "Caddy is already installed ($(caddy version | awk '{print $1}'))."
fi

info "Generating base Caddy configuration..."
CADDYFILE="/etc/caddy/Caddyfile"
TMP_FILE="/tmp/Caddyfile.base.tmp"

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
    sudo mv "$TMP_FILE" "$CADDYFILE"
    sudo chown root:root "$CADDYFILE"
    sudo systemctl reload caddy > /dev/null 2>&1 || true
    success "Initial Caddy configuration generated and validated."
else
    rm -f "$TMP_FILE"
    error "Failed to validate base Caddy configuration."
fi

# 8. Runner Directory
info "Configuring Runner Directory..."
if [ ! -d "$RUNNER_DIR" ]; then
    sudo mkdir -p "$RUNNER_DIR"
    sudo chown "$USER:$USER" "$RUNNER_DIR"
    sudo chmod 755 "$RUNNER_DIR"
    success "Runner directory ($RUNNER_DIR) created."
else
    success "Runner directory already exists."
fi

step "Provisioning Complete!"
echo -e "${BOLD}Installed Tools:${NC}"
echo -e " - Node.js : $(node -v)"
echo -e " - PM2     : $(pm2 -v)"
echo -e " - Docker  : $(sudo docker -v | awk '{print $3}' | tr -d ',')"
echo -e " - Caddy   : $(caddy version | awk '{print $1}')"
echo -e "\n${GREEN}The server is ready. You can now execute ./deploy.sh to release the application.${NC}"

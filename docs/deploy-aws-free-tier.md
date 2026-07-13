# Kyro PaaS - Complete EC2 Deployment Guide

This guide covers the end-to-end process for deploying Kyro (a Vercel-like Platform as a Service) to an AWS EC2 Ubuntu instance (like `m7i-flex.large`). It includes critical infrastructure setup such as memory swapfiles, wildcard DNS routing, and wildcard SSL certificates to ensure user deployments are automatically served securely.

---

## 1. Initial Server Setup & Dependencies

First, connect to your EC2 instance and run these commands to install the necessary tools: Node.js, PM2, Docker, Nginx, and Certbot.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -y -g pm2

# Install Docker & Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
# NOTE: To apply this immediately without logging out, run:
# newgrp docker
```

---

## 2. Setup Swapfile (CRITICAL)

To prevent Docker from running out of memory (Error 137) when building heavy apps like Next.js, create a 4GB swapfile.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. GitHub Authentication (SSH Key)

Generate an SSH key to allow your EC2 instance to clone your repository without a password.

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Press Enter to accept defaults. Then, display the public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

**Action Required:** Copy this key, go to your GitHub Settings -> SSH and GPG keys -> "New SSH key", and paste it there.

---

## 4. Clone & Prepare the Project

```bash
# Clone the repository
git clone git@github.com:adityashah2701/kyro.git
cd kyro

# Install all monorepo dependencies
npm install
```

Create your `.env` file in the root directory:

```bash
nano .env
```

_(Paste your environment variables inside. Make sure you set the following critical variables for production):_

- `BASE_DOMAIN=kyro.adityashah27.dev`
- `NEXT_PUBLIC_API_URL=https://kyro.adityashah27.dev`
- `RUNNER_DIRECTORY=/home/ubuntu/kyro-runners` _(Crucial: Prevents proxy deployments from extracting artifacts into the EC2 RAM disk `/tmp` which causes "Disk quota exceeded" errors)._

### Create Required Directories

Ensure the runner directory exists on the physical disk:

```bash
mkdir -p /home/ubuntu/kyro-runners
```

### Start Database Services

We use Docker for the background services (Redis, MinIO, PostgreSQL).

> [!WARNING]
> If you get a **"permission denied while trying to connect to the Docker daemon socket"** error, it means the `docker` group hasn't been applied to your current session yet. Run `newgrp docker` to apply it immediately, or prefix the command below with `sudo`.

```bash
docker compose -f docker-compose.yml -f docker-compose.freetier.yml up -d

# Push the database schema
cd apps/web && npx dotenv-cli -e ../../.env -- npx drizzle-kit push && cd .. && cd ..
```

---

## 5. Build and Start the PM2 Services

Build the Next.js Dashboard and the background worker.

```bash
npm run build -w @kyro/web
npm run build -w @kyro/worker

# Start all services using your ecosystem file
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 6. Main Dashboard & Wildcard Routing (Caddy)

We use **Caddy** instead of Nginx because Caddy natively supports **On-Demand TLS**, which is essential for a PaaS to automatically provision SSL certificates for custom domains (like `portfolio.com`) without manual intervention.

### Step 6A: Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Step 6B: Wildcard SSL Preparation

In your DNS provider (Spaceship), ensure you have:

1. **A Record** for `kyro` pointing to your EC2 IP.
2. **Wildcard A Record** for `*.kyro` pointing to your EC2 IP.

### Step 6C: Caddyfile Configuration

Open your Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace the entire file with this configuration:

```caddyfile
{
	email adityashah2701.personal@gmail.com

	on_demand_tls {
		ask http://127.0.0.1:3000/api/caddy/check-domain
	}
}

# Main Kyro Dashboard
kyro.adityashah27.dev {
	reverse_proxy 127.0.0.1:3000
}

# Preview Deployments & Custom Domains
https:// {
	tls {
		on_demand
	}

	reverse_proxy 127.0.0.1:8000
}
```

Restart Caddy to apply changes:

```bash
sudo systemctl restart caddy
```

---

## 7. Prevent Disk Space Issues (Logrotate)

PM2 logs can grow very large and quickly fill up the EC2 disk. To prevent this, install the provided logrotate script:

```bash
sudo bash scripts/free-tier/install-logrotate.sh
```

You are completely done. All deployments on Kyro will now have automatic HTTPS previews and custom domains!

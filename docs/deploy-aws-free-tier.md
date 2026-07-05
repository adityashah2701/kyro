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
# NOTE: You need to log out and log back in for the docker group to apply!

# Install Nginx & Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
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

_(Paste your environment variables inside, making sure `BASE_DOMAIN=kyro.adityashah27.dev` and `NEXT_PUBLIC_API_URL=https://kyro.adityashah27.dev` are set correctly)_

### Start Database Services

We use Docker for the background services (Redis, MinIO, PostgreSQL).

```bash
docker compose up -d

# Push the database schema
npx drizzle-kit push
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

## 6. Main Dashboard SSL (Nginx & Certbot)

First, ensure you have an `A Record` in your DNS provider (e.g., Spaceship) pointing `kyro.adityashah27.dev` to your EC2 IP.

Set up the basic Nginx configuration for your dashboard:

```bash
sudo nano /etc/nginx/sites-available/kyro
```

Paste this basic config:

```nginx
server {
    listen 80;
    server_name kyro.adityashah27.dev;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site and get the SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/kyro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Automatically get SSL and update Nginx for the dashboard
sudo certbot --nginx -d kyro.adityashah27.dev
```

---

## 7. Wildcard Subdomain Routing (For User Deployments)

To give every user deployment a secure URL like `https://project-hash.kyro.adityashah27.dev`, you need a wildcard SSL certificate.

### Step 7A: Get the Wildcard Certificate

Run the manual Certbot command:

```bash
sudo certbot certonly --manual --preferred-challenges=dns -d "*.kyro.adityashah27.dev"
```

**Important Workflow:**

1. Certbot will give you a random string.
2. Go to your DNS provider (Spaceship) and create a **TXT Record** with the host `_acme-challenge.kyro` and paste the random string.
3. Keep checking [Google Admin Toolbox](https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.kyro.adityashah27.dev). **Wait until the new string shows up.**
4. Once verified on Google, press **Enter** in your terminal.
5. Note the folder name Certbot prints at the end (e.g., `kyro.adityashah27.dev-0001`).

### Step 7B: Add Wildcard DNS Record

While in your DNS provider, create a **Wildcard A Record**:

- Type: `A Record`
- Host/Name: `*.kyro`
- Value/IP: `<Your EC2 Public IP Address>`

### Step 7C: Final Nginx Configuration

Overwrite your Nginx config to handle both the dashboard (port 3000) and the user deployments (kyro-proxy on port 8000).

```bash
sudo nano /etc/nginx/sites-available/kyro
```

Replace the entire file with this (make sure to replace `YOUR_CERT_FOLDER` with the folder name from Step 7A):

```nginx
server {
    server_name kyro.adityashah27.dev;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/kyro.adityashah27.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kyro.adityashah27.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = kyro.adityashah27.dev) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name kyro.adityashah27.dev;
    return 404;
}

# --- WILDCARD ROUTING FOR USER DEPLOYMENTS ---
server {
    listen 80;
    listen 443 ssl;
    server_name *.kyro.adityashah27.dev;

    # Replace YOUR_CERT_FOLDER (e.g., kyro.adityashah27.dev-0001)
    ssl_certificate /etc/letsencrypt/live/YOUR_CERT_FOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_CERT_FOLDER/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Apply the changes:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

You are completely done. All deployments on Kyro will now have automatic HTTPS previews!

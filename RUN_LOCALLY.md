# Run Kyro locally

Everything you have to do by hand, in order. Tested path: macOS + Docker Desktop.

## 0. Install once

| Tool | Why | Check |
|---|---|---|
| Node.js 20+ and npm | all three apps | `node -v` |
| Docker Desktop (running) | Postgres, Redis, RustFS, **and** the containers that build and run deployed sites | `docker ps` |
| `mprocs` (optional) | starts everything in one terminal | `brew install mprocs` |

Docker Desktop must be allowed to mount `/tmp` (the default). The worker builds in `/tmp/deployments` and the proxy runs server apps from `/tmp/kyro-runners`.

## 1. Install dependencies

```bash
npm install
```

Run this again after pulling changes. The lockfile changed (the proxy now depends on `@kyro/shared`, and the web app no longer depends on `minio`).

## 2. Create `.env` in the repo root

All three apps read this one file.

```bash
cp .env.example .env
```

Then edit these values:

| Variable | What to do |
|---|---|
| `BETTER_AUTH_SECRET` | Replace with your own: `openssl rand -base64 32`. The proxy needs it too (it signs the password-unlock cookie). |
| `ENCRYPTION_KEY` | **Required, not set in the example.** Must be 64 hex chars: `openssl rand -hex 32`. Web encrypts env vars with it and the worker decrypts them, so both must see the same value. |
| `BASE_DOMAIN` | Keep `localhost`. Sites are served at `<slug>.localhost:8000`. |
| `NEXT_PUBLIC_APP_URL` | Add `http://localhost:3000` (used by the route guard). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | **Required to log in** (GitHub is the only login method). See step 3. |
| `S3_*` | Leave the defaults (`kyro_admin` / `kyro_password`). They match the RustFS container. The old `MINIO_*` names still work if your `.env` has them. |

The `DATABASE_URL`, `REDIS_*` and storage defaults already point at the Docker services below.

## 3. Create a GitHub OAuth app (for login)

GitHub → Settings → Developer settings → OAuth Apps → New:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Copy the Client ID and a new Client Secret into `.env`.

## 4. (Optional) Create a GitHub App, to deploy real or private repos

Skip this to just look around. Without it, Kyro uses **mock repositories** and cloning them will fail unless those repos exist on GitHub.

GitHub → Settings → Developer settings → GitHub Apps → New:

- Permissions: Repository → Contents: Read-only, Metadata: Read-only. Subscribe to the **Push** event.
- Webhook URL: your public tunnel URL + `/api/github/webhook` (see step 8).
- Webhook secret: any random string. Put the same string in `.env` as `GITHUB_APP_WEBHOOK_SECRET`.
- Generate a private key, then base64 it for `.env`: `base64 -i key.pem | tr -d '\n'` → `GITHUB_APP_PRIVATE_KEY`.
- Put the App ID in `GITHUB_APP_ID`. Set `GITHUB_APP_INSTALLATION_URL` to the App's install page.
- Install the App on the account or repos you want to deploy.

Without `GITHUB_APP_WEBHOOK_SECRET`, the webhook returns 503 (by design). The manual "Deploy" button does not need it.

## 5. Start the infrastructure

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This starts Postgres (5432), Redis (6379) and RustFS (S3 on 9000, console on 9001). Check:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
curl -i http://127.0.0.1:9000/health        # expect 200
```

The RustFS console is at http://localhost:9001 (login `kyro_admin` / `kyro_password`). The bucket `kyro-deployments` is created automatically by the worker on first start.

## 6. Create the database tables

```bash
cd apps/web
npx dotenv-cli -e ../../.env -- npx drizzle-kit push
cd ../..
```

Run again whenever `packages/database/src/schema.ts` changes.

## 7. Start the apps

**Option A — one command** (needs `mprocs`):

```bash
npm run dev
```

Open `mprocs.yaml` first. It also starts `ngrok` with a hard-coded URL that belongs to the original author. Either delete the `ngrok` block or replace the URL with yours, otherwise that process just fails (it does not stop the others).

**Option B — three terminals** (run from the repo root):

```bash
npm run dev -w @kyro/web      # http://localhost:3000
npm run dev -w @kyro/worker   # build worker, no port
npm run dev -w @kyro/proxy    # http://localhost:8000
```

## 8. (Optional) Receive GitHub pushes locally

GitHub can't reach `localhost`. Run a tunnel to the web app (`ngrok http 3000`), then put `https://<your-tunnel>/api/github/webhook` into the GitHub App's webhook URL.

## 9. Use it

1. Open http://localhost:3000 and log in with GitHub.
2. Connect GitHub (Settings or the Projects page), create a project, pick a repo and click **Deploy**.
3. Watch the build logs. The first build is slow because Docker pulls `node:<version>-alpine`.
4. When it succeeds, open `http://<project-slug>.localhost:8000`. Browsers resolve `*.localhost` to your machine automatically.

Static sites are served straight from storage. Server apps (Next.js SSR and similar) start in a container on the first request, which takes a few seconds, and stop after 15 idle minutes.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose` can't pull storage | You're on an old file that still says `minio/minio`. Pull the latest `docker-compose.yml` (it uses `rustfs/rustfs:1.0.1`). |
| Web crashes at boot with "Invalid environment variables" | A required var is missing from `.env` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `REDIS_*`). |
| "ENCRYPTION_KEY environment variable must be a 64-character hex string" | Step 2: `openssl rand -hex 32`. |
| Can't log in / GitHub error page | The OAuth callback URL must be exactly `http://localhost:3000/api/auth/callback/github`. |
| Build fails immediately with a Docker error | Docker Desktop isn't running, or `/tmp` isn't shared with it. |
| Site shows 404 "Deployment not found or inactive" | The deployment must be `success` **and** active (default branch). Check the host is `<slug>.localhost:8000`, not port 3000. |
| Password-protected site returns 500 | `BETTER_AUTH_SECRET` is missing from the `.env` the proxy loads. |
| Webhook returns 503 or 401 | 503: `GITHUB_APP_WEBHOOK_SECRET` isn't set. 401: it differs from the secret in the GitHub App. |
| Custom domain stays "failed" | Add the TXT record shown in the dashboard (`_kyro-challenge...`). A CNAME alone is not accepted. Custom domains can't really be tested on localhost. |
| Port already in use | Something else holds 5432, 6379, 9000/9001, 3000 or 8000. Stop it or change the port mapping. |

## Stop and reset

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down        # stop, keep data
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v     # stop and delete all data
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kyro is a self-hosted deployment platform (Vercel/Netlify-style): connect a GitHub repo, and Kyro clones it, detects the framework, builds it inside an isolated Docker container, stores the static artifact in MinIO, and serves it on a subdomain via a reverse proxy. Custom domains, encrypted environment variables, and per-deployment activation are supported.

## Monorepo layout

npm workspaces (`apps/*`, `packages/*`). Three runnable apps plus three shared libraries:

- **`apps/web`** (`@kyro/web`) — Next.js 16 (App Router, React 19) dashboard + API. Owns auth, all user-facing UI, server actions, and enqueues deployment jobs.
- **`apps/worker`** (`@kyro/worker`) — standalone Node/tsx BullMQ consumer. Runs the actual build pipeline (clone → detect → docker build → collect artifact → upload). No HTTP server.
- **`apps/proxy`** (`@kyro/proxy`) — plain Express server that resolves an incoming `Host` header to a deployment and streams files out of MinIO. This is what actually serves deployed sites.
- **`packages/database`** (`@kyro/database`) — Drizzle ORM schema + `db` client. `src/schema.ts` is the single source of truth for all tables; imported by all three apps.
- **`packages/storage`** (`@kyro/storage`) — `MinioStorageProvider` (upload/download/stream). Used by worker (upload) and proxy (download).
- **`packages/shared`** (`@kyro/shared`) — shared TypeScript types only (`DeploymentStatus`, `QueueJobData`). Keep the `DeploymentStatus` union here in sync with the `status` comment in the `deployment` table.

The three apps communicate **only** through Postgres (shared schema) and the Redis/BullMQ `"deployments"` queue — there are no direct HTTP calls between them.

## Commands

```bash
npm run dev            # starts everything via mprocs (see mprocs.yaml): docker, web, worker, proxy, ngrok
docker compose up      # Postgres (5432), Redis (6379), MinIO (9000 / console 9001) — required for anything to work
```

Per-app (run from repo root):

```bash
npm run dev   -w @kyro/web       # next dev, loads ../../.env via dotenv-cli
npm run dev   -w @kyro/worker    # tsx watch
npm run dev   -w @kyro/proxy     # tsx watch
npm run build -w @kyro/web       # next build
npm run lint  -w @kyro/web       # eslint (Next config)
npm run lint  -w @kyro/worker    # NOTE: this is `tsc --noEmit`, i.e. typecheck, not eslint
```

Database (Drizzle) — run inside `apps/web`, which holds `drizzle.config.ts` (schema path points back to `packages/database`):

```bash
cd apps/web && npx dotenv-cli -e ../../.env -- npx drizzle-kit studio     # GUI (also: mprocs `drizzle-studio` proc, autostart off)
cd apps/web && npx dotenv-cli -e ../../.env -- npx drizzle-kit push       # push schema changes
cd apps/web && npx dotenv-cli -e ../../.env -- npx drizzle-kit generate   # generate migration SQL
```

There is no test suite. Pre-commit runs `lint-staged` (husky): ESLint `--fix` on `apps/web` TS/TSX, Prettier on everything else.

## Environment

A single root `.env` is loaded by every app (`dotenv -e ../../.env` / `DOTENV_CONFIG_PATH=../../.env`). `.env.example` documents most keys. `apps/web/src/config/env.ts` validates a subset with Zod at boot and **throws** on missing vars — add new required web vars there.

Not all consumed vars are in `.env.example` / `config/env.ts`. In particular `ENCRYPTION_KEY` (64-char hex = 32 bytes) is required by both web and worker for env-var encryption but is not in the example file. When adding env usage, check whether it needs to be added to the Zod schema.

## Deployment pipeline (the core flow)

1. **Trigger** — `triggerDeploymentAction` (server action, `apps/web/src/features/deployment/actions.ts`) → `deployment.service.ts` inserts a `deployment` row (`status: "queued"`) and calls `queueDeployment`, which adds a `{ deploymentId }` job to the BullMQ `"deployments"` queue.
2. **Worker** (`apps/worker/src/processor.ts`) picks up the job and drives the whole build, writing progress back to the `deployment.status` column at each stage (`initializing → cloning → building → uploading → success`/`failed`). Stages:
   - `GitService` clones the repo (uses GitHub App installation token for private repos).
   - `DetectorService` inspects `package.json` / lockfiles to determine framework, package manager, node version, install/build commands, and output dir.
   - Decrypts the project's env vars for the target environment (`production` for default branch, else `preview`) and writes a `.env` into the workspace.
   - `DockerService` runs install + build inside `node:<version>-alpine` with CPU/memory caps, via a generated `.kyro-build.sh`.
   - `ArtifactService` collects the output dir, computes a checksum, and uploads to MinIO; sets `artifactLocation`, `previewUrl`, `checksum`, and marks the deployment `active` if it's the default branch (deactivating siblings).
   - `finally` always removes the temp workspace.
3. **Serving** — `apps/proxy` `RoutingService.resolveHost` maps a hostname to an artifact: custom `domain` (if `verified`) → exact `previewUrl` match → project slug's `active` deployment. The proxy streams objects from MinIO with SPA (`index.html`) and `.html` extension fallbacks.

Deployment status is defined in two places that must agree: the `DeploymentStatus` union in `packages/shared/index.ts` and the inline comment on `deployment.status` in the schema.

## Web app conventions

- **Feature-first structure** under `apps/web/src/features/<domain>/` (deployment, environment, domains, github, projects, auth). A feature typically contains `actions.ts` (`"use server"` server actions — the primary mutation entry points), `services/` (DB/business logic), `schemas/` (Zod), and `components/`. Prefer adding logic to a feature folder over `src/app`.
- **Routes**: `src/app/(dashboard)/...` for authenticated pages, `src/app/api/...` for route handlers. Most mutations go through server actions, not API routes.
- **Auth**: Better Auth with the Drizzle adapter. Server-side, import the instance from `@/lib/auth` and call `auth.api.getSession({ headers: await headers() })`. Note `src/server/auth.ts` is a second, older Better Auth config — `@/lib/auth` is the one wired into the actions/routes. Client-side use `@/features/auth/lib/auth-client`.
- **Env-var encryption**: AES-256-GCM, format `iv:authTag:encryptedData` (all hex). Web has both `encrypt`/`decrypt` (`features/environment/crypto/encryption.ts`); worker has decrypt-only (`apps/worker/src/crypto/encryption.ts`). Both read `ENCRYPTION_KEY` — keep the two implementations in sync.
- `@/` is the `apps/web/src` alias. Cross-package imports use the `@kyro/*` names.

## Notes

- `packages/database`, `@kyro/storage`, and `@kyro/shared` are consumed as raw TypeScript source (their `main`/`exports` point at `.ts`). `apps/web` transpiles `@kyro/database` and `@kyro/shared` via `next.config.ts` `transpilePackages`; the worker/proxy run them directly through tsx.
- `docs/step-*.md` are historical build-log specs (one per feature increment), not current API docs — useful for intent/history, but verify against code.

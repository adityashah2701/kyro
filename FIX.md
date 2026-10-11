# FIX.md — Kyro audit findings

**What this repo does:** Kyro is a self-hosted Vercel-style host. A web dashboard (`apps/web`) queues builds. A worker (`apps/worker`) clones the repo and builds it in Docker. A proxy (`apps/proxy`) serves the result from MinIO, or runs it in a container if it is a server app.

**Load assumed:** A hosting platform where strangers sign up and deploy their own repos, on one small server (free tier, about 1 GB RAM, 20 GB disk).

Audit was read-only. Nothing was run or changed. Findings are numbered so you can say "fix 2 and 5".

---

## Must fix

### 1. Anyone logged in can read, change and delete another project's secrets
`apps/web/src/features/environment/actions.ts:L48-95`
- **What this is:** The server actions that add, edit, delete and reveal environment variables.
- **Problem:** They check that you are logged in, never that the project is yours. `revealVariableAction(id, projectId)` returns the decrypted value. Project IDs are public, because preview URLs look like `<projectId>-<hash>.<domain>`.
- **Fix:** Look the project up with `userId = session.user.id` first, as `analytics/actions.ts:authorizeProject` already does. Share that one helper across env, domains and deployments.
- **If we skip it:** Any user can steal every API key and database password stored in Kyro.

### 2. Same missing owner check on domains, and weak DNS proof
`apps/web/src/features/domains/actions.ts`, `services/dns.service.ts`
- **What this is:** Add, verify, remove and set-primary actions for custom domains.
- **Problem:** There is no ownership check. A user can delete a victim's domain or attach their own domain to the victim's project. The DNS proof is also weak. `dns.service.ts` accepts any TXT record containing `kyro-verify=true` (the same for everyone) or any CNAME to `cname.kyro.dev`. A dangling `blog.victim.com CNAME cname.kyro.dev` can be claimed by anyone. Any hostname ending in `.test` is auto-verified.
- **Fix:** Add the shared owner check. Give each domain a random token to put in a TXT record, and compare against it. Drop the `.test` bypass outside dev.
- **If we skip it:** Domain takeover and serving content on someone else's domain.

### 3. Anyone logged in can trigger a deployment for any project
`apps/web/src/features/deployment/actions.ts:L8`, `services/deployment.service.ts:createDeployment`
- **What this is:** The "Deploy" button's server action.
- **Problem:** `createDeployment` never checks the project owner. The build uses the victim's env vars and, on the default branch, replaces their live site. The deployment row belongs to the attacker, so the attacker can read its logs.
- **Fix:** Use the shared owner check before creating the row.
- **If we skip it:** Strangers can burn your build quota and replace live sites.

### 4. GitHub webhook accepts unsigned requests
`apps/web/src/app/api/github/webhook/route.ts:L15-25`
- **What this is:** The endpoint GitHub calls on every push.
- **Problem:** The signature is only checked `if (secret && signature)`. Send no signature header and the check is skipped. The code reads `GITHUB_WEBHOOK_SECRET`, but `.env.example` defines `GITHUB_APP_WEBHOOK_SECRET`, so a user following the example has no secret at all. The comparison is also not constant-time.
- **Fix:** Return 401 if the secret or signature is missing. Compare with `crypto.timingSafeEqual`. Make the env name match, and add it to the boot check.
- **If we skip it:** Anyone who knows a repo ID can force deploys with fake commit data.

### 5. Static sites with output dir `.` publish `.env` and `.git/config`
`apps/worker/src/services/artifact.service.ts:L91,138`, `detector.service.ts:L157`
- **What this is:** A repo with a root `index.html` and no framework is detected as "Static HTML" with output directory `.`. A user can also set `.` manually.
- **Problem:** `uploadDirectory` uploads the whole workspace. That includes the decrypted `.env` the worker just wrote, `.kyro-build.sh`, and `.git/config`, which holds the GitHub installation token for private repos. The proxy serves any object, so `/.env` is public.
- **Fix:** Skip dotfiles (`.env`, `.git`, `.kyro-build.sh`) in `uploadDirectory`, or copy only the output into a clean folder first. Delete `.git` after cloning.
- **If we skip it:** All env vars and the GitHub token are readable by anyone.

### 6. Path traversal in the proxy can read other deployments' files
`apps/proxy/src/index.ts:L337-341`
- **What this is:** The proxy builds the storage key with `path.posix.join(artifactLocation, req.path)`.
- **Problem:** `req.path` is not cleaned. `curl --path-as-is host/../<other-deployment-id>/__server_bundle.tgz` leaves the folder. `__server_bundle.tgz` contains `.env`. It also bypasses another project's password page.
- **Fix:** After `join`, reject the request unless the key starts with `artifactLocation + "/"`. Do this on all three fallback paths.
- **If we skip it:** Cross-tenant file and secret reads, given a guessable or leaked deployment ID.

### 7. Password protection can be bypassed and stores the password in plain text
`apps/proxy/src/index.ts:L133-139,223-231`, `apps/proxy/src/services/routing.service.ts`
- **What this is:** The "password protected site" feature.
- **Problem:** The cookie is `kyro_auth_<projectId>=true`. Anyone can set it by hand, and the project ID is public. The password is stored as plain text and compared with `===`. There is no rate limit, and the cookie has no `Secure` flag.
- **Fix:** Store a hash (`crypto.scrypt`). On success, set a cookie signed with HMAC (project ID plus expiry) and verify it. Add `timingSafeEqual` and a small per-IP attempt limit.
- **If we skip it:** The feature gives a false sense of privacy.

### 8. Anyone can claim a GitHub App installation they don't own, and link arbitrary repos
`apps/web/src/features/github/actions.ts:L16,L157`, `apps/web/src/app/(dashboard)/settings/page.tsx:L45`
- **What this is:** `connectGitHub(installationId)` runs on a query-string value during page render. `linkRepositoryToProject` takes the whole `repo` object from the browser.
- **Problem:** Nothing proves the logged-in user owns that installation. Installation IDs are sequential numbers. Claim a victim's before they do, and `fetchRepositories` lists their private repos. Deploy one with a build command that prints files to the log, and you have their source. The client-supplied `clone_url` and repo ID are never checked against GitHub, so someone can also steal a victim's webhook (`findFirst` on `repositoryId`).
- **Fix:** Verify with the user's own GitHub token (`GET /user/installations`, which better-auth already stores). Re-fetch the repo from GitHub inside `linkRepositoryToProject` instead of trusting the browser. Make `connectGitHub` a POST action, not a page load.
- **If we skip it:** Private source code theft.

### 9. A build with no time limit blocks the whole queue
`apps/worker/src/services/docker.service.ts:L146`, `apps/worker/src/index.ts:L22`
- **What this is:** The worker runs one build at a time (`WORKER_CONCURRENCY=1`).
- **Problem:** The Docker process has no timeout. A build script with `sleep infinity` or an install that hangs stops every deployment forever. The `buildTimeout` setting (default 45) is saved in the DB and shown in the UI, but nothing reads it. `buildOutput` also grows in memory without limit.
- **Fix:** Wrap the run in a timer using `project.buildTimeout` minutes: `docker rm -f` the container, then reject. Cap `buildOutput`.
- **If we skip it:** One bad or malicious repo takes the platform down.

### 10. "Cancel" doesn't stop the build, and the build then overwrites the cancel
`apps/web/src/features/deployment/services/deployment.service.ts:L57-85`, `apps/worker/src/processor.ts:L32-42`
- **What this is:** Cancel sets `status = "cancelled"` in the DB only.
- **Problem:** The worker keeps going. `updateStatus` overwrites the status unconditionally, so a "cancelled" deployment later becomes `success` and goes live. A cancelled job still in the queue also still runs.
- **Fix:** In `updateStatus`, add `WHERE status <> 'cancelled'`. In the processor, check for `cancelled` between stages and stop. For a queued job, remove it from BullMQ using the deployment ID as the job ID.
- **If we skip it:** Users can't stop a bad deploy from going live.

---

## Should fix

### 11. Going live is not atomic
`apps/worker/src/processor.ts:L231-260`, `apps/web/src/app/api/deployments/[deploymentId]/activate/route.ts:L37-46`
- **What this is:** Make the new deployment active and the others inactive.
- **Problem:** It runs as two or three separate writes. Between them, the project has no active deployment, so the site returns 404. If the second write fails, the site stays down. Two simultaneous deploys can both end up active.
- **Fix:** Put the writes in one `db.transaction`, and add a partial unique index (`projectId` where `active`).
- **If we skip it:** Short outages on every deploy, and a stuck state after any error.

### 12. The proxy does 2–4 DB queries per file, plus an analytics insert per file
`apps/proxy/src/services/routing.service.ts`, `apps/proxy/src/index.ts:L70-103`
- **What this is:** Every request, including each image and script, resolves the host in Postgres. If analytics is on, it also inserts a row.
- **Problem:** A normal page with 30 assets is 100+ queries and 30 rows. Postgres is capped at 30 connections (`docker-compose.yml`), and `analyticsEvent` is never pruned. The dashboard queries have no index on `(projectId, timestamp)`.
- **Fix:** Cache `resolveHost` results in a `Map` for about 10 seconds. Log only HTML/SSR responses, or batch inserts. Add the index and a 30-day delete job.
- **If we skip it:** The proxy falls over under modest traffic, and the DB fills up.

### 13. A storage error mid-download crashes the proxy
`apps/proxy/src/index.ts:L375`
- **What this is:** `result.stream.pipe(res)` streams the file to the visitor.
- **Problem:** There is no `error` handler on the stream. If MinIO drops mid-file, Node raises an unhandled error and the process exits. PM2 restarts it, but every in-flight request dies. If the visitor disconnects, the MinIO stream is also never destroyed.
- **Fix:** Use `stream.pipeline(result.stream, res, () => {})`, which handles both cases.
- **If we skip it:** A flaky storage moment becomes a full proxy restart.

### 14. Artifacts are never deleted
`packages/storage/src/providers/minio.ts`, `apps/web/src/features/projects/actions.ts:deleteProject`
- **What this is:** Each deploy uploads a full copy to MinIO, and server apps upload a tarball with `node_modules` (hundreds of MB).
- **Problem:** There is no delete method anywhere. Deleting a project or a deployment leaves the objects, and runner folders and containers remain too. On the 20 GB free-tier disk this runs out within a few dozen deploys.
- **Fix:** Add `removeObjects(prefix)` to the storage provider. Call it on project delete, and keep only the last N deployments per project.
- **If we skip it:** The disk fills and everything stops.

### 15. Caddy issues TLS certificates for domains that are not verified
`apps/web/src/app/api/caddy/check-domain/route.ts:L19-26`
- **What this is:** The "ask" endpoint Caddy calls before getting a Let's Encrypt certificate.
- **Problem:** It returns 200 if the hostname exists in the table at all, including `pending`. Since adding a domain needs no proof (finding 2), a user can add many random hostnames and exhaust Let's Encrypt rate limits, which blocks real domains.
- **Fix:** Add `verificationStatus = 'verified'` to the query.
- **If we skip it:** Certificate quota abuse.

### 16. Build and run containers have more access than they need
`apps/worker/src/services/docker.service.ts:L129-144`, `apps/proxy/src/services/runner.service.ts:L278-306`
- **What this is:** Strangers' code runs in Docker on the same host.
- **Problem:** They run as root on the default bridge network. There is no `--pids-limit`, no `--cap-drop=ALL`, and no `no-new-privileges`. The build container can read `.env` (needed) and the `.git/config` token. Root-owned files are why the worker falls back to `sudo rm -rf` (`processor.ts:L95,307`). Where infra ports are published on all interfaces (`docker-compose.dev.yml`) with default passwords, hostile code can reach Postgres, Redis and MinIO. The runner has no CPU limit.
- **Fix:** Add `--cap-drop=ALL --security-opt no-new-privileges --pids-limit=512 --cpus` to both. Run as `--user node` or `chown` after the build, so `sudo` goes away. Strip the token from `.git/config` after cloning.
- **If we skip it:** One malicious repo can compromise the host or other tenants.

### 17. Deployment numbers can repeat
`apps/web/src/features/deployment/services/deployment.service.ts:L23-26`, `apps/web/src/app/api/github/webhook/route.ts:L61-64`
- **What this is:** The number is `rows.length + 1`, computed after loading every deployment of the project.
- **Problem:** Two pushes at once get the same number. It also loads the whole history just to count it.
- **Fix:** Use a unique `(projectId, deploymentNumber)` constraint and `select max(...)`, retrying on conflict.
- **If we skip it:** Duplicate "#12" entries and a slower query as history grows.

### 18. No tests anywhere, on the riskiest code
- **What this is:** The repo has no test files at all.
- **Problem:** Webhook signature check, path join in the proxy, owner checks, and domain routing are all code where one wrong line is a security hole. Nothing would catch a regression.
- **Fix:** Start with four small tests: webhook with no signature → 401. `GET /../x` → 404. Env reveal by a different user → error. `resolveHost` for custom, preview and slug hosts.
- **If we skip it:** The fixes above can silently come back.

### 19. Dead and fake code
`apps/web/src/server/*`, `apps/worker/src/services/artifact.service.ts:L120`, `apps/proxy/src/services/routing.service.ts`, `apps/proxy/src/index.ts`
- **What this is:** Code that exists but does nothing useful.
- **Problem:**
  - `server/socket.ts`, `server/queue.ts` and `server/auth.ts` are imported by nothing (checked with grep). That is about 70 lines plus the `socket.io` dependency.
  - `checksum` is `randomBytes(16)`, not a hash of the content, even though the column and docs call it a checksum.
  - `rootDirectory` is saved and shown in the wizard but the worker never uses it, so monorepo projects build the wrong folder.
  - `routing.service.ts` builds the same 9-field object three times.
  - The MinIO client config is copy-pasted in three files (proxy index, runner, artifact service).
  - About 130 lines of HTML for the maintenance and password pages sit inside `proxy/index.ts`.
- **Fix:** Delete the dead files and `socket.io` (check `socket.io-client` too). Hash the output for a real checksum, or drop the column. Honor `rootDirectory` in the worker's clone and build path, or remove the field. Add a `toRoute(deployment, project)` helper in the router. Move the HTML into a `pages.ts`.
- **If we skip it:** Misleading UI settings, plus code to read and maintain that never runs.

---

## Nice to have

### 20. Default secret in `.env.example`
`.env.example:L7`
- **What this is:** The example file has a real-looking `BETTER_AUTH_SECRET`.
- **Problem:** Anyone who copies it to production uses a publicly known secret, so sessions can be forged.
- **Fix:** Replace it with a placeholder. Add `ENCRYPTION_KEY`, `BASE_DOMAIN` and the webhook secret to the Zod boot check in `apps/web/src/config/env.ts`.
- **If we skip it:** Easy to deploy with a known key.

About 5 smaller items were left out: Host header case in `resolveHost`, the per-navigation self-fetch in `apps/web/src/proxy.ts`, the log-stream route not closing cleanly on a Redis error, `streamLog` errors swallowed in `processor.ts`, and the same plain-text/HTML-in-proxy duplication.

---

## Verdict
Fix 1, 2, 3, 5 and 6 first. They are missing owner checks and file exposure, each a few lines. Then 4, 8 and 9. Do not put this in front of real users until those are done.

**Lean:** -~150 lines, -1 to -2 dependencies possible (`socket.io` for sure, `socket.io-client` unchecked).

## Not checked
Nothing was run (no build, lint or `tsc`). Not read: UI components, `github-client.ts`, better-auth's behavior, the Caddy config (not in the repo), `scripts/setup.sh`, `docs/`, the Drizzle migrations, dependency CVEs. Findings 1–3 depend on the dashboard pages not having their own checks, and that was only confirmed for the action files.

## Suggested edits to `CLAUDE.md` (from `/init`, not applied)
- It says the proxy only streams MinIO files, but `RunnerService` also runs SSR builds in Docker from a `__server_bundle.tgz`.
- It lists statuses without `installing` and `deploying`.
- It says `ArtifactService` computes a checksum, but the value is random.
- Name the `GITHUB_WEBHOOK_SECRET` vs `GITHUB_APP_WEBHOOK_SECRET` mismatch.

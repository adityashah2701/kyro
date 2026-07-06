import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import { createWriteStream } from "fs";
import * as http from "http";
import { MinioStorageProvider } from "@kyro/storage";

/** Must match SERVER_BUNDLE_NAME in the worker's artifact.service.ts. */
const SERVER_BUNDLE_NAME = "__server_bundle.tgz";

// Docker Desktop shares /tmp by default; /var/folders (os.tmpdir on macOS) is
// not guaranteed to be mountable, so we keep runner workdirs under /tmp.
const RUNNER_ROOT = process.env.RUNNER_DIRECTORY || "/tmp/kyro-runners";

// Free-Tier guardrails. A running SSR container holds ~80-150 MB; on a 1 GB box
// we must both cap each container's RAM and bound how many stay warm, evicting
// the least-recently-used and reaping idle ones so they don't accumulate.
const RUNNER_MEMORY = process.env.RUNNER_MEMORY; // e.g. "384m" (unset = no cap)
const RUNNER_MEMORY_SWAP = process.env.RUNNER_MEMORY_SWAP; // e.g. "1g"
const MAX_INSTANCES = parseInt(process.env.RUNNER_MAX_INSTANCES || "3", 10);
const IDLE_TIMEOUT_MS = parseInt(
  process.env.RUNNER_IDLE_TIMEOUT_MS || String(15 * 60 * 1000),
  10,
);
const REAP_INTERVAL_MS = 60 * 1000;

interface RunningInstance {
  port: number;
  process: ChildProcess;
  containerName: string;
  lastAccessed: number;
}

export class RunnerService {
  private static instances = new Map<string, RunningInstance>();
  private static reaperStarted = false;

  private static async getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const srv = http.createServer();
      srv.listen(0, () => {
        const port = (srv.address() as any).port;
        srv.close((err) => {
          if (err) reject(err);
          else resolve(port);
        });
      });
      srv.on("error", reject);
    });
  }

  private static storage = new MinioStorageProvider(
    {
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "kyro_admin",
      secretKey: process.env.MINIO_SECRET_KEY || "kyro_password",
    },
    process.env.MINIO_BUCKET || "kyro-deployments",
  );

  /** Runs a command to completion, resolving on exit 0. */
  private static exec(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args);
      let stderr = "";
      child.stderr?.on("data", (d) => (stderr += d.toString()));
      child.on("error", reject);
      child.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${cmd} exited with ${code}: ${stderr.trim()}`)),
      );
    });
  }

  /** Stops a running instance: kill container, drop from map, clean workdir. */
  private static async stopInstance(deploymentId: string): Promise<void> {
    const inst = this.instances.get(deploymentId);
    if (!inst) return;
    this.instances.delete(deploymentId);
    console.log(`[Runner] Stopping deployment ${deploymentId}...`);
    await this.exec("docker", ["rm", "-f", inst.containerName]).catch(() => {});
    inst.process.kill();
    await fs
      .rm(path.join(RUNNER_ROOT, deploymentId), {
        recursive: true,
        force: true,
      })
      .catch(() => {});
  }

  /** Periodically stops instances that haven't been accessed recently. */
  private static startReaper(): void {
    if (this.reaperStarted) return;
    this.reaperStarted = true;
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [id, inst] of this.instances) {
        if (now - inst.lastAccessed > IDLE_TIMEOUT_MS) {
          console.log(`[Runner] Reaping idle deployment ${id}`);
          void this.stopInstance(id);
        }
      }
    }, REAP_INTERVAL_MS);
    // Don't keep the event loop alive just for the reaper.
    timer.unref?.();
  }

  /** Evicts the least-recently-used instance while at/over the cap. */
  private static async evictIfNeeded(): Promise<void> {
    while (this.instances.size >= MAX_INSTANCES) {
      let lruId: string | null = null;
      let oldest = Infinity;
      for (const [id, inst] of this.instances) {
        if (inst.lastAccessed < oldest) {
          oldest = inst.lastAccessed;
          lruId = id;
        }
      }
      if (!lruId) break;
      console.log(`[Runner] Instance cap reached, evicting LRU ${lruId}`);
      await this.stopInstance(lruId);
    }
  }

  /**
   * Polls a port with real HTTP requests until the server returns a response,
   * or times out / aborts. A raw TCP check is not enough here: Docker's port
   * publishing accepts TCP connections on the host port immediately, before the
   * containerized app has bound inside — so we must wait for an actual HTTP
   * reply (any status code) to know the app is truly serving.
   */
  private static waitForHttp(
    port: number,
    timeoutMs = 60000,
    intervalMs = 300,
    isAborted: () => boolean = () => false,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;

      const attempt = () => {
        // Bail out immediately if the container already died — no point waiting
        // the full timeout for a port that will never serve.
        if (isAborted()) {
          return resolve(false);
        }
        if (Date.now() >= deadline) {
          return resolve(false);
        }

        let settled = false;
        const retry = () => {
          if (!settled) {
            settled = true;
            setTimeout(attempt, intervalMs);
          }
        };

        const req = http.get(
          { host: "127.0.0.1", port, path: "/", timeout: 5000 },
          (res) => {
            res.resume(); // drain the response so the socket can close
            if (!settled) {
              settled = true;
              resolve(true);
            }
          },
        );
        req.on("error", retry);
        req.on("timeout", () => {
          req.destroy();
          retry();
        });
      };

      attempt();
    });
  }

  /**
   * Gets a running instance for the given deployment. If not already running,
   * downloads the server bundle, extracts it, launches it inside a Linux
   * container (matching the environment it was built in), and returns the port
   * the proxy should forward traffic to.
   */
  public static async getInstance(
    deploymentId: string,
    artifactLocation: string,
    startCommand: string,
    nodeVersion = "20",
  ): Promise<number> {
    this.startReaper();

    const existing = this.instances.get(deploymentId);
    if (existing) {
      existing.lastAccessed = Date.now();
      return existing.port;
    }

    // Bound concurrent warm servers so they can't exhaust host RAM.
    await this.evictIfNeeded();

    console.log(`[Runner] Cold starting deployment ${deploymentId}...`);

    const runDir = path.join(RUNNER_ROOT, deploymentId);
    const appDir = path.join(runDir, "app");

    // Clean any stale workdir/container from a previous run.
    await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(appDir, { recursive: true });

    // 1. Download the single server bundle (one object instead of thousands).
    const bundleKey = path.posix.join(artifactLocation, SERVER_BUNDLE_NAME);
    const download = await this.storage.downloadStream(bundleKey);
    if (!download) {
      throw new Error(
        `Server bundle not found at "${bundleKey}". This deployment predates the ` +
          `bundled-artifact format — re-deploy the project to generate it.`,
      );
    }

    const tarPath = path.join(runDir, "bundle.tgz");
    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(tarPath);
      download.stream.on("error", reject);
      ws.on("error", reject);
      ws.on("finish", () => resolve());
      download.stream.pipe(ws);
    });

    // 2. Extract it.
    console.log(`[Runner] Extracting bundle for ${deploymentId}...`);
    await this.exec("tar", ["-xzf", tarPath, "-C", appDir]);
    await fs.rm(tarPath, { force: true }).catch(() => {});

    // 3. Assign a free port and launch the app inside a container.
    const port = await this.getFreePort();
    const containerName = `kyro-run-${deploymentId}`;
    const image = `node:${nodeVersion}-alpine`;

    // Remove any orphaned container with the same name before starting.
    await this.exec("docker", ["rm", "-f", containerName]).catch(() => {});

    console.log(
      `[Runner] Running '${startCommand}' in ${image} on port ${port}...`,
    );

    const dockerArgs = [
      "run",
      "--rm",
      "--name",
      containerName,
      "-p",
      `127.0.0.1:${port}:${port}`,
      // Free-Tier RAM guardrails (no-op unless RUNNER_MEMORY is set).
      ...(RUNNER_MEMORY ? [`--memory=${RUNNER_MEMORY}`] : []),
      ...(RUNNER_MEMORY_SWAP ? [`--memory-swap=${RUNNER_MEMORY_SWAP}`] : []),
      "-e",
      `PORT=${port}`,
      "-e",
      "NODE_ENV=production",
      // Ensure servers that read HOST/HOSTNAME bind on all interfaces so the
      // published port is reachable from the host.
      "-e",
      "HOSTNAME=0.0.0.0",
      "-e",
      "HOST=0.0.0.0",
      "-v",
      `${appDir}:/app`,
      "-w",
      "/app",
      image,
      "sh",
      "-c",
      startCommand,
    ];

    let processCrashed = false;
    let crashCode: number | null = null;

    const childProcess = spawn("docker", dockerArgs);

    childProcess.stdout.on("data", (data) => {
      console.log(`[Runner ${deploymentId}]: ${data}`.trimEnd());
    });
    childProcess.stderr.on("data", (data) => {
      console.error(`[Runner ${deploymentId}]: ${data}`.trimEnd());
    });
    childProcess.on("close", (code) => {
      console.log(
        `[Runner ${deploymentId}] Container exited with code ${code}`,
      );
      processCrashed = true;
      crashCode = code;
      this.instances.delete(deploymentId);
    });

    // Save instance immediately so concurrent requests don't double-spawn.
    this.instances.set(deploymentId, {
      port,
      process: childProcess,
      containerName,
      lastAccessed: Date.now(),
    });

    // Wait for the server to actually serve HTTP (framework cold start can take
    // several seconds); abort early if the container dies.
    console.log(`[Runner] Waiting for port ${port} to serve HTTP...`);
    const ready = await this.waitForHttp(
      port,
      60000,
      300,
      () => processCrashed,
    );

    if (!ready || processCrashed) {
      this.instances.delete(deploymentId);
      await this.exec("docker", ["rm", "-f", containerName]).catch(() => {});
      childProcess.kill();
      throw new Error(
        processCrashed
          ? `Deployment container exited with code ${crashCode} before serving traffic`
          : `Deployment server on port ${port} did not become ready within 60s`,
      );
    }

    console.log(`[Runner] Deployment ${deploymentId} ready on port ${port}`);
    return port;
  }
}

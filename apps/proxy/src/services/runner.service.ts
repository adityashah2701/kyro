import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { MinioStorageProvider } from "@kyro/storage";

interface RunningInstance {
  port: number;
  process: ChildProcess;
  lastAccessed: number;
}

export class RunnerService {
  private static instances = new Map<string, RunningInstance>();
  private static nextPort = 10000;

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

  /**
   * Gets a running instance for the given deployment.
   * If not running, it will download the artifact, start the server, and return the port.
   */
  public static async getInstance(
    deploymentId: string,
    artifactLocation: string,
    startCommand: string,
  ): Promise<number> {
    const existing = this.instances.get(deploymentId);
    if (existing) {
      existing.lastAccessed = Date.now();
      return existing.port;
    }

    console.log(`[Runner] Cold starting deployment ${deploymentId}...`);

    // 1. Download artifact to a temporary directory
    const tempDir = path.join(os.tmpdir(), "kyro-runners", deploymentId);

    // Clear directory if it exists to avoid stale files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }

    await this.storage.downloadDirectory(artifactLocation, tempDir);

    // 2. Assign a port
    const port = this.nextPort++;

    // 3. Start the process
    console.log(
      `[Runner] Executing '${startCommand}' in ${tempDir} on port ${port}...`,
    );

    const [cmd, ...args] = startCommand.split(" ");

    const childProcess = spawn(cmd, args, {
      cwd: tempDir,
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: "production",
      },
      shell: true, // Allow npm start, etc.
    });

    childProcess.stdout.on("data", (data) => {
      console.log(`[Runner ${deploymentId} stdout]: ${data}`);
    });

    childProcess.stderr.on("data", (data) => {
      console.error(`[Runner ${deploymentId} stderr]: ${data}`);
    });

    childProcess.on("close", (code) => {
      console.log(`[Runner ${deploymentId}] Process exited with code ${code}`);
      this.instances.delete(deploymentId);
    });

    // Save instance
    this.instances.set(deploymentId, {
      port,
      process: childProcess,
      lastAccessed: Date.now(),
    });

    // Wait a brief moment for the server to bind to the port
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`[Runner] Deployment ${deploymentId} started on port ${port}`);
    return port;
  }
}

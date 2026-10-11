// The `minio` npm package is a generic S3 client; it works with any S3 server (RustFS, ...).
import { Client as S3Client } from "minio";
import * as fs from "fs/promises";
import * as path from "path";
import * as mime from "mime-types";
import { Readable } from "stream";

export interface StorageProvider {
  /**
   * Uploads an entire directory recursively to the storage provider.
   * @param localDir The local directory path
   * @param prefix The prefix (folder) in the storage bucket
   */
  uploadDirectory(localDir: string, prefix: string): Promise<void>;

  /**
   * Uploads a single local file to the given object key.
   * @param localPath The local file path
   * @param objectName The full object key in the storage bucket
   */
  uploadFile(localPath: string, objectName: string): Promise<void>;

  /**
   * Downloads an entire directory recursively from the storage provider.
   * @param prefix The prefix (folder) in the storage bucket
   * @param localDir The local directory path
   */
  downloadDirectory(prefix: string, localDir: string): Promise<void>;

  /**
   * Downloads a specific file as a readable stream.
   * @param filePath The file path in the storage bucket
   */
  downloadStream(
    filePath: string,
  ): Promise<{ stream: Readable; contentType: string; size: number } | null>;

  /**
   * Cheaply checks whether an object exists (HEAD / statObject only, no body).
   * @param filePath The file path in the storage bucket
   */
  objectExists(filePath: string): Promise<boolean>;

  /**
   * Deletes every object under a folder-like prefix (e.g. "deployments/<id>").
   * The prefix is matched as a whole path segment, so "deployments/ab" never
   * touches "deployments/abc". Returns how many objects were deleted.
   * @param prefix The prefix (folder) in the storage bucket
   */
  removePrefix(prefix: string): Promise<number>;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucketName: string;

  constructor(
    config: {
      endPoint: string;
      port: number;
      useSSL: boolean;
      accessKey: string;
      secretKey: string;
    },
    bucketName: string,
  ) {
    this.client = new S3Client(config);
    this.bucketName = bucketName;
  }

  public async initialize(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) {
      await this.client.makeBucket(this.bucketName, "us-east-1");
    }
  }

  public async uploadDirectory(
    localDir: string,
    prefix: string,
  ): Promise<void> {
    // Never publish build-time secrets, even when the output dir is the
    // workspace root (".well-known" and other dotfiles are still uploaded).
    const isSecretFile = (name: string) =>
      name === ".git" || name === ".kyro-build.sh" || /^\.env(\.|$)/.test(name);

    async function getFiles(dir: string): Promise<string[]> {
      const dirents = (await fs.readdir(dir, { withFileTypes: true })).filter(
        (dirent) => !isSecretFile(dirent.name),
      );
      const files = await Promise.all(
        dirents.map((dirent) => {
          const res = path.resolve(dir, dirent.name);
          return dirent.isDirectory() ? getFiles(res) : res;
        }),
      );
      return Array.prototype.concat(...files);
    }

    const files = await getFiles(localDir);

    for (const file of files) {
      const relativePath = path.relative(localDir, file);
      // Ensure forward slashes for S3 object keys
      const objectName = path.posix.join(
        prefix,
        relativePath.split(path.sep).join(path.posix.sep),
      );

      const contentType = mime.lookup(file) || "application/octet-stream";
      await this.client.fPutObject(this.bucketName, objectName, file, {
        "Content-Type": contentType,
      });
    }
  }

  public async uploadFile(
    localPath: string,
    objectName: string,
  ): Promise<void> {
    const contentType = mime.lookup(localPath) || "application/octet-stream";
    await this.client.fPutObject(this.bucketName, objectName, localPath, {
      "Content-Type": contentType,
    });
  }

  public async downloadDirectory(
    prefix: string,
    localDir: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const objectsStream = this.client.listObjectsV2(
        this.bucketName,
        prefix,
        true,
      );
      const objects: string[] = [];

      objectsStream.on("data", (obj) => {
        if (obj.name) objects.push(obj.name);
      });

      objectsStream.on("error", (err) => reject(err));

      objectsStream.on("end", async () => {
        try {
          for (const objectName of objects) {
            // Remove the prefix from the objectName to get relative path
            const relativePath = objectName
              .substring(prefix.length)
              .replace(/^[/\\\\]/, "");
            const localPath = path.join(localDir, relativePath);

            await fs.mkdir(path.dirname(localPath), { recursive: true });
            await this.client.fGetObject(
              this.bucketName,
              objectName,
              localPath,
            );
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async removePrefix(prefix: string): Promise<number> {
    // Always match on a "/" boundary, and refuse anything that would be the
    // whole bucket or a top-level folder by accident.
    const folder = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!folder || folder.includes("..") || !folder.includes("/")) {
      throw new Error(`Refusing to delete unsafe prefix "${prefix}".`);
    }
    const keyPrefix = `${folder}/`;

    const names: string[] = [];
    for await (const obj of this.client.listObjectsV2(
      this.bucketName,
      keyPrefix,
      true,
    )) {
      if (obj.name) names.push(obj.name);
    }
    if (names.length === 0) return 0;

    // removeObjects batches by 1000 and, in quiet mode, returns only failures.
    const failures = await this.client.removeObjects(this.bucketName, names);
    if (failures.length > 0) {
      throw new Error(
        `Failed to delete ${failures.length} of ${names.length} objects under "${keyPrefix}".`,
      );
    }
    return names.length;
  }

  public async objectExists(filePath: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucketName, filePath);
      return true;
    } catch (error: any) {
      if (error.code === "NotFound" || error.code === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  public async downloadStream(
    filePath: string,
  ): Promise<{ stream: Readable; contentType: string; size: number } | null> {
    try {
      const stat = await this.client.statObject(this.bucketName, filePath);
      const stream = await this.client.getObject(this.bucketName, filePath);
      return {
        stream,
        contentType:
          stat.metaData["content-type"] || "application/octet-stream",
        size: stat.size,
      };
    } catch (error: any) {
      if (error.code === "NotFound" || error.code === "NoSuchKey") {
        return null;
      }
      throw error;
    }
  }
}

/**
 * Builds the provider from S3_* env vars. The old MINIO_* names still work as a
 * fallback so existing .env files keep running.
 */
export function createStorageFromEnv(
  env: Record<string, string | undefined> = process.env,
): S3StorageProvider {
  const get = (name: string) => env[`S3_${name}`] ?? env[`MINIO_${name}`];
  return new S3StorageProvider(
    {
      endPoint: get("ENDPOINT") || "localhost",
      port: parseInt(get("PORT") || "9000", 10),
      useSSL: get("USE_SSL") === "true",
      accessKey: get("ACCESS_KEY") || "kyro_admin",
      secretKey: get("SECRET_KEY") || "kyro_password",
    },
    get("BUCKET") || "kyro-deployments",
  );
}

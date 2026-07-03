import { Client as MinioClient } from "minio";
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
}

export class MinioStorageProvider implements StorageProvider {
  private client: MinioClient;
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
    this.client = new MinioClient(config);
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
    async function getFiles(dir: string): Promise<string[]> {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
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

import express from "express";
import { RoutingService } from "./services/routing.service";
import { MinioStorageProvider } from "@kyro/storage";
import path from "path";

const app = express();
const PORT = process.env.PROXY_PORT || 8000;

// Initialize Storage Provider
const storage = new MinioStorageProvider(
  {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "kyro_admin",
    secretKey: process.env.MINIO_SECRET_KEY || "kyro_password",
  },
  process.env.MINIO_BUCKET || "kyro-deployments",
);

app.use(async (req, res) => {
  const host = req.headers.host;
  if (!host) {
    return res.status(400).send("Bad Request: Missing Host header");
  }

  try {
    const route = await RoutingService.resolveHost(host);

    if (!route) {
      return res.status(404).send("Deployment not found or inactive.");
    }

    // Determine the requested file path
    // If root (/) is requested, default to /index.html
    let reqPath = req.path === "/" ? "/index.html" : req.path;

    // Construct the MinIO object path
    // artifactLocation looks like "deployments/{deploymentId}"
    let objectPath = path.posix.join(route.artifactLocation, reqPath);

    // Try fetching the stream
    let result = await storage.downloadStream(objectPath);

    // Single-Page Application (SPA) Fallback Routing
    // If the file doesn't exist and the request doesn't have an extension (like /dashboard),
    // fallback to index.html to let the client-side router handle it.
    if (!result && !path.extname(reqPath)) {
      objectPath = path.posix.join(route.artifactLocation, "/index.html");
      result = await storage.downloadStream(objectPath);
    }

    // HTML extension fallback (some servers try /about.html if /about is not found)
    if (!result && !path.extname(reqPath)) {
      objectPath = path.posix.join(route.artifactLocation, `${reqPath}.html`);
      result = await storage.downloadStream(objectPath);
    }

    if (!result) {
      return res.status(404).send("404 Not Found");
    }

    // Set headers and pipe stream
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Length", result.size);

    // Optional caching
    if (result.contentType.includes("text/html")) {
      res.setHeader("Cache-Control", "no-cache");
    } else {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }

    result.stream.pipe(res);
  } catch (error) {
    console.error(`[PROXY ERROR] Host: ${host} | Path: ${req.path}`, error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});

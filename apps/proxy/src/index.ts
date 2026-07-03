import express from "express";
import { RoutingService } from "./services/routing.service";
import { RunnerService } from "./services/runner.service";
import { MinioStorageProvider } from "@kyro/storage";
import path from "path";
import httpProxy from "http-proxy";

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

const proxyServer = httpProxy.createProxyServer({});

/**
 * Per-deployment cache of the serve mode: true = static files, false = live server.
 * Decided from the actual build output (presence of a root index.html), not from
 * project config — so any framework that emits a static site (Vite, CRA, Vue,
 * Angular, Astro, static HTML, Next static export) is served statically, and only
 * true SSR builds fall through to the runner. Probed once per artifact, then cached.
 */
const serveModeCache = new Map<string, boolean>();

async function isStaticDeployment(artifactLocation: string): Promise<boolean> {
  const cached = serveModeCache.get(artifactLocation);
  if (cached !== undefined) return cached;

  const hasIndex = await storage.objectExists(
    path.posix.join(artifactLocation, "index.html"),
  );
  serveModeCache.set(artifactLocation, hasIndex);
  return hasIndex;
}

// Handle proxy errors gracefully
proxyServer.on("error", (err, req, res) => {
  console.error("[HTTP Proxy Error]:", err);
  if (res && typeof (res as any).status === "function") {
    (res as express.Response)
      .status(502)
      .send("Bad Gateway: Backend server error");
  } else if (res && typeof (res as any).writeHead === "function") {
    (res as any).writeHead(502);
    (res as any).end("Bad Gateway: Backend server error");
  }
});

app.use(async (req, res, next) => {
  const host = req.headers.host;
  if (!host) {
    return res.status(400).send("Bad Request: Missing Host header");
  }

  try {
    const route = await RoutingService.resolveHost(host);

    if (!route) {
      return res.status(404).send("Deployment not found or inactive.");
    }

    // Decide how to serve this deployment from its actual build output, not from
    // project config. A build that produced a root index.html is a static site and
    // is always served from MinIO (fast + reliable). Only a build with no index.html
    // AND a configured start command is treated as a live server (SSR).
    const serveStatic = await isStaticDeployment(route.artifactLocation);

    // Dynamic Backend Routing (Serverless-style) — SSR builds only
    if (!serveStatic && route.startCommand) {
      try {
        const port = await RunnerService.getInstance(
          route.deploymentId,
          route.artifactLocation,
          route.startCommand,
          route.nodeVersion,
        );

        // Proxy the request to the dynamically spun-up local Node server
        return proxyServer.web(req, res, {
          target: `http://127.0.0.1:${port}`,
        });
      } catch (error) {
        console.error(
          `[Runner Error] Failed to start backend for ${host}:`,
          error,
        );
        return res.status(500).send("Failed to start backend service.");
      }
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

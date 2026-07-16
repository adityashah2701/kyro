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

    // Check for Maintenance Mode
    if (route.maintenanceMode) {
      const maintenanceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Under Maintenance</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'media',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Geist Mono"', 'monospace'],
            mono: ['"Geist Mono"', 'monospace']
          }
        }
      }
    }
  </script>
</head>
<body class="antialiased font-sans flex items-center justify-center min-h-screen p-4 bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100">
  <div class="max-w-md w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-neutral-800 rounded-xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent opacity-50 blur-xl pointer-events-none"></div>
    
    <div class="w-12 h-12 mb-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 z-10">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    </div>
    
    <h1 class="text-xl font-semibold mb-2 tracking-tight z-10">Site Under Maintenance</h1>
    <p class="text-gray-500 dark:text-neutral-400 text-sm leading-relaxed mb-6 z-10">
      This project is currently undergoing scheduled maintenance by its owner. It will be back online shortly.
    </p>
    
    <div class="w-full h-px bg-gray-100 dark:bg-neutral-800 mb-5 z-10"></div>
    
    <div class="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 dark:text-neutral-500 z-10">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      <span>Powered by Kyro</span>
    </div>
  </div>
</body>
</html>`;
      return res.status(503).send(maintenanceHtml);
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

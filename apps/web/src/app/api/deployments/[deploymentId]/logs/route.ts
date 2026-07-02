import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDeploymentDetails } from "@/features/deployment/services/deployment.service";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deploymentId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { deploymentId } = await params;

  const deployment = await getDeploymentDetails(deploymentId, session.user.id);
  if (!deployment) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Function to send data
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. If it's already completed, send existing logs if any and close
      if (
        deployment.status === "success" ||
        deployment.status === "failed" ||
        deployment.status === "cancelled"
      ) {
        const metadata = deployment.metadata as any;
        if (metadata?.buildLogs) {
          sendEvent(metadata.buildLogs);
        } else {
          sendEvent("No logs available.");
        }
        controller.close();
        return;
      }

      // 2. If it's active, subscribe to Redis channel
      const redisClient = new IORedis(redisConfig);
      const channel = `deployments:${deploymentId}:logs`;

      await redisClient.subscribe(channel);

      redisClient.on("message", (ch, message) => {
        if (ch === channel) {
          sendEvent(message);
        }
      });

      // Send initial connecting message or existing metadata logs if available
      const metadata = deployment.metadata as any;
      if (metadata?.buildLogs) {
        sendEvent(metadata.buildLogs);
      } else {
        sendEvent("Connecting to build logs...\n");
      }

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        redisClient.unsubscribe(channel);
        redisClient.quit();
        controller.close();
      });

      // Optional: keep alive ping every 15s to avoid connection drop
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(":\n\n")); // SSE comment as ping
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

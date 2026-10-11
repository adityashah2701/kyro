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

// One shared connection for history reads (a subscribed connection can't run LRANGE).
const globalForRedis = globalThis as unknown as { __logReader?: IORedis };
const getLogReader = () =>
  (globalForRedis.__logReader ??= new IORedis(redisConfig));

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
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // client already disconnected
        }
      };

      // 1. If it's already completed, send existing logs if any and close
      if (
        deployment.status === "success" ||
        deployment.status === "failed" ||
        deployment.status === "cancelled"
      ) {
        const metadata = deployment.metadata as Record<string, unknown> | null;
        if (metadata && typeof metadata.buildLogs === "string") {
          sendEvent(metadata.buildLogs);
        } else {
          sendEvent("No logs available.");
        }
        controller.close();
        return;
      }

      // 2. In progress: replay what was logged before this viewer connected,
      // then follow live. The worker numbers every chunk (`seq`), so history and
      // live messages join without gaps or duplicates.
      const channel = `deployments:${deploymentId}:logs`;
      const subscriber = new IORedis(redisConfig);

      let lastSeq = 0;
      let replayed = false;
      const early: { seq: number; message: string }[] = [];
      const emit = ({ seq, message }: { seq: number; message: string }) => {
        if (seq <= lastSeq) return;
        lastSeq = seq;
        sendEvent(message);
      };

      subscriber.on("message", (ch, raw) => {
        if (ch !== channel) return;
        try {
          const msg = JSON.parse(raw);
          if (replayed) emit(msg);
          else early.push(msg); // arrived while history was loading
        } catch {
          // ignore malformed messages
        }
      });

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":\n\n")); // SSE comment as ping
        } catch {
          // stream already closed
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(pingInterval);
        subscriber.quit().catch(() => {});
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      req.signal.addEventListener("abort", cleanup);

      try {
        // Subscribe first so nothing published during the history read is lost.
        await subscriber.subscribe(channel);
        const history = await getLogReader().lrange(`${channel}:history`, 0, -1);
        if (history.length === 0) sendEvent("Connecting to build logs...\n");
        history.forEach((message, i) => emit({ seq: i + 1, message }));
        replayed = true;
        early.forEach(emit);
      } catch (err) {
        console.error("Failed to stream deployment logs:", err);
        cleanup();
      }
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

"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export function LogViewer({ deploymentId }: { deploymentId: string }) {
  const [logs, setLogs] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we have initial logs and they aren't empty, it might be a finished deployment.
    // However, the SSE endpoint handles returning the final logs too.

    const eventSource = new EventSource(
      `/api/deployments/${deploymentId}/logs`
    );

    eventSource.onopen = () => {
      setIsConnecting(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => prev + data);
      } catch (e) {
        // SSE comments or other data
      }
    };

    eventSource.onerror = () => {
      // If it closes or errors, we don't necessarily want to show an error if it just ended.
      eventSource.close();
      setIsConnecting(false);
    };

    return () => {
      eventSource.close();
    };
  }, [deploymentId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <ScrollArea className="flex-1 overflow-auto rounded-lg bg-[oklch(0.14_0_0)] p-4 font-mono text-xs text-success/90 ring-1 ring-white/10">
      {isConnecting && !logs && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting to logs...</span>
        </div>
      )}
      <pre className="whitespace-pre-wrap break-all">
        {logs || "No logs available."}
      </pre>
      <div ref={bottomRef} />
    </ScrollArea>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LogConnectionStatus = "connecting" | "open" | "closed" | "error";

type UseDeploymentLogsOptions = {
  /** When true, keep the SSE connection open (deployment still in progress). */
  live?: boolean;
};

/**
 * Streams build logs for a deployment from the SSE endpoint and accumulates
 * them into a stable array of individual lines (not one growing string), so a
 * virtualized list can render them efficiently.
 */
export function useDeploymentLogs(
  deploymentId: string,
  { live = true }: UseDeploymentLogsOptions = {}
) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<LogConnectionStatus>("connecting");
  const [attempt, setAttempt] = useState(0);

  const [currentId, setCurrentId] = useState(deploymentId);
  if (deploymentId !== currentId) {
    setCurrentId(deploymentId);
    setLines([]);
    setStatus("connecting");
    setAttempt(0);
  }

  // Buffer holding a not-yet-terminated trailing line across chunks.
  const partialRef = useRef("");
  const sourceRef = useRef<EventSource | null>(null);

  const retry = useCallback(() => {
    partialRef.current = "";
    setLines([]);
    setStatus("connecting");
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    partialRef.current = "";

    const source = new EventSource(`/api/deployments/${deploymentId}/logs`);
    sourceRef.current = source;

    source.onopen = () => setStatus("open");

    source.onmessage = (event) => {
      let chunk: string;
      try {
        chunk = JSON.parse(event.data);
      } catch {
        return;
      }
      if (typeof chunk !== "string") return;

      const combined = partialRef.current + chunk;
      const parts = combined.split("\n");
      // The last element is an incomplete line unless the chunk ended with "\n".
      partialRef.current = parts.pop() ?? "";
      if (parts.length > 0) {
        setLines((prev) => [...prev, ...parts]);
      }
    };

    source.onerror = () => {
      // The endpoint closes the stream when a deployment is terminal; treat a
      // clean close (readyState CLOSED) as done rather than an error.
      source.close();
      if (partialRef.current) {
        const remainder = partialRef.current;
        partialRef.current = "";
        setLines((prev) => [...prev, remainder]);
      }
      setStatus((prev) => (prev === "open" ? "closed" : "error"));
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
    // `live` intentionally excluded: closing/opening is driven by the endpoint.
  }, [deploymentId, attempt]);

  return { lines, status, retry, isLive: live && status === "open" };
}

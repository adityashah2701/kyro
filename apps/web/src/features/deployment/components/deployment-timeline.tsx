import { CheckCircle2, XCircle, Clock, Loader2, Rocket } from "lucide-react";
import { format } from "date-fns";
import { formatDuration, computeStageDurations } from "../utils";
import { isPendingStatus } from "../types";

type TimelineInput = {
  status: string;
  queuedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  buildDuration: number | null;
};

/**
 * An honest event timeline built purely from the timestamps we actually store
 * (queuedAt / startedAt / completedAt). Events without a timestamp are omitted
 * rather than fabricated — we never guess which stage a build failed at.
 */
export function DeploymentTimeline({
  deployment,
}: {
  deployment: TimelineInput;
}) {
  const { queueWaitMs, buildMs } = computeStageDurations(deployment);
  const isFailed = deployment.status === "failed";
  const isCancelled = deployment.status === "cancelled";
  const isPending = isPendingStatus(deployment.status);

  const events: {
    key: string;
    label: string;
    at: Date | null;
    hint?: string | null;
    icon: React.ReactNode;
  }[] = [];

  if (deployment.queuedAt) {
    events.push({
      key: "queued",
      label: "Queued",
      at: deployment.queuedAt,
      hint:
        queueWaitMs != null ? `waited ${formatDuration(queueWaitMs)}` : null,
      icon: <Clock className="size-4 text-muted-foreground" />,
    });
  }

  if (deployment.startedAt) {
    events.push({
      key: "started",
      label: "Build started",
      at: deployment.startedAt,
      hint: buildMs != null ? `ran ${formatDuration(buildMs)}` : null,
      icon: <Rocket className="size-4 text-info" />,
    });
  }

  if (deployment.completedAt) {
    events.push({
      key: "completed",
      label: isFailed ? "Failed" : isCancelled ? "Cancelled" : "Completed",
      at: deployment.completedAt,
      hint:
        deployment.buildDuration != null
          ? `build ${formatDuration(deployment.buildDuration)}`
          : null,
      icon:
        isFailed || isCancelled ? (
          <XCircle className="size-4 text-destructive" />
        ) : (
          <CheckCircle2 className="size-4 text-success" />
        ),
    });
  }

  // While a build is still running, surface a live "in progress" marker.
  if (isPending) {
    events.push({
      key: "in-progress",
      label: "In progress…",
      at: null,
      icon: <Loader2 className="size-4 animate-spin text-info" />,
    });
  }

  if (events.length === 0) return null;

  return (
    <ol className="space-y-4">
      {events.map((event, i) => (
        <li key={event.key} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            {event.icon}
            {i !== events.length - 1 && (
              <div className="mt-1.5 h-6 w-px bg-border" />
            )}
          </div>
          <div className="pt-0.5">
            <p className="text-sm font-medium">{event.label}</p>
            <p className="text-xs text-muted-foreground">
              {event.at ? format(new Date(event.at), "MMM d, HH:mm:ss") : "—"}
              {event.hint ? ` · ${event.hint}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

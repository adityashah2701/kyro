/**
 * Formatting + timing helpers for deployments. Everything here is derived
 * from real DB fields — no fabricated values.
 */

/** Human-readable build duration from milliseconds (e.g. 4200 -> "4s", 65000 -> "1m 5s"). */
export function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || ms < 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/** Human-readable byte size (e.g. 1536 -> "1.5 KB"). */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes < 0) return null;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

type StageTiming = {
  queuedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

/**
 * Derive real elapsed timings from the deployment's timestamps.
 * Returns null durations when the corresponding timestamps are missing so the
 * UI can simply omit them rather than show a fabricated value.
 */
export function computeStageDurations(d: StageTiming) {
  const queued = d.queuedAt ? new Date(d.queuedAt).getTime() : null;
  const started = d.startedAt ? new Date(d.startedAt).getTime() : null;
  const completed = d.completedAt ? new Date(d.completedAt).getTime() : null;

  const queueWaitMs =
    queued != null && started != null ? Math.max(0, started - queued) : null;
  const buildMs =
    started != null && completed != null
      ? Math.max(0, completed - started)
      : null;
  const totalMs =
    queued != null && completed != null
      ? Math.max(0, completed - queued)
      : null;

  return { queueWaitMs, buildMs, totalMs };
}

/** Local scheme/port handling for a stored previewUrl (mirrors existing table logic). */
export function buildPreviewLink(previewUrl: string): string {
  const isLocal = previewUrl.includes("localhost");
  const scheme = isLocal ? "http" : "https";
  const portSuffix = isLocal ? ":8000" : "";
  return `${scheme}://${previewUrl}${portSuffix}`;
}

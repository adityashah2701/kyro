import type { DeploymentStatus } from "@kyro/shared";

/**
 * Shape of the `deployment.metadata` jsonb column, written by the worker
 * (see apps/worker/src/services/artifact.service.ts + processor.ts).
 * All fields are best-effort — treat every one as possibly absent.
 */
export type DeploymentMetadata = {
  framework?: string;
  nodeVersion?: string;
  packageManager?: string;
  outputDirectory?: string;
  serveMode?: string;
  logFile?: string;
  buildLogs?: string;
};

/** In-progress statuses (a build is actively moving through the pipeline). */
export const PENDING_STATUSES: DeploymentStatus[] = [
  "queued",
  "initializing",
  "cloning",
  "installing",
  "building",
  "uploading",
  "deploying",
];

/** Terminal statuses (no further work will happen). */
export const TERMINAL_STATUSES: DeploymentStatus[] = [
  "success",
  "failed",
  "cancelled",
];

export function isPendingStatus(status: string): boolean {
  return PENDING_STATUSES.includes(status as DeploymentStatus);
}

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as DeploymentStatus);
}

/** Narrow an unknown metadata value to the typed shape. */
export function parseDeploymentMetadata(
  metadata: unknown
): DeploymentMetadata | null {
  if (!metadata || typeof metadata !== "object") return null;
  return metadata as DeploymentMetadata;
}

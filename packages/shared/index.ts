export type DeploymentStatus =
  | "queued"
  | "initializing"
  | "cloning"
  | "installing"
  | "building"
  | "uploading"
  | "deploying"
  | "success"
  | "failed"
  | "cancelled";

export type QueueJobData = {
  deploymentId: string;
};

/** Job name "purge-artifacts": delete storage left behind by a deleted project. */
export type PurgeJobData = {
  prefixes: string[];
};

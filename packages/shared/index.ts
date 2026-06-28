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

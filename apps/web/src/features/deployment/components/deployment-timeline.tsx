import { DeploymentStatus } from "./deployment-status-badge";
import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

const STAGES: DeploymentStatus[] = [
  "queued",
  "initializing",
  "cloning",
  "installing",
  "building",
  "uploading",
  "deploying",
  "success",
];

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  initializing: "Initializing Environment",
  cloning: "Cloning Repository",
  installing: "Installing Dependencies",
  building: "Building Application",
  uploading: "Uploading Artifacts",
  deploying: "Activating Deployment",
  success: "Completed",
};

export function DeploymentTimeline({
  currentStatus,
}: {
  currentStatus: DeploymentStatus | string;
}) {
  const isFailed = currentStatus === "failed";
  const isCancelled = currentStatus === "cancelled";

  let currentIndex = STAGES.indexOf(currentStatus as DeploymentStatus);
  if (currentIndex === -1) {
    if (isFailed || isCancelled) {
      // If failed or cancelled, we don't necessarily know which stage it failed at without more DB data.
      // For now, we assume it stopped at some point. A real app might store `failedAtStage`.
      currentIndex = 1;
    } else {
      currentIndex = 0;
    }
  }

  return (
    <div className="space-y-6">
      {STAGES.map((stage, index) => {
        const isCompleted =
          index < currentIndex ||
          (currentStatus === "success" && index <= currentIndex);
        const isCurrent =
          index === currentIndex &&
          !isFailed &&
          !isCancelled &&
          currentStatus !== "success";
        const isFailurePoint =
          index === currentIndex && (isFailed || isCancelled);

        return (
          <div key={stage} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : isFailurePoint ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <CircleDashed className="w-5 h-5 text-muted-foreground/50" />
              )}
              {index !== STAGES.length - 1 && (
                <div
                  className={`w-px h-6 mt-2 ${isCompleted ? "bg-green-500" : "bg-border"}`}
                />
              )}
            </div>
            <div className="pt-0.5">
              <p
                className={`text-sm font-medium ${isCurrent || isCompleted || isFailurePoint ? "text-foreground" : "text-muted-foreground"}`}
              >
                {STAGE_LABELS[stage]}
              </p>
              {isFailurePoint && (
                <p className="text-xs text-destructive mt-1">
                  {isFailed ? "Failed at this stage" : "Deployment cancelled"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

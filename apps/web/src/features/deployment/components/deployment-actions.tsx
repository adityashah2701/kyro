"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RotateCw, Ban, CheckCheck } from "lucide-react";
import { cancelDeploymentAction, retryDeploymentAction } from "../actions";
import { isPendingStatus } from "../types";
import { buildPreviewLink } from "../utils";

type ActionableDeployment = {
  id: string;
  status: string;
  active: boolean | null;
  previewUrl: string | null;
  projectId: string;
};

/**
 * Cancel / retry / activate / visit controls for a single deployment.
 * Shared by the deployment detail header and the history table so the two
 * surfaces never drift apart.
 */
export function DeploymentActions({
  deployment,
  size = "sm",
  showVisit = true,
}: {
  deployment: ActionableDeployment;
  size?: "sm" | "default";
  showVisit?: boolean;
}) {
  const [processing, setProcessing] = useState<null | string>(null);
  const router = useRouter();

  const canCancel = isPendingStatus(deployment.status);
  const canRetry = ["failed", "cancelled"].includes(deployment.status);
  const canActivate = deployment.status === "success" && !deployment.active;

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    try {
      setProcessing(key);
      await fn();
      toast.success(ok);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Action failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showVisit && deployment.previewUrl && (
        <Button
          variant="outline"
          size={size}
          nativeButton={false}
          render={
            <a
              href={buildPreviewLink(deployment.previewUrl)}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <ExternalLink className="size-4" />
          Visit
        </Button>
      )}

      {canActivate && (
        <Button
          variant="outline"
          size={size}
          disabled={processing !== null}
          onClick={() =>
            run(
              "activate",
              async () => {
                const res = await fetch(
                  `/api/deployments/${deployment.id}/activate`,
                  { method: "POST" }
                );
                if (!res.ok) throw new Error("Failed to activate");
              },
              "Deployment activated."
            )
          }
        >
          {processing === "activate" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          Activate
        </Button>
      )}

      {canRetry && (
        <Button
          size={size}
          disabled={processing !== null}
          onClick={() =>
            run(
              "retry",
              () => retryDeploymentAction(deployment.id, deployment.projectId),
              "Deployment queued for retry."
            )
          }
        >
          {processing === "retry" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCw className="size-4" />
          )}
          Retry
        </Button>
      )}

      {canCancel && (
        <Button
          variant="destructive"
          size={size}
          disabled={processing !== null}
          onClick={() =>
            run(
              "cancel",
              () => cancelDeploymentAction(deployment.id, deployment.projectId),
              "Deployment cancelled."
            )
          }
        >
          {processing === "cancel" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Ban className="size-4" />
          )}
          Cancel
        </Button>
      )}
    </div>
  );
}

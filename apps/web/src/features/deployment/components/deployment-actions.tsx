"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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
      const toastId = toast.loading("Processing...");
      await fn();
      toast.success(ok, { id: toastId });
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Action failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const hasActions =
    canCancel ||
    canRetry ||
    canActivate ||
    (showVisit && deployment.previewUrl);

  if (!hasActions) return <div className="w-8 h-8" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 outline-none"
        )}
        disabled={processing !== null}
      >
        {processing !== null ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] bg-card border-border/50 shadow-xl"
      >
        {showVisit && deployment.previewUrl && (
          <DropdownMenuItem
            render={
              <a
                href={buildPreviewLink(deployment.previewUrl)}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink className="size-4" />
            <span>Visit</span>
          </DropdownMenuItem>
        )}

        {showVisit &&
          deployment.previewUrl &&
          (canActivate || canRetry || canCancel) && <DropdownMenuSeparator />}

        {canActivate && (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
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
            <CheckCheck className="size-4" />
            <span>Instant Rollback</span>
          </DropdownMenuItem>
        )}

        {canRetry && (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() =>
              run(
                "retry",
                () =>
                  retryDeploymentAction(deployment.id, deployment.projectId),
                "Deployment queued for retry."
              )
            }
          >
            <RotateCw className="size-4" />
            <span>Redeploy</span>
          </DropdownMenuItem>
        )}

        {canCancel && (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            variant="destructive"
            onClick={() =>
              run(
                "cancel",
                () =>
                  cancelDeploymentAction(deployment.id, deployment.projectId),
                "Deployment cancelled."
              )
            }
          >
            <Ban className="size-4" />
            <span>Cancel</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

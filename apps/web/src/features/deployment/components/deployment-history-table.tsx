"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cancelDeploymentAction, retryDeploymentAction } from "../actions";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type DeploymentData = {
  id: string;
  deploymentNumber: number;
  branch: string;
  triggerType: string;
  status: string;
  createdAt: Date;
  buildDuration: number | null;
  previewUrl: string | null;
  active: boolean | null;
};

export function DeploymentHistoryTable({
  deployments,
  projectId,
}: {
  deployments: DeploymentData[];
  projectId: string;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if any deployment is in a pending state
    const hasPending = deployments.some((d) =>
      [
        "queued",
        "initializing",
        "cloning",
        "installing",
        "building",
        "uploading",
        "deploying",
      ].includes(d.status)
    );

    if (hasPending) {
      const interval = setInterval(() => {
        router.refresh();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [deployments, router]);

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card text-center">
        <p className="text-muted-foreground">No deployments found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Deploy this project to see the history here.
        </p>
      </div>
    );
  }

  const handleCancel = async (deploymentId: string) => {
    try {
      setProcessingId(deploymentId);
      await cancelDeploymentAction(deploymentId, projectId);
      toast.success("Deployment cancelled.");
    } catch (e) {
      toast.error("Failed to cancel deployment.");
      console.log(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetry = async (deploymentId: string) => {
    try {
      setProcessingId(deploymentId);
      await retryDeploymentAction(deploymentId, projectId);
      toast.success("Deployment queued for retry!");
    } catch (e) {
      toast.error("Failed to retry deployment.");
      console.log(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (deploymentId: string) => {
    try {
      setProcessingId(deploymentId);
      const res = await fetch(`/api/deployments/${deploymentId}/activate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to activate");
      toast.success("Deployment activated! (Rollback successful)");
      router.refresh();
    } catch (e) {
      toast.error("Failed to activate deployment.");
      console.log(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deployment</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Preview URL</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((d) => {
            const isProcessing = processingId === d.id;
            const canCancel = [
              "queued",
              "initializing",
              "cloning",
              "installing",
              "building",
              "uploading",
              "deploying",
            ].includes(d.status);
            const canRetry = ["failed", "cancelled"].includes(d.status);

            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  #{d.deploymentNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.branch}
                </TableCell>
                <TableCell>
                  <DeploymentStatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {d.buildDuration
                    ? `${Math.round(d.buildDuration / 1000)}s`
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {d.previewUrl ? (
                    <a
                      href={`http://${d.previewUrl}:8000`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {d.previewUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(d.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {isProcessing ? (
                    <Button variant="ghost" size="sm" disabled>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </Button>
                  ) : (
                    <>
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(d.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {canRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(d.id)}
                        >
                          Retry
                        </Button>
                      )}
                      {d.status === "success" && !d.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(d.id)}
                        >
                          Activate
                        </Button>
                      )}
                      {d.active && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded ml-2">
                          Active
                        </span>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

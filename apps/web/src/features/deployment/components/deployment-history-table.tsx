"use client";

import { DeploymentActions } from "./deployment-actions";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useEffect } from "react";
import {
  GitBranch,
  Rocket,
  ArrowUpCircle,
  GitCommitHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { isPendingStatus } from "../types";
import { formatDuration } from "../utils";

type DeploymentData = {
  id: string;
  deploymentNumber: number;
  branch: string;
  commitSha?: string | null;
  commitMessage?: string | null;
  commitAuthorName?: string | null;
  production?: boolean | null;
  triggerType: string;
  status: string;
  createdAt: Date;
  buildDuration: number | null;
  previewUrl: string | null;
  active: boolean | null;
  metadata?: Record<string, unknown>;
  project?: { name: string; slug: string } | null;
  projectId?: string;
};

export function DeploymentHistoryTable({
  deployments,
  projectId,
}: {
  deployments: DeploymentData[];
  projectId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const hasPending = deployments.some((d) => isPendingStatus(d.status));
    if (hasPending) {
      const interval = setInterval(() => router.refresh(), 2500);
      return () => clearInterval(interval);
    }
  }, [deployments, router]);

  if (deployments.length === 0) {
    return (
      <EmptyState
        icon={Rocket}
        title="No deployments yet"
        description="Deploy this project to see its build history here."
      />
    );
  }

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden bg-card/40">
      {deployments.map((d, i) => {
        console.log({ d });
        const itemProjectId = d.projectId || projectId;
        const isProduction = d.production;
        const commitMessage =
          d.commitMessage || `Manual Deployment #${d.deploymentNumber}`;
        const isLast = i === deployments.length - 1;

        let statusColor = "bg-muted-foreground";
        let statusText = "Queued";
        if (d.status === "success") {
          statusColor = "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]";
          statusText = "Ready";
        } else if (d.status === "failed") {
          statusColor = "bg-destructive";
          statusText = "Error";
        } else if (d.status === "building") {
          statusColor = "bg-amber-500 animate-pulse";
          statusText = "Building";
        }

        return (
          <div
            key={d.id}
            onClick={() => router.push(`/deployments/${d.id}`)}
            className={`grid grid-cols-[minmax(200px,3.5fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(140px,1.5fr)_minmax(110px,1fr)_48px] gap-4 items-center px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer ${
              !isLast ? "border-b border-border/50" : ""
            }`}
          >
            {/* Primary Column: Commit Message */}
            <div className="min-w-0 pr-2">
              <span className="text-[14px] font-medium text-foreground line-clamp-1">
                {commitMessage}
              </span>
            </div>

            {/* Status & Duration */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span className="text-[13px] font-medium text-foreground">
                  {statusText}
                </span>
              </div>
            </div>

            {/* Environment Badge */}
            <div className="flex items-center">
              <Badge
                variant={d.active ? "default" : "outline"}
                className={`font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 w-max text-[11px] transition-colors ${
                  d.active
                    ? "bg-[#0070F3] hover:bg-[#0070F3]/90 text-white border-0 shadow-none"
                    : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpCircle className="w-3 h-3" />
                {isProduction ? "Production" : "Preview"}
              </Badge>
            </div>

            {/* Git Branch & SHA */}
            <div className="flex items-center gap-3 text-muted-foreground text-[13px] font-mono min-w-0">
              <div className="flex items-center gap-1 min-w-0 shrink">
                <GitCommitHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {d.commitSha ? d.commitSha.substring(0, 7) : "-"}
                </span>
              </div>
              <div className="flex items-center gap-1 min-w-0 shrink">
                <GitBranch className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{d.branch}</span>
              </div>
            </div>

            {/* Created At */}
            <div className="text-right text-[13px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(d.createdAt), {
                addSuffix: true,
              }).replace("about ", "")}
            </div>

            {/* Actions Menu */}
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DeploymentActions
                showVisit={false}
                deployment={{
                  id: d.id,
                  status: d.status,
                  active: d.active,
                  previewUrl: d.previewUrl,
                  projectId: itemProjectId,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

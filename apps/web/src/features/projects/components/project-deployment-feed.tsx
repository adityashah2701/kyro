"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  GitBranch,
  Rocket,
  GitCommitHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { isPendingStatus } from "@/features/deployment/types";
import { formatDuration } from "@/features/deployment/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { type DeploymentData } from "./project-dashboard-view";

export function ProjectDeploymentFeed({
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
    <div className="flex flex-col gap-3">
      {deployments.map((d) => {
        const isSuccess = d.status === "success";
        const isFailed = d.status === "failed";
        const isPending = isPendingStatus(d.status);

        return (
          <Link
            key={d.id}
            href={`/deployments/${d.id}`}
            className="group relative flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/30 transition-all hover:bg-muted/40 hover:border-border/60 hover:shadow-sm"
          >
            {/* Left side: Status Indicator & Commit info */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  {isPending && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isSuccess
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : isFailed
                          ? "bg-destructive"
                          : "bg-amber-500"
                    }`}
                  ></span>
                </span>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium text-foreground line-clamp-1 max-w-[280px] sm:max-w-[450px]">
                    {d.commitMessage ||
                      `Manual Deployment #${d.deploymentNumber}`}
                  </p>
                  {d.active && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <GitBranch className="size-3" />
                    <span className="truncate max-w-[120px]">{d.branch}</span>
                  </div>
                  {d.commitSha && (
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <GitCommitHorizontal className="size-3" />
                      <span>{d.commitSha.substring(0, 7)}</span>
                    </div>
                  )}
                  <span className="opacity-50">•</span>
                  <span>
                    {formatDistanceToNow(new Date(d.createdAt), {
                      addSuffix: true,
                    }).replace("about ", "")}
                  </span>
                  {d.buildDuration != null && (
                    <>
                      <span className="opacity-50">•</span>
                      <span>{formatDuration(d.buildDuration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Arrow icon on hover */}
            <div className="shrink-0 pl-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-200">
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

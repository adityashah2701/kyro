"use client";

import { useState } from "react";
import { SettingsCard } from "../settings-card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeploymentLog {
  id: string;
  deploymentNumber: number;
  status: string;
  branch: string;
  commitMessage: string | null;
  commitSha: string | null;
  buildDuration: number | null;
  createdAt: string;
  logs: string | null;
}

interface LogsTabProps {
  deployments: DeploymentLog[];
}

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    label: "Success",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    label: "Failed",
  },
  queued: {
    icon: Clock,
    color: "text-yellow-500",
    label: "Queued",
  },
  building: {
    icon: Loader2,
    color: "text-blue-500",
    label: "Building",
  },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LogsTab({ deployments }: LogsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        layout="column"
        title="Deployment Logs"
        description="Build logs for your recent deployments. Click on a deployment to view its full build output."
      >
        {deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Terminal className="size-8 text-muted-foreground mb-4" />
            <span className="text-sm text-muted-foreground">
              No deployments yet. Deploy your project to see build logs here.
            </span>
          </div>
        ) : (
          <div className="flex flex-col border border-border/60 rounded-lg overflow-hidden">
            {deployments.map((dep, i) => {
              const isExpanded = expandedId === dep.id;
              const config = statusConfig[dep.status] || statusConfig.queued;
              const StatusIcon = config.icon;

              return (
                <div
                  key={dep.id}
                  className={cn(
                    "flex flex-col",
                    i !== deployments.length - 1 && "border-b border-border/40"
                  )}
                >
                  {/* Header Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left w-full"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    )}

                    <StatusIcon
                      className={cn(
                        "size-4 shrink-0",
                        config.color,
                        dep.status === "building" && "animate-spin"
                      )}
                    />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">
                          #{dep.deploymentNumber}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {dep.commitMessage || "Manual deployment"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {dep.branch}
                        {dep.commitSha ? ` · ${dep.commitSha.slice(0, 7)}` : ""}
                      </span>
                      <span>{formatDuration(dep.buildDuration)}</span>
                      <span>{formatRelativeTime(dep.createdAt)}</span>
                    </div>
                  </button>

                  {/* Expanded Log Output */}
                  {isExpanded && (
                    <div className="bg-[#0d1117] text-[#c9d1d9] px-4 py-4 max-h-[400px] overflow-y-auto border-t border-border/20">
                      {dep.logs ? (
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
                          {dep.logs}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No logs available for this deployment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

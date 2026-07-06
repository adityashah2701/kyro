"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { DeploymentActions } from "./deployment-actions";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useEffect } from "react";
import { ExternalLink, GitBranch, Rocket, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { isPendingStatus } from "../types";
import { formatDuration, buildPreviewLink } from "../utils";

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

  const showProjectColumn = deployments.some((d) => d.project);

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>Deployment</TableHead>
            {showProjectColumn && <TableHead>Project</TableHead>}
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
            const itemProjectId = d.projectId || projectId;
            const duration = formatDuration(d.buildDuration);
            return (
              <TableRow key={d.id}>
                <TableCell className="font-semibold">
                  <Link
                    href={`/deployments/${d.id}`}
                    className="inline-flex items-center gap-2 hover:text-primary"
                  >
                    #{d.deploymentNumber}
                    {d.active && (
                      <Badge className="border-0 bg-success/10 text-success">
                        Active
                      </Badge>
                    )}
                  </Link>
                </TableCell>
                {d.project && (
                  <TableCell>
                    <div className="font-medium">{d.project.name}</div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{d.branch}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DeploymentStatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {duration ?? "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {d.previewUrl ? (
                    <PreviewCell previewUrl={d.previewUrl} />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(d.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="View build logs"
                      nativeButton={false}
                      render={<Link href={`/deployments/${d.id}/logs`} />}
                    >
                      <ScrollText className="h-4 w-4" />
                    </Button>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PreviewCell({ previewUrl }: { previewUrl: string }) {
  const previewLink = buildPreviewLink(previewUrl);
  return (
    <div className="group flex items-center gap-1.5">
      <a
        href={previewLink}
        target="_blank"
        rel="noreferrer"
        className="max-w-[150px] truncate text-foreground transition-colors hover:text-primary sm:max-w-[200px]"
        title={previewUrl}
      >
        {previewUrl.length > 28
          ? previewUrl.substring(0, 28) + "…"
          : previewUrl}
      </a>
      <div className="flex items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <CopyButton
          value={previewLink}
          size="icon-xs"
          label="Copy URL"
          toastMessage="URL copied to clipboard"
        />
        <a
          href={previewLink}
          target="_blank"
          rel="noreferrer"
          title="Open link"
          aria-label="Open preview in new tab"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

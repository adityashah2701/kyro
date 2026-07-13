"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Settings,
  ExternalLink,
  GitBranch,
  Globe,
  CheckCircle2,
  Clock,
  GitCommitHorizontal,
  XCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildPreviewLink, formatDuration } from "@/features/deployment/utils";
import { ProjectDeploymentFeed } from "./project-deployment-feed";

export type ProjectData = {
  id: string;
  name: string;
  framework: string;
  status: string;
};

export type DeploymentData = {
  id: string;
  deploymentNumber: number;
  branch: string;
  commitSha: string | null;
  commitMessage: string | null;
  commitAuthorName: string | null;
  status: string;
  createdAt: Date;
  buildDuration: number | null;
  active: boolean | null;
};

export function ProjectDashboardView({
  project,
  deployments,
  mainHost,
}: {
  project: ProjectData;
  deployments: DeploymentData[];
  mainHost: string;
}) {
  const activeDeployment = deployments.find((d) => d.active) || deployments[0];
  const url = buildPreviewLink(mainHost);

  return (
    <div className="flex flex-col space-y-12 pb-12 w-full max-w-5xl mx-auto">
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            <Badge
              variant="outline"
              className="bg-muted/30 text-muted-foreground font-medium rounded-full px-3 py-0.5 border-border/50"
            >
              {project.framework}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <Globe className="size-4" />
              <span className="group-hover:underline underline-offset-4">
                {mainHost}
              </span>
              <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>

            <div
              className="flex items-center gap-1.5 cursor-default"
              title="Project Status"
            >
              <span className="relative flex h-2 w-2">
                {project.status === "active" ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
                )}
              </span>
              <span className="capitalize">{project.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/settings?projectId=${project.id}`} />}
            className="h-9 transition-all hover:bg-muted/50"
          >
            <Settings className="size-4 mr-2 text-muted-foreground" />
            Settings
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
            className="h-9 shadow-sm hover:shadow-md transition-all"
          >
            Visit
          </Button>
        </div>
      </header>

      {/* Production Vitals */}
      {activeDeployment && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
            Production Deployment
          </h2>
          <div className="group rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:border-border/60 hover:bg-card/60">
            <div className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr_1fr] gap-8 md:gap-4 items-center">
              {/* Left Column: Commit Info */}
              <div className="flex flex-col gap-3 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {activeDeployment.branch}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-medium truncate text-foreground">
                    {activeDeployment.commitMessage || "No commit message"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[13px] text-muted-foreground">
                    {activeDeployment.commitSha && (
                      <span className="flex items-center gap-1 font-mono">
                        <GitCommitHorizontal className="size-3.5" />
                        {activeDeployment.commitSha.substring(0, 7)}
                      </span>
                    )}
                    {activeDeployment.commitAuthorName && (
                      <span>
                        by{" "}
                        <span className="text-foreground/80">
                          {activeDeployment.commitAuthorName}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Status */}
              <div className="flex flex-col gap-1.5 md:pl-6 md:border-l md:border-border/40">
                <dt className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </dt>
                <dd className="flex items-center gap-2 mt-1">
                  {activeDeployment.status === "success" ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : activeDeployment.status === "failed" ? (
                    <XCircle className="size-4 text-destructive" />
                  ) : (
                    <Loader2 className="size-4 text-amber-500 animate-spin" />
                  )}
                  <span className="text-[14px] font-medium capitalize">
                    {activeDeployment.status === "success"
                      ? "Ready"
                      : activeDeployment.status}
                  </span>
                </dd>
              </div>

              {/* Right Column: Deployed Time */}
              <div className="flex flex-col gap-1.5 md:pl-6 md:border-l md:border-border/40">
                <dt className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  Deployed
                </dt>
                <dd className="flex flex-col mt-1 text-[14px] font-medium">
                  {formatDistanceToNow(new Date(activeDeployment.createdAt), {
                    addSuffix: true,
                  })}
                  {activeDeployment.buildDuration != null && (
                    <span className="text-[12px] text-muted-foreground font-normal mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      in {formatDuration(activeDeployment.buildDuration)}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Deployment Feed */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
          Deployment History
        </h2>
        <ProjectDeploymentFeed
          deployments={deployments}
          projectId={project.id}
        />
      </section>
    </div>
  );
}

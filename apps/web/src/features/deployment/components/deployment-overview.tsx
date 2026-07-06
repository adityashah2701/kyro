import { GitCommit, GitBranch, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CopyButton } from "@/components/ui/copy-button";
import { DeploymentTimeline } from "./deployment-timeline";
import { parseDeploymentMetadata } from "../types";
import { formatDuration, formatBytes, buildPreviewLink } from "../utils";

type OverviewDeployment = {
  status: string;
  commitSha: string | null;
  commitMessage: string | null;
  commitAuthorName: string | null;
  committedAt: Date | null;
  branch: string;
  triggerType: string;
  buildDuration: number | null;
  queuedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  previewUrl: string | null;
  artifactSize: number | null;
  checksum: string | null;
  metadata: unknown;
};

/** A labelled definition row; renders nothing when the value is empty. */
function Field({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  if (children == null || children === "") return null;
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function DeploymentOverview({
  deployment,
}: {
  deployment: OverviewDeployment;
}) {
  const meta = parseDeploymentMetadata(deployment.metadata);
  const duration = formatDuration(deployment.buildDuration);
  const size = formatBytes(deployment.artifactSize);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
      <div className="flex flex-col gap-6">
        {/* Commit Details Card */}
        {(deployment.commitSha || deployment.commitMessage) && (
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="border-b px-5 py-4 bg-muted/40 flex items-center justify-between">
              <h3 className="text-sm font-medium">Source</h3>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <GitBranch className="size-3.5" />
                {deployment.branch}
              </span>
            </div>
            <div className="p-5 flex items-start gap-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted border">
                <GitCommit className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {deployment.commitMessage || "No commit message"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted-foreground">
                  {deployment.commitSha && (
                    <span className="inline-flex items-center gap-1.5 font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                      {deployment.commitSha.substring(0, 7)}
                      <CopyButton
                        value={deployment.commitSha}
                        size="icon-xs"
                        label="Copy commit SHA"
                        className="size-4 hover:bg-transparent"
                      />
                    </span>
                  )}
                  {deployment.commitAuthorName && (
                    <span className="flex items-center gap-1.5">
                      by{" "}
                      <span className="font-medium text-foreground">
                        {deployment.commitAuthorName}
                      </span>
                    </span>
                  )}
                  {deployment.committedAt && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {formatDistanceToNow(new Date(deployment.committedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Deployment Metadata Card */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-4 bg-muted/40">
            <h3 className="text-sm font-medium">Deployment Details</h3>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
              <Field label="Trigger">
                <span className="capitalize">{deployment.triggerType}</span>
              </Field>
              <Field label="Build Duration">{duration}</Field>
              <Field label="Output Size">{size}</Field>
              <Field label="Framework">{meta?.framework}</Field>
              <Field label="Node Version">{meta?.nodeVersion}</Field>
              <Field label="Package Manager">{meta?.packageManager}</Field>
              <Field label="Output Directory">{meta?.outputDirectory}</Field>
              <Field label="Serve Mode">{meta?.serveMode}</Field>

              {deployment.previewUrl && (
                <div className="col-span-2 min-w-0 sm:col-span-3">
                  <dt className="text-[13px] font-medium text-muted-foreground">
                    Preview URL
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <a
                      href={buildPreviewLink(deployment.previewUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium text-foreground hover:underline underline-offset-4"
                    >
                      {deployment.previewUrl}
                    </a>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </dd>
                </div>
              )}
              {deployment.checksum && (
                <div className="col-span-2 min-w-0 sm:col-span-3">
                  <dt className="text-[13px] font-medium text-muted-foreground">
                    Checksum
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="truncate font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {deployment.checksum}
                    </span>
                    <CopyButton
                      value={deployment.checksum}
                      size="icon-xs"
                      label="Copy checksum"
                    />
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      </div>

      {/* Timeline */}
      <section className="rounded-xl border bg-card shadow-sm p-5 sticky top-6">
        <h2 className="mb-5 text-sm font-medium tracking-tight border-b pb-4">
          Timeline
        </h2>
        <DeploymentTimeline deployment={deployment} />
      </section>
    </div>
  );
}

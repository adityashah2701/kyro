import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  FolderOpen,
  Rocket,
  CircleCheck,
  Radio,
  ArrowRight,
  GitBranch,
  Globe,
  TerminalSquare,
  Activity,
} from "lucide-react";

import { db } from "@kyro/database";
import { project, deployment } from "@kyro/database/schema";
import { eq, and, ne, desc } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeploymentStatusBadge } from "@/features/deployment/components/deployment-status-badge";
import { getProjectDeployments } from "@/features/deployment/services/deployment.service";
import { DeploymentHistoryTable } from "@/features/deployment/components/deployment-history-table";
import { DomainService } from "@/features/domains/services/domain.service";

export const metadata = { title: "Dashboard | Kyro" };

export default async function DashboardPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const projectId = searchParams.projectId;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  if (projectId) {
    const projectData = await db.query.project.findFirst({
      where: and(eq(project.id, projectId), eq(project.userId, userId)),
    });

    if (!projectData) {
      notFound();
    }

    const deployments = await getProjectDeployments(projectId);
    const deploymentDataList = deployments.map((d) => ({
      id: d.id,
      deploymentNumber: d.deploymentNumber,
      branch: d.branch,
      commitSha: d.commitSha,
      commitMessage: d.commitMessage,
      commitAuthorName: d.commitAuthorName,
      production: d.production,
      triggerType: d.triggerType,
      status: d.status,
      createdAt: d.createdAt,
      buildDuration: d.buildDuration,
      previewUrl: d.previewUrl,
      active: d.active,
      metadata: d.metadata as Record<string, unknown> | undefined,
    }));

    const projectDomains = await DomainService.getProjectDomains(projectId);
    const verifiedPrimaryDomain = projectDomains.find(
      (d) => d.isPrimary && d.verificationStatus === "verified"
    );

    const baseDomain = process.env.BASE_DOMAIN || "localhost";
    const mainHost = verifiedPrimaryDomain
      ? verifiedPrimaryDomain.hostname
      : `${projectData.slug}.${baseDomain}`;

    return (
      <PageContainer className="space-y-8">
        <PageHeader title={projectData.name} description="Project Overview" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Framework"
            value={projectData.framework}
            icon={TerminalSquare}
            accent
          />
          <StatCard
            label="Deployments"
            value={deployments.length}
            icon={Rocket}
          />
          <StatCard
            label="Domain"
            value={
              <span className="text-lg" title={mainHost}>
                {mainHost}
              </span>
            }
            icon={Globe}
          />
          <StatCard
            label="Status"
            value={<span className="capitalize">{projectData.status}</span>}
            icon={Activity}
          />
        </div>

        <div>
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            Recent Deployments
          </h2>
          <DeploymentHistoryTable
            deployments={deploymentDataList.slice(0, 5)}
            projectId={projectId}
          />
        </div>
      </PageContainer>
    );
  }

  // Real data — read-only queries over existing tables, no schema/API changes.
  const [projects, deployments] = await Promise.all([
    db.query.project.findMany({
      where: and(eq(project.userId, userId), ne(project.status, "archived")),
      orderBy: (p, { desc: d }) => [d(p.updatedAt)],
    }),
    db.query.deployment.findMany({
      where: eq(deployment.userId, userId),
      orderBy: [desc(deployment.createdAt)],
    }),
  ]);

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const successful = deployments.filter((d) => d.status === "success").length;
  const active = deployments.filter((d) => d.active).length;
  const recentProjects = projects.slice(0, 4);
  const recentDeployments = deployments.slice(0, 5);

  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here's what's happening across your projects.`}
      >
        <Button nativeButton={false} render={<Link href="/projects?new=1" />}>
          <Plus className="size-4" />
          New Project
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={projects.length}
          icon={FolderOpen}
          accent
        />
        <StatCard
          label="Deployments"
          value={deployments.length}
          icon={Rocket}
        />
        <StatCard label="Successful" value={successful} icon={CircleCheck} />
        <StatCard label="Active" value={active} icon={Radio} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent projects */}
        <section className="space-y-4">
          <SectionHeader
            title="Recent Projects"
            action={
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/projects" />}
              >
                View all
                <ArrowRight className="size-3.5" />
              </Button>
            }
          />
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Create your first project to start deploying."
              action={
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/projects?new=1" />}
                >
                  <Plus className="size-4" />
                  New Project
                </Button>
              }
            />
          ) : (
            <div className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard?projectId=${p.id}`}
                  className="flex items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <FolderOpen className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.framework} ·{" "}
                      {formatDistanceToNow(new Date(p.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent deployments */}
        <section className="space-y-4">
          <SectionHeader title="Recent Deployments" />
          {recentDeployments.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No deployments yet"
              description="Link a repository and deploy to see activity here."
            />
          ) : (
            <div className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
              {recentDeployments.map((d) => {
                const proj = projectsById.get(d.projectId);
                const inner = (
                  <>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <GitBranch className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {proj?.name ?? "Project"}{" "}
                        <span className="text-muted-foreground">
                          #{d.deploymentNumber}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.branch} ·{" "}
                        {formatDistanceToNow(new Date(d.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <DeploymentStatusBadge status={d.status} />
                  </>
                );
                return proj ? (
                  <Link
                    key={d.id}
                    href={`/deployments/${d.id}`}
                    className="flex items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 bg-card px-4 py-3"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

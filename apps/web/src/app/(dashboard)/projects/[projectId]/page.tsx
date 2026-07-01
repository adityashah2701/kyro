import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { StatCard } from "@/components/ui/stat-card";
import { db } from "@kyro/database";
import { project, projectRepository } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Globe,
  TerminalSquare,
  Activity,
  ExternalLink,
} from "lucide-react";
import { GitBranch } from "lucide-react";
import Link from "next/link";
import { RepositoryPicker } from "@/features/github/components/repository-picker";
import { disconnectRepository } from "@/features/github/actions";
import { getProjectDeployments } from "@/features/deployment/services/deployment.service";
import { DeployButton } from "@/features/deployment/components/deploy-button";
import { DeploymentHistoryTable } from "@/features/deployment/components/deployment-history-table";
import { DomainsTab } from "@/features/domains/components/domains-tab";
import { DomainService } from "@/features/domains/services/domain.service";
import { EnvTab } from "@/features/environment/components/env-tab";
import { EnvService } from "@/features/environment/services/env.service";

export default async function ProjectDetailsPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return null;
  }

  const projectData = await db.query.project.findFirst({
    where: and(
      eq(project.id, params.projectId),
      eq(project.userId, session.user.id)
    ),
  });

  if (!projectData) {
    notFound();
  }

  const linkedRepo = await db.query.projectRepository.findFirst({
    where: eq(projectRepository.projectId, params.projectId),
  });

  const deployments = await getProjectDeployments(params.projectId);

  // Cast deployments to match expected types roughly in history table
  const deploymentDataList = deployments.map((d) => ({
    id: d.id,
    deploymentNumber: d.deploymentNumber,
    branch: d.branch,
    triggerType: d.triggerType,
    status: d.status,
    createdAt: d.createdAt,
    buildDuration: d.buildDuration,
    previewUrl: d.previewUrl,
    active: d.active,
  }));

  const projectDomains = await DomainService.getProjectDomains(
    params.projectId
  );
  const envVariables = await EnvService.getVariables(params.projectId);
  const verifiedPrimaryDomain = projectDomains.find(
    (d) => d.isPrimary && d.verificationStatus === "verified"
  );

  const mainHost = verifiedPrimaryDomain
    ? verifiedPrimaryDomain.hostname
    : `${projectData.slug}.localhost`;

  return (
    <PageContainer>
      <div className="mb-6 flex items-center text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{projectData.name}</span>
      </div>

      <PageHeader
        title={projectData.name}
        description={
          projectData.description ||
          `Manage deployments and settings for ${projectData.name}`
        }
      >
        <div className="flex gap-2">
          <DeployButton
            projectId={params.projectId}
            isRepositoryLinked={!!linkedRepo}
          />
          <a href={`http://${mainHost}:8000`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit
            </Button>
          </a>
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
                <span className="text-lg" title={`${mainHost}:8000`}>
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

          <div className="mt-8">
            <h2 className="mb-4 text-base font-semibold tracking-tight">
              Recent Deployments
            </h2>
            <DeploymentHistoryTable
              deployments={deploymentDataList.slice(0, 5)}
              projectId={params.projectId}
            />
          </div>
        </TabsContent>

        <TabsContent value="deployments">
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500">
            {linkedRepo ? (
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {linkedRepo.owner}/{linkedRepo.repositoryName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Branch: {linkedRepo.selectedBranch}
                      </p>
                    </div>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await disconnectRepository(params.projectId);
                    }}
                  >
                    <Button variant="destructive" size="sm">
                      Disconnect
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <RepositoryPicker projectId={params.projectId} />
              </div>
            )}

            <div className="mt-4">
              <h2 className="mb-4 text-base font-semibold tracking-tight">
                Deployment History
              </h2>
              <DeploymentHistoryTable
                deployments={deploymentDataList}
                projectId={params.projectId}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domains">
          <DomainsTab domains={projectDomains} projectId={params.projectId} />
        </TabsContent>

        <TabsContent value="env">
          <EnvTab variables={envVariables} projectId={params.projectId} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-2xl space-y-4">
            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold tracking-tight">
                Project Settings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage general settings for this project.
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="mt-0.5 font-medium">{projectData.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Slug</dt>
                  <dd className="mt-0.5 font-medium">{projectData.slug}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Visibility</dt>
                  <dd className="mt-0.5 font-medium capitalize">
                    {projectData.visibility}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Framework</dt>
                  <dd className="mt-0.5 font-medium">
                    {projectData.framework}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

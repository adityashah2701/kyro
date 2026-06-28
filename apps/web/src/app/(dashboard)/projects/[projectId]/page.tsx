import { PageHeader } from "@/components/layout/page-header";
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
  }));

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
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
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit
          </Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Framework
                </h3>
                <TerminalSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {projectData.framework}
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Deployments
                </h3>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {deployments.length}
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Domains</h3>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">0</div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Status</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2 capitalize">
                {projectData.status}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Recent Deployments</h3>
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
              <h3 className="text-lg font-medium mb-4">Deployment History</h3>
              <DeploymentHistoryTable
                deployments={deploymentDataList}
                projectId={params.projectId}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domains">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Domains content placeholder
          </div>
        </TabsContent>

        <TabsContent value="env">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Environment variables placeholder
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Settings placeholder
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

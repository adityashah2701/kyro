import { db } from "@kyro/database";
import { project, projectRepository } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProjectDeployments } from "@/features/deployment/services/deployment.service";
import { DeploymentHistoryTable } from "@/features/deployment/components/deployment-history-table";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disconnectRepository,
  linkRepositoryToProject,
} from "@/features/github/actions";
import { RepositoryCommand } from "@/features/github/components/repository-command";

export default async function DeploymentsPage(props: {
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
    metadata: d.metadata as Record<string, unknown> | undefined,
  }));

  return (
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
        <RepositoryCommand
          onSelect={async (repo) => {
            "use server";
            await linkRepositoryToProject(params.projectId, repo);
          }}
          emptyHint="No repositories found. Connect your GitHub account in settings."
        />
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
  );
}

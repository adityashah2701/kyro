import Link from "next/link";
import { Rocket, FolderOpen } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserDeployments } from "@/features/deployment/services/deployment.service";
import { DeploymentHistoryTable } from "@/features/deployment/components/deployment-history-table";

export const metadata = { title: "Deployments | Kyro" };

export default async function DeploymentsPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const projectId = searchParams.projectId;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const deployments = await getUserDeployments(session.user.id, projectId);

  // Cast deployments to match expected types
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
    project: d.project,
    projectId: d.projectId,
  }));
  return (
    <PageContainer>
      <PageHeader
        title="Deployments"
        description="Track the status of all your recent deployments."
      />

      {deploymentDataList.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No deployments yet"
          description="Deployments are triggered per project. Open a project and push code or deploy manually to see builds here."
          action={
            <Button nativeButton={false} render={<Link href="/projects" />}>
              <FolderOpen className="size-4" />
              Go to Projects
            </Button>
          }
        />
      ) : (
        <div className="mt-6">
          <DeploymentHistoryTable
            deployments={deploymentDataList}
            projectId={""} // Pass empty string as we don't need projectId for global table actions if we disable them, wait actions require projectId
          />
        </div>
      )}
    </PageContainer>
  );
}

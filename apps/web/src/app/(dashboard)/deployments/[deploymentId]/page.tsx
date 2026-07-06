import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { auth } from "@/lib/auth";
import { getDeploymentWithProject } from "@/features/deployment/services/deployment.service";
import { DeploymentDetailHeader } from "@/features/deployment/components/deployment-detail-header";
import { DeploymentOverview } from "@/features/deployment/components/deployment-overview";
import { DeploymentLiveRefresh } from "@/features/deployment/components/deployment-live-refresh";

export default async function DeploymentDetailPage(props: {
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const deployment = await getDeploymentWithProject(
    deploymentId,
    session.user.id
  );
  if (!deployment) notFound();

  return (
    <PageContainer>
      <DeploymentDetailHeader
        deployment={deployment}
        project={deployment.project}
      />

      <div className="mt-8">
        <DeploymentOverview deployment={deployment} />
      </div>

      <DeploymentLiveRefresh status={deployment.status} />
    </PageContainer>
  );
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { auth } from "@/lib/auth";
import { getDeploymentWithProject } from "@/features/deployment/services/deployment.service";
import { DeploymentDetailHeader } from "@/features/deployment/components/deployment-detail-header";
import { DeploymentLiveRefresh } from "@/features/deployment/components/deployment-live-refresh";
import { LogTerminal } from "@/features/deployment/components/log-terminal";
import { isPendingStatus } from "@/features/deployment/types";

export default async function DeploymentLogsPage(props: {
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

  const live = isPendingStatus(deployment.status);

  return (
    <>
      <PageContainer className="pb-0 sm:pb-0">
        <DeploymentDetailHeader
          deployment={deployment}
          project={deployment.project}
        />
      </PageContainer>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 rounded-xs">
        <LogTerminal
          deploymentId={deployment.id}
          deploymentNumber={deployment.deploymentNumber}
          live={live}
        />
      </div>

      <DeploymentLiveRefresh status={deployment.status} />
    </>
  );
}

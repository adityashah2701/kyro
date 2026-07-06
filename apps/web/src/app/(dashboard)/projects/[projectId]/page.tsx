import { StatCard } from "@/components/ui/stat-card";
import { db } from "@kyro/database";
import { project } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Rocket, Globe, TerminalSquare, Activity } from "lucide-react";
import { getProjectDeployments } from "@/features/deployment/services/deployment.service";
import { DeploymentHistoryTable } from "@/features/deployment/components/deployment-history-table";
import { DomainService } from "@/features/domains/services/domain.service";

export default async function ProjectOverviewPage(props: {
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

  const projectDomains = await DomainService.getProjectDomains(
    params.projectId
  );
  const verifiedPrimaryDomain = projectDomains.find(
    (d) => d.isPrimary && d.verificationStatus === "verified"
  );

  const baseDomain = process.env.BASE_DOMAIN || "localhost";
  const mainHost = verifiedPrimaryDomain
    ? verifiedPrimaryDomain.hostname
    : `${projectData.slug}.${baseDomain}`;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
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
          projectId={params.projectId}
        />
      </div>
    </div>
  );
}
